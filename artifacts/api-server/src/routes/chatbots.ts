import { Router } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, chatbotsTable, documentsTable, conversationsTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { IngestionService } from "../services/ingestion"; // 1. Ingestion service import gochuu
import {
  CreateChatbotBody,
  UpdateChatbotBody,
  GetChatbotParams,
  UpdateChatbotParams,
  DeleteChatbotParams,
  GetChatbotWidgetScriptParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

router.get("/chatbots", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);

  const chatbots = await db.select().from(chatbotsTable).where(eq(chatbotsTable.userId, userId));

  const enriched = await Promise.all(
    chatbots.map(async (bot) => {
      const [docResult] = await db
        .select({ count: count() })
        .from(documentsTable)
        .where(eq(documentsTable.chatbotId, bot.id));
      const [convResult] = await db
        .select({ count: count() })
        .from(conversationsTable)
        .where(eq(conversationsTable.chatbotId, bot.id));
      return {
        ...bot,
        documentCount: Number(docResult?.count ?? 0),
        conversationCount: Number(convResult?.count ?? 0),
      };
    })
  );

  res.json(enriched);
});

router.post("/chatbots", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateChatbotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const uid = randomUUID().replace(/-/g, "").slice(0, 20);

  const [bot] = await db
    .insert(chatbotsTable)
    .values({ ...parsed.data, userId, uid, status: "active" })
    .returning();

  res.status(201).json({ ...bot, documentCount: 0, conversationCount: 0 });
});

router.get("/chatbots/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = GetChatbotParams.safeParse(req.params);
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

  const [docResult] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(eq(documentsTable.chatbotId, bot.id));
  const [convResult] = await db
    .select({ count: count() })
    .from(conversationsTable)
    .where(eq(conversationsTable.chatbotId, bot.id));

  res.json({
    ...bot,
    documentCount: Number(docResult?.count ?? 0),
    conversationCount: Number(convResult?.count ?? 0),
  });
});

router.patch("/chatbots/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = UpdateChatbotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateChatbotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bot] = await db
    .update(chatbotsTable)
    .set(parsed.data)
    .where(and(eq(chatbotsTable.id, params.data.id), eq(chatbotsTable.userId, userId)))
    .returning();

  if (!bot) {
    res.status(404).json({ error: "Chatbot not found" });
    return;
  }

  const [docResult] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(eq(documentsTable.chatbotId, bot.id));
  const [convResult] = await db
    .select({ count: count() })
    .from(conversationsTable)
    .where(eq(conversationsTable.chatbotId, bot.id));

  res.json({
    ...bot,
    documentCount: Number(docResult?.count ?? 0),
    conversationCount: Number(convResult?.count ?? 0),
  });
});

router.delete("/chatbots/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = DeleteChatbotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bot] = await db
    .delete(chatbotsTable)
    .where(and(eq(chatbotsTable.id, params.data.id), eq(chatbotsTable.userId, userId)))
    .returning();

  if (!bot) {
    res.status(404).json({ error: "Chatbot not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/chatbots/:id/widget-script", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = GetChatbotWidgetScriptParams.safeParse(req.params);
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

  const host = req.headers.host ?? "your-domain.com";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;
  const scriptTag = `<script src="${baseUrl}/widget.js" data-chatbot-uid="${bot.uid}" async></script>`;
  const embedInstructions = `Add the following script tag to the <head> or <body> of your website's HTML. The chat widget will automatically appear as a floating button in the bottom-right corner.`;

  res.json({ scriptTag, chatbotUid: bot.uid, embedInstructions });
});

// 2. TRIGGER CRAWL PIPELINE ENDPOINT (Modular & Secure)
router.post("/chatbots/:id/crawl", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = getUserId(req);
    const chatbotId = parseInt(req.params.id, 10);
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: "Target URL is required for crawling." });
      return;
    }

    if (isNaN(chatbotId)) {
      res.status(400).json({ error: "Invalid Chatbot ID format." });
      return;
    }

    // Abbaa chatbotichaa qofa akka ta'e mirkaneessuuf (Security Check)
    const [bot] = await db
      .select()
      .from(chatbotsTable)
      .where(and(eq(chatbotsTable.id, chatbotId), eq(chatbotsTable.userId, userId)));

    if (!bot) {
      res.status(404).json({ error: "Chatbot not found or unauthorized access." });
      return;
    }

    // Ingestion service irraa safe trigger gochuu
    const result = await IngestionService.triggerCrawl(chatbotId, url);

    if (!result.success) {
      res.status(409).json({ error: result.message, jobId: result.jobId });
      return;
    }

    res.status(202).json(result); // 202 Accepted (Processing asynchronous pipeline)
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error during crawl triggering.", details: error.message });
  }
});

export default router;
