import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, conversationsTable, messagesTable, chatbotsTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";

const router = Router();

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────
// Returns all conversations flagged for human review (needs_human_review = true)
// belonging to chatbots owned by the authenticated user, with latest confidence.
router.get("/admin/reviews", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = getUserId(req);

    // Get all chatbot IDs owned by this user
    const bots = await db
      .select({ id: chatbotsTable.id })
      .from(chatbotsTable)
      .where(eq(chatbotsTable.userId, userId));

    if (bots.length === 0) {
      res.json([]);
      return;
    }

    const botIds = bots.map((b) => b.id);

    // Fetch all flagged conversations for this user's chatbots
    const conversations = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.needs_human_review, true))
      .orderBy(desc(conversationsTable.updatedAt));

    // Filter to only this user's chatbots
    const owned = conversations.filter((c) => botIds.includes(c.chatbotId));

    // For each conversation, fetch the latest assistant message confidence score
    const results = await Promise.all(
      owned.map(async (conv) => {
        const [latestMsg] = await db
          .select({ confidence_score: messagesTable.confidence_score })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.conversationId, conv.id),
              eq(messagesTable.role, "assistant")
            )
          )
          .orderBy(desc(messagesTable.createdAt))
          .limit(1);

        const rawScore = latestMsg?.confidence_score ?? null;
        const latestConfidence =
          rawScore !== null
            ? Math.round(parseFloat(String(rawScore)) * 100)
            : null;

        return {
          id: conv.id,
          sessionId: conv.sessionId,
          visitorId: conv.visitorId,
          last_unanswered_query: conv.last_unanswered_query,
          updatedAt: conv.updatedAt,
          latestConfidence,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("GET /admin/reviews error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/admin/reviews/:id/resolve ─────────────────────────────────────
// Marks a conversation as resolved — sets needs_human_review = false
// and clears last_unanswered_query.
router.patch("/admin/reviews/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = getUserId(req);
    const convId = parseInt(req.params.id, 10);

    if (isNaN(convId)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }

    // Verify the conversation belongs to a chatbot owned by this user
    const [conv] = await db
      .select({ id: conversationsTable.id, chatbotId: conversationsTable.chatbotId })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const [bot] = await db
      .select({ id: chatbotsTable.id })
      .from(chatbotsTable)
      .where(
        and(
          eq(chatbotsTable.id, conv.chatbotId),
          eq(chatbotsTable.userId, userId)
        )
      );

    if (!bot) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Mark as resolved
    await db
      .update(conversationsTable)
      .set({
        needs_human_review: false,
        last_unanswered_query: null,
      })
      .where(eq(conversationsTable.id, convId));

    res.json({ success: true, conversationId: convId });
  } catch (err) {
    console.error("PATCH /admin/reviews/:id/resolve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
