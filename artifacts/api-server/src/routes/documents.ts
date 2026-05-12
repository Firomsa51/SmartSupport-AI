import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, documentsTable, chatbotsTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { embedAndStoreDocument } from "../lib/rag";
import {
  ListDocumentsParams,
  AddDocumentParams,
  AddDocumentBody,
  DeleteDocumentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/chatbots/:id/documents", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = ListDocumentsParams.safeParse(req.params);
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

  const docs = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.chatbotId, params.data.id));

  res.json(docs);
});

router.post("/chatbots/:id/documents", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = AddDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const [doc] = await db
    .insert(documentsTable)
    .values({
      chatbotId: params.data.id,
      title: parsed.data.title,
      content: parsed.data.content,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl ?? null,
      status: "pending",
      chunkCount: 0,
    })
    .returning();

  res.status(201).json(doc);

  embedAndStoreDocument(doc.id, params.data.id, parsed.data.content).catch(() => {});
});

router.delete("/chatbots/:id/documents/:docId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = DeleteDocumentParams.safeParse(req.params);
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

  const [doc] = await db
    .delete(documentsTable)
    .where(and(eq(documentsTable.id, params.data.docId), eq(documentsTable.chatbotId, params.data.id)))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
