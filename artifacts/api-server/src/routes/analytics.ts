import { Router } from "express";
import { eq, and, count, avg, sql } from "drizzle-orm";
import { db, chatbotsTable, documentsTable, conversationsTable, messagesTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import {
  GetChatbotAnalyticsParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/chatbots/:id/analytics", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = GetChatbotAnalyticsParams.safeParse(req.params);
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

  const [convCount] = await db
    .select({ count: count() })
    .from(conversationsTable)
    .where(eq(conversationsTable.chatbotId, params.data.id));

  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(eq(conversationsTable.chatbotId, params.data.id));

  const totalConversations = Number(convCount?.count ?? 0);
  const totalMessages = Number(msgCount?.count ?? 0);
  const avgMsgs = totalConversations > 0 ? totalMessages / totalConversations : 0;

  const recentConversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.chatbotId, params.data.id))
    .orderBy(sql`${conversationsTable.updatedAt} DESC`)
    .limit(5);

  res.json({
    chatbotId: params.data.id,
    totalConversations,
    totalMessages,
    avgMessagesPerConversation: Math.round(avgMsgs * 10) / 10,
    recentConversations,
  });
});

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);

  const userBots = await db
    .select({ id: chatbotsTable.id, status: chatbotsTable.status })
    .from(chatbotsTable)
    .where(eq(chatbotsTable.userId, userId));

  const botIds = userBots.map((b) => b.id);

  if (botIds.length === 0) {
    res.json({
      totalChatbots: 0,
      totalDocuments: 0,
      totalConversations: 0,
      totalMessages: 0,
      activeChatbots: 0,
    });
    return;
  }

  const [docCount] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(sql`${documentsTable.chatbotId} = ANY(${sql.raw(`ARRAY[${botIds.join(",")}]::int[]`)})`);

  const [convCount] = await db
    .select({ count: count() })
    .from(conversationsTable)
    .where(sql`${conversationsTable.chatbotId} = ANY(${sql.raw(`ARRAY[${botIds.join(",")}]::int[]`)})`);

  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(sql`${conversationsTable.chatbotId} = ANY(${sql.raw(`ARRAY[${botIds.join(",")}]::int[]`)})`);

  const activeChatbots = userBots.filter((b) => b.status === "active").length;

  res.json({
    totalChatbots: userBots.length,
    totalDocuments: Number(docCount?.count ?? 0),
    totalConversations: Number(convCount?.count ?? 0),
    totalMessages: Number(msgCount?.count ?? 0),
    activeChatbots,
  });
});

export default router;
