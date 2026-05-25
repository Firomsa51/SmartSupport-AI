import OpenAI from "openai";
import { Groq } from "groq-sdk"; // Groq SDK itti dabalaniiru
import { db, documentChunksTable, documentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

// OpenAI Embeddings qofaaf tajaajila
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Groq Chat Completion (Llama 3) qofaaf tajaajila
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

export async function embedAndStoreDocument(
  documentId: number,
  chatbotId: number,
  content: string
): Promise<void> {
  try {
    await db
      .update(documentsTable)
      .set({ status: "processing" })
      .where(eq(documentsTable.id, documentId));

    const chunks = chunkText(content);

    // OpenAI embeddings (kun akkuma jirutti itti fufa)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const values = chunks.map((chunk, i) => ({
      documentId,
      chatbotId,
      content: chunk,
      embedding: embeddingResponse.data[i].embedding as unknown as string,
    }));

    for (const val of values) {
      await db.execute(sql`
        INSERT INTO document_chunks (document_id, chatbot_id, content, embedding)
        VALUES (${val.documentId}, ${val.chatbotId}, ${val.content}, ${JSON.stringify(val.embedding)}::vector)
      `);
    }

    await db
      .update(documentsTable)
      .set({ status: "ready", chunkCount: chunks.length })
      .where(eq(documentsTable.id, documentId));
  } catch (err) {
    logger.error({ err, documentId }, "Failed to embed document");
    await db
      .update(documentsTable)
      .set({ status: "error" })
      .where(eq(documentsTable.id, documentId));
  }
}

export async function getRelevantContext(
  chatbotId: number,
  query: string,
  topK = 5
): Promise<string> {
  try {
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: [query],
    });
    const embeddingVector = queryEmbedding.data[0].embedding;

    const rows = await db.execute(sql`
      SELECT content, 1 - (embedding <=> ${JSON.stringify(embeddingVector)}::vector) AS similarity
      FROM document_chunks
      WHERE chatbot_id = ${chatbotId}
      ORDER BY embedding <=> ${JSON.stringify(embeddingVector)}::vector
      LIMIT ${topK}
    `);

    const chunks = (rows.rows as { content: string; similarity: number }[])
      .filter((r) => r.similarity > 0.5)
      .map((r) => r.content);

    return chunks.join("\n\n---\n\n");
  } catch (err) {
    logger.error({ err }, "Failed to get relevant context");
    return "";
  }
}

// ------ ASIRAATI GROQ JIJJIIRRAMEERA ------
export async function generateAIResponse(
  systemPrompt: string | null,
  context: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const basePrompt = systemPrompt ?? "You are a helpful customer support assistant.";
  const contextSection = context
    ? `\n\nUse the following knowledge base context to answer questions. Only answer based on this context. If the answer isn't in the context, say you don't have that information.\n\nContext:\n${context}`
    : "\n\nYou don't have any knowledge base context yet. Let the user know you need documentation to be uploaded first.";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: basePrompt + contextSection },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  try {
    // OpenAI irraa gara Groq tti jijjiirameera, moodelli Llama 3.3 tajaajila
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
  } catch (err) {
    logger.error({ err }, "Groq generation failed");
    return "I'm sorry, I encountered an error processing your request.";
  }
}
