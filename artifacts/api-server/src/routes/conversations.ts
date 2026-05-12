import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, conversationsTable, messagesTable, chatbotsTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import {
  ListConversationsParams,
  ListMessagesParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/chatbots/:id/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = ListConversationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .select()
    .from(chatbotsTable)
    .where(and(eq(chatbotsTable.id, params.data.id), eq(chatbotsTable.userId, userId)));

  if (!bot) {
    res.status(404).json({ error: "Chatbot not found" });
    return;
  }

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.chatbotId, params.data.id))
    .orderBy(conversationsTable.updatedAt);

  res.json(conversations);
});

router.get("/chatbots/:id/conversations/:convId/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .select()
    .from(chatbotsTable)
    .where(and(eq(chatbotsTable.id, params.data.id), eq(chatbotsTable.userId, userId)));

  if (!bot) {
    res.status(404).json({ error: "Chatbot not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.convId))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

export default router;
