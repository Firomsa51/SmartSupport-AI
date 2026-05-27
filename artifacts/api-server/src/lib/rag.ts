import { Groq } from "groq-sdk";
import { db, documentChunksTable, documentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

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

    for (const chunk of chunks) {
      await db.execute(sql`
        INSERT INTO document_chunks (document_id, chatbot_id, content)
        VALUES (${documentId}, ${chatbotId}, ${chunk})
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
    // Use simple text search instead of vector similarity
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const rows = await db.execute(sql`
      SELECT content
      FROM document_chunks
      WHERE chatbot_id = ${chatbotId}
      AND (${sql.join(words.map(w => sql`LOWER(content) LIKE ${'%' + w + '%'}`), sql` OR `)})
      LIMIT ${topK}
    `);

    const chunks = (rows.rows as { content: string }[]).map((r) => r.content);

    if (chunks.length === 0) {
      // If no keyword match, return first chunks
      const fallback = await db.execute(sql`
        SELECT content FROM document_chunks
        WHERE chatbot_id = ${chatbotId}
        LIMIT ${topK}
      `);
      return (fallback.rows as { content: string }[]).map(r => r.content).join("\n\n---\n\n");
    }

    return chunks.join("\n\n---\n\n");
  } catch (err) {
    logger.error({ err }, "Failed to get relevant context");
    return "";
  }
}

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
