import { Router } from "express";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { db, chatbotsTable, conversationsTable, messagesTable } from "@workspace/db";
import { getRelevantContext, generateAIResponse } from "../lib/rag";
import { WidgetChatBody, WidgetChatParams } from "@workspace/api-zod";

const router = Router();

// ─── Neon Serverless SQL client (for raw rate-limit query) ───────────────────
const neonSql = neon(process.env.DATABASE_URL!);

// ─── Constants ───────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 5;
const CONFIDENCE_THRESHOLD = 0.5;

// ─── Helper: Parse AI reply that may contain a confidence score ──────────────
function parseAIOutput(raw: string): { reply: string; confidence: number } {
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.reply === "string" && typeof parsed.confidence === "number") {
        return {
          reply: parsed.reply.trim(),
          confidence: Math.min(1, Math.max(0, parsed.confidence)),
        };
      }
    }
  } catch {
    // not JSON, fall through
  }

  const tagMatch = raw.match(/\[confidence:\s*([\d.]+)\]/i);
  if (tagMatch) {
    return {
      reply: raw.replace(tagMatch[0], "").trim(),
      confidence: Math.min(1, Math.max(0, parseFloat(tagMatch[1]))),
    };
  }

  return { reply: raw.trim(), confidence: 1.0 };
}

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
    // FIX (Critical Issue #1): arguments were reversed. Signature is
    // getRelevantContext(query: unknown, chatbotId: number, maxChunks?).
    // Previously called as (bot.id, parsed.data.message) — swapped.
    const context = await getRelevantContext(parsed.data.message, bot.id);

    // ── 9. Resolve visitor ID ─────────────────────────────────────────────────
    const activeVisitorId = conversation.visitorId ?? parsed.data.visitorId ?? null;

    // ── 10. Generate AI response via Groq (Llama-3) ──────────────────────────
    const confidenceInstruction = `
After your reply, on the same line at the very end, append exactly this tag (replace X.XX with your actual score):
[confidence:X.XX]
The score must be a decimal between 0.00 and 1.00 reflecting how well your answer is supported by the provided document context.
- 1.00 = fully answered from context
- 0.50 = partially answered or uncertain
- 0.00 = not found in context at all
Do NOT explain the score. Just append the tag silently.`;

    const rawReply = await generateAIResponse(
      bot.systemPrompt,
      context + "\n\n" + confidenceInstruction,
      conversationHistory,
      parsed.data.message,
      {
        chatbotId: bot.id,
        visitorId: activeVisitorId,
      }
    );

    // ── 11. Parse reply and extract confidence score ──────────────────────────
    const { reply, confidence } = parseAIOutput(rawReply);

    // ── 12. Human Handover Decision Logic ────────────────────────────────────
    if (confidence < CONFIDENCE_THRESHOLD) {
      await db
        .update(conversationsTable)
        .set({
          needs_human_review: true,
          last_unanswered_query: parsed.data.message,
        })
        .where(eq(conversationsTable.id, conversation.id));

      console.log(
        `[Handover] Conversation ${conversation.id} flagged for human review. ` +
        `Confidence: ${confidence.toFixed(2)} | Query: "${parsed.data.message}"`
      );
    }

    // ── 13. Persist messages WITH confidence_score, user_ip, request_timestamp
    // FIX (this bug): must be an actual Date object, not a string. Drizzle's
    // PgTimestamp.mapToDriverValue calls `.toISOString()` on the value itself,
    // so passing an already-stringified date breaks it (strings have no
    // .toISOString method) -> "TypeError: value.toISOString is not a function"
    const now = new Date();

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
        user_ip: userIp,
        request_timestamp: now,
        confidence_score: confidence.toFixed(2),
      },
    ]);

    // ── 14. Update conversation message count ─────────────────────────────────
    await db
      .update(conversationsTable)
      .set({ messageCount: (conversation.messageCount ?? 0) + 2 })
      .where(eq(conversationsTable.id, conversation.id));

    // ── 15. Send response to user (always, regardless of confidence) ──────────
    res.json({
      reply,
      confidence,
      needsHumanReview: confidence < CONFIDENCE_THRESHOLD,
      sessionId: parsed.data.sessionId,
      conversationId: conversation.id,
    });

  } catch (routeErr) {
    console.error("Route error catched:", routeErr);
    res.status(500).json({ error: "Internal server error occurred." });
  }
});

export default router;
