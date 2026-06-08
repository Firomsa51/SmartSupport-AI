import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { db, chatbotsTable, conversationsTable, messagesTable } from "@workspace/db";
import { getRelevantContext, generateAIResponse } from "../lib/rag";
import { WidgetChatBody, WidgetChatParams } from "@workspace/api-zod";

const router = Router();

// ─── Neon Serverless SQL client (for raw rate-limit query) ───────────────────
const neonSql = neon(process.env.DATABASE_URL!);

// ─── Helper: Extract real client IP from Vercel / Express headers ────────────
function extractClientIp(req: Parameters<typeof router.post>[1] extends (req: infer R, ...args: any[]) => any ? R : never): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? req.ip ?? "unknown";
}

// ─── Constants ───────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 5;          // max messages
const RATE_LIMIT_WINDOW = "1 minute"; // window

router.post("/widget/:chatbotUid/chat", async (req, res): Promise<void> => {
  try {
    // ── 1. Validate route params ─────────────────────────────────────────────
    const params = WidgetChatParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    // ── 2. Validate request body ─────────────────────────────────────────────
    const parsed = WidgetChatBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    // ── 3. Extract client IP (Vercel-aware) ──────────────────────────────────
    const userIp: string =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.socket?.remoteAddress ??
      req.ip ??
      "unknown";

    // ── 4. Rate Limit Check via Neon (raw SQL, fast path) ────────────────────
    const rateLimitRows = await neonSql(
      `SELECT COUNT(*) AS cnt
         FROM messages
        WHERE user_ip = $1
          AND request_timestamp > NOW() - INTERVAL '1 minute'`,
      [userIp]
    );

    const requestCount = parseInt((rateLimitRows[0] as { cnt: string }).cnt, 10);

    if (requestCount > RATE_LIMIT_MAX) {
      res.status(429).json({
        error: `Too many requests. Please slow down. Maximum ${RATE_LIMIT_MAX} messages per minute allowed.`,
      });
      return;
    }

    // ── 5. Fetch chatbot record ───────────────────────────────────────────────
    const [bot] = await db
      .select()
      .from(chatbotsTable)
      .where(eq(chatbotsTable.uid, params.data.chatbotUid));

    if (!bot || bot.status !== "active") {
      res.status(404).json({ error: "Chatbot not found or inactive" });
      return;
    }

    // ── 6. Resolve or create conversation ────────────────────────────────────
    let conversation = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.sessionId, parsed.data.sessionId))
      .then((rows) => rows[0]);

    if (!conversation) {
      const [newConv] = await db
        .insert(conversationsTable)
        .values({
          chatbotId: bot.id,
          sessionId: parsed.data.sessionId,
          visitorId: parsed.data.visitorId ?? null,
          messageCount: 0,
        })
        .returning();
      conversation = newConv;
    }

    // ── 7. Load recent conversation history (last 16 messages) ───────────────
    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversation.id))
      .orderBy(messagesTable.createdAt)
      .limit(16);

    const conversationHistory = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // ── 8. RAG: get relevant context from knowledge base ─────────────────────
    const context = await getRelevantContext(bot.id, parsed.data.message);

    // ── 9. Resolve visitor ID ─────────────────────────────────────────────────
    const activeVisitorId = conversation.visitorId ?? parsed.data.visitorId ?? null;

    // ── 10. Generate AI response via Groq (Llama-3) ──────────────────────────
    const reply = await generateAIResponse(
      bot.systemPrompt,
      context,
      conversationHistory,
      parsed.data.message,
      {
        chatbotId: bot.id,
        visitorId: activeVisitorId,
      }
    );

    // ── 11. Persist messages WITH user_ip & request_timestamp ────────────────
    const now = new Date().toISOString();

    await db.insert(messagesTable).values([
      {
        conversationId: conversation.id,
        role: "user",
        content: parsed.data.message,
        user_ip: userIp,
        request_timestamp: now,
      },
      {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        user_ip: userIp,           // tag assistant row too — keeps audit trail clean
        request_timestamp: now,
      },
    ]);

    // ── 12. Update conversation message count ─────────────────────────────────
    await db
      .update(conversationsTable)
      .set({ messageCount: (conversation.messageCount ?? 0) + 2 })
      .where(eq(conversationsTable.id, conversation.id));

    // ── 13. Send response ─────────────────────────────────────────────────────
    res.json({
      reply,
      sessionId: parsed.data.sessionId,
      conversationId: conversation.id,
    });

  } catch (routeErr) {
    console.error("Route error catched:", routeErr);
    res.status(500).json({ error: "Internal server error occurred." });
  }
});

export default router;
