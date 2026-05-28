import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, chatbotsTable, conversationsTable, messagesTable } from "@workspace/db";
import { getRelevantContext, generateAIResponse } from "../lib/rag";
import { WidgetChatBody, WidgetChatParams } from "@workspace/api-zod";

const router = Router();

router.post("/widget/:chatbotUid/chat", async (req, res): Promise<void> => {
  try {
    const params = WidgetChatParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = WidgetChatBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [bot] = await db
      .select()
      .from(chatbotsTable)
      .where(eq(chatbotsTable.uid, params.data.chatbotUid));

    if (!bot || bot.status !== "active") {
      res.status(404).json({ error: "Chatbot not found or inactive" });
      return;
    }

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

    const context = await getRelevantContext(bot.id, parsed.data.message);
    
    // Visitor ID argachuu (Yoo lamaan dhabame null ta'a)
    const activeVisitorId = conversation.visitorId ?? parsed.data.visitorId ?? null;

    // Object bifa kanaan dabarra akka 'rag.ts' wajjin wal simuuf
    const reply = await generateAIResponse(
      bot.systemPrompt,
      context,
      conversationHistory,
      parsed.data.message,
      {
        chatbotId: bot.id,
        visitorId: activeVisitorId // anonymous_user dhiifnee null dabarra crash jifachuuf
      }
    );

    await db.insert(messagesTable).values([
      { conversationId: conversation.id, role: "user", content: parsed.data.message },
      { conversationId: conversation.id, role: "assistant", content: reply },
    ]);

    await db
      .update(conversationsTable)
      .set({ messageCount: (conversation.messageCount ?? 0) + 2 })
      .where(eq(conversationsTable.id, conversation.id));

    res.json({ reply, sessionId: parsed.data.sessionId, conversationId: conversation.id });
  } catch (routeErr) {
    // Tasuma handler-ri gubbaa kun akka hin dhooneef safe catch
    console.error("Route error catched:", routeErr);
    res.status(500).json({ error: "Internal server error occurred." });
  }
});

export default router;
