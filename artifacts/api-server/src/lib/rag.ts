import { db, userMemoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import Groq from "groq-sdk";

const groqClient =
  typeof groq !== "undefined" ? groq : new Groq({ apiKey: process.env.GROQ_API_KEY });
const logClient = typeof logger !== "undefined" ? logger : console;

// ---------------------------------------------------------------------------
// embedAndStoreDocument
// ---------------------------------------------------------------------------
export async function embedAndStoreDocument(
  content: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Document content is empty." };
    }

    const chunks = chunkText(content, 500);

    for (const chunk of chunks) {
      await db.insert(userMemoriesTable).values({
        chatbotId: (metadata?.chatbotId as number) ?? 0,
        visitorId: "document",
        memoryText: chunk.trim(),
      });
    }

    return { success: true };
  } catch (err) {
    logClient.error({ err }, "embedAndStoreDocument failed");
    return { success: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// getRelevantContext
// ---------------------------------------------------------------------------
export async function getRelevantContext(
  query: string,
  chatbotId: number,
  maxChunks = 5
): Promise<string> {
  try {
    if (!query || !chatbotId) return "";

    const rows = await db
      .select({ memoryText: userMemoriesTable.memoryText })
      .from(userMemoriesTable)
      .where(
        and(
          eq(userMemoriesTable.chatbotId, chatbotId),
          eq(userMemoriesTable.visitorId, "document")
        )
      )
      .limit(maxChunks * 4);

    if (!rows.length) return "";

    const queryWords = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const scored = rows
      .map((row) => {
        const text = row.memoryText.toLowerCase();
        const score = [...queryWords].filter((w) => text.includes(w)).length;
        return { text: row.memoryText, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks);

    const selected =
      scored.length > 0
        ? scored.map((r) => r.text)
        : rows.slice(0, maxChunks).map((r) => r.memoryText);

    return selected.join("\n\n");
  } catch (err) {
    logClient.error({ err }, "getRelevantContext failed");
    return "";
  }
}

// ---------------------------------------------------------------------------
// generateAIResponse
// ---------------------------------------------------------------------------
export async function generateAIResponse(
  systemPrompt: string | null,
  context: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  options?: { chatbotId?: number | null; visitorId?: string | null }
): Promise<string> {
  const basePrompt = systemPrompt ?? "You are a helpful customer support assistant.";

  const chatbotId = options?.chatbotId;
  const visitorId = options?.visitorId;

  let memorySection = "";
  if (chatbotId && visitorId && typeof chatbotId === "number" && typeof visitorId === "string") {
    try {
      const pastMemories = await db
        .select({ memoryText: userMemoriesTable.memoryText })
        .from(userMemoriesTable)
        .where(
          and(
            eq(userMemoriesTable.chatbotId, chatbotId),
            eq(userMemoriesTable.visitorId, visitorId)
          )
        )
        .orderBy(userMemoriesTable.createdAt)
        .limit(5);

      if (pastMemories && pastMemories.length > 0) {
        const memoryList = pastMemories.map((m) => `- ${m.memoryText}`).join("\n");
        memorySection = `\n\n[USER LONG-TERM INSIGHTS / MEMORY]:\nUse these historical facts about this user to personalize your response. Do not explicitly say "according to my memory":\n${memoryList}`;
      }
    } catch (memErr) {
      logClient.error({ memErr }, "Failed to fetch user memories");
    }
  }

  const greetingRule = `\n\nCORE BEHAVIOR RULES:
1. GREETING DETECTION: If the user message is JUST a greeting (e.g., "Akkam", "Akkami", "Hello", "Hi", "Akkam nagaya ketti"), reply warmly in the same language.
2. QUESTION HANDLING: If the user asks a question about a person, place, or object (e.g., "Firomsa ni beyta?", "Do you know X?"), DO NOT repeat their question as a greeting. Treat it as an informational query. Check the context below. If the information is not in the context, politely say: "I don't have that information in my knowledge base."
`;

  const contextSection = context
    ? `\n\nUse the following knowledge base context to answer questions. Only answer based on this context:\n\nContext:\n${context}`
    : "\n\nYou don't have any knowledge base context yet. Inform the user politely that you don't have information about this topic because no documentation has been uploaded to your knowledge base yet.";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: basePrompt + memorySection + greetingRule + contextSection },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      temperature: 0.2,
    });

    const aiReply =
      response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";

    if (chatbotId && visitorId && typeof chatbotId === "number" && typeof visitorId === "string") {
      extractAndSaveMemory(chatbotId, visitorId, [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: aiReply },
      ]).catch((err) => logClient.error({ err }, "Background memory extraction failed"));
    }

    return aiReply;
  } catch (err) {
    logClient.error({ err }, "Groq generation failed");
    return "I'm sorry, I encountered an error processing your request.";
  }
}

// ---------------------------------------------------------------------------
// extractAndSaveMemory
// ---------------------------------------------------------------------------
export async function extractAndSaveMemory(
  chatbotId: number,
  visitorId: string,
  history: { role: "user" | "assistant" | "system"; content: string }[]
): Promise<void> {
  const conversationText = history
    .slice(-4)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `You are an AI Memory Extraction system. Extract any long-term facts or preferences (e.g., name, language, business type). Be concise. One fact per line. If nothing new, write NONE.

History:
${conversationText}

Facts:`;

  try {
    const response = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
    });

    const text = response.choices[0]?.message?.content?.trim();

    if (text && text !== "NONE" && !text.includes("NONE")) {
      const facts = text.split("\n").filter((f) => f.trim().length > 2);

      for (const fact of facts) {
        try {
          await db.insert(userMemoriesTable).values({
            chatbotId,
            visitorId,
            memoryText: fact.trim(),
          });
        } catch (dbInsErr) {
          logClient.error({ dbInsErr }, "Failed to insert single memory row");
        }
      }
    }
  } catch (err) {
    logClient.error({ err }, "Failed to extract memory");
  }
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------
function chunkText(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}
