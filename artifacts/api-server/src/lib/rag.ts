import { Groq } from "groq-sdk";
import { db, documentChunksTable, documentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

// Eegumsa Database: Taableen yoo uumamuu baate ofumaan akka uumu
async function ensureTablesExist() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER,
        status TEXT DEFAULT 'pending',
        chunk_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER,
        chatbot_id INTEGER,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info("Database tables verified/created successfully.");
  } catch (err) {
    logger.error({ err }, "Database auto-creation failed");
  }
}

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
    await ensureTablesExist();

    await db
      .update(documentsTable)
      .set({ status: "processing" })
      .where(eq(documentsTable.id, documentId));

    const chunks = chunkText(content);

    for (const chunk of chunks) {
      await db.insert(documentChunksTable).values({
        documentId: documentId,
        chatbotId: chatbotId,
        content: chunk,
      });
    }

    await db
      .update(documentsTable)
      .set({ status: "ready", chunkCount: chunks.length })
      .where(eq(documentsTable.id, documentId));

    logger.info({ documentId, chunksCount: chunks.length }, "Document stored successfully");
  } catch (err) {
    logger.error({ err, documentId }, "Failed to store document");
    
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
    await ensureTablesExist();

    // Akka nagaa gaafachuu (greetings) database keessaa fallback hin finne eegna
    const lowerQuery = query.toLowerCase().trim();
    const greetings = ["akkami", "akkam", "hello", "hi", "greetings", "nagaa", "akkam jirtu", "hey"];
    if (greetings.some(g => lowerQuery.startsWith(g)) && lowerQuery.length < 15) {
      return ""; // Nagaa qofa yoo ta'e context barbaachisuu baata
    }

    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words.length === 0) {
      const fallback = await db
        .select({ content: documentChunksTable.content })
        .from(documentChunksTable)
        .where(eq(documentChunksTable.chatbotId, chatbotId))
        .limit(topK);
      return fallback.map(r => r.content).join("\n\n---\n\n");
    }

    const rows = await db
      .select({ content: documentChunksTable.content })
      .from(documentChunksTable)
      .where(
        sql`${documentChunksTable.chatbotId} = ${chatbotId} AND (${sql.join(
          words.map(w => sql`LOWER(${documentChunksTable.content}) LIKE ${'%' + w + '%'}`),
          sql` OR `
        )})`
      )
      .limit(topK);

    if (rows.length === 0) {
      const fallback = await db
        .select({ content: documentChunksTable.content })
        .from(documentChunksTable)
        .where(eq(documentChunksTable.chatbotId, chatbotId))
        .limit(topK);
      return fallback.map(r => r.content).join("\n\n---\n\n");
    }

    return rows.map((r) => r.content).join("\n\n---\n\n");
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
  
  // Seera AI'n nagaa addaan baaftee akka deebistu itti himnu
  const greetingRule = `
\n\nCORE BEHAVIOR RULES:
1. GREETINGS: If the user greets you (e.g., "Akkami", "Akkam", "Hello", "Hi", "Akkam jirtu"), ALWAYS reply warmly in the same language they used (e.g., if they say "Akkami", reply with "Akkami! Akkam si gargaaru?"). In this case, IGNORE the context rule and DO NOT say you don't have information.
2. KNOWLEDGE BASE: For informational questions, use the context below. If the answer is not present in the context, politely state that you do not have that information.
`;

  const contextSection = context
    ? `\n\nUse the following knowledge base context to answer questions. Only answer based on this context if it's an informational query:\n\nContext:\n${context}`
    : "\n\nYou don't have any knowledge base context yet. Let the user know you need documentation to be uploaded first.";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: basePrompt + greetingRule + contextSection },
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
