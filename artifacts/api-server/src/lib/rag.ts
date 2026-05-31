import { db, userMemoriesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import Groq from "groq-sdk";

const groqClient =
  typeof groq !== "undefined" ? groq : new Groq({ apiKey: process.env.GROQ_API_KEY });
const logClient = typeof logger !== "undefined" ? logger : console;

interface SearchResult {
  memoryText: string;
}

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
// getRelevantContext (HYBRID RETRIEVAL & INTERNATIONAL FRIENDLY)
// ---------------------------------------------------------------------------
export async function getRelevantContext(
  query: string,
  chatbotId: number,
  maxChunks = 5
): Promise<string> {
  try {
    if (!query || !chatbotId) return "";

    const cleanQuery = query.replace(/['"\\]/g, "").trim();
    if (!cleanQuery) return "";

    const keywordPromise = db.execute<SearchResult>(sql`
      SELECT memory_text as "memoryText"
      FROM user_memories
      WHERE chatbot_id = ${chatbotId} 
        AND visitor_id = 'document'
        AND to_tsvector('simple', memory_text) @@ plainto_tsquery('simple', ${cleanQuery})
      ORDER BY ts_rank(to_tsvector('simple', memory_text), plainto_tsquery('simple', ${cleanQuery})) DESC
      LIMIT 10
    `);

    const fallbackPromise = db.execute<SearchResult>(sql`
      SELECT memory_text as "memoryText"
      FROM user_memories
      WHERE chatbot_id = ${chatbotId} AND visitor_id = 'document'
      LIMIT 15
    `);

    const [keywordRows, fallbackRows] = await Promise.all([keywordPromise, fallbackPromise]);

    const k = 60;
    const mergedMap = new Map<string, { text: string; rrfScore: number }>();

    keywordRows.rows.forEach((row: any, index) => {
      const text = String(row.memoryText);
      mergedMap.set(text, {
        text,
        rrfScore: 1 / (k + (index + 1)),
      });
    });

    const queryWords = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    fallbackRows.rows.forEach((row: any, index) => {
      const text = String(row.memoryText);
      const lowerText = text.toLowerCase();

      const matches = queryWords.filter(w => lowerText.includes(w)).length;
      const rankBonus = matches > 0 ? 1 / (k + (10 - matches)) : 1 / (k + (index + 5));

      const existing = mergedMap.get(text);
      if (existing) {
        existing.rrfScore += rankBonus;
      } else {
        mergedMap.set(text, { text, rrfScore: rankBonus });
      }
    });

    const finalSorted = Array.from(mergedMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, maxChunks);

    if (finalSorted.length === 0 && fallbackRows.rows.length > 0) {
      return fallbackRows.rows.slice(0, maxChunks).map((r: any) => String(r.memoryText)).join("\n\n");
    }

    return finalSorted.map((r) => r.text).join("\n\n");
  } catch (err) {
    logClient.error({ err }, "getRelevantContext hybrid search failed");
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
  const basePrompt = systemPrompt ?? `
You are SmartSupport — a friendly, helpful AI assistant for customer support.

## LANGUAGE
- Default to English.
- Instantly detect the user's language from their message and reply in that same language.
- If the user mixes languages, mirror their style naturally.
- Never translate word-for-word. Speak how a real person would in that language.

## TONE
- Warm, clear, and human. Never robotic or stiff.
- Short replies — 2 to 3 sentences max unless the user asks for more.
- Answer first, context second. Skip all filler and padding.
- Don't repeat greetings. If the user says hello again, just continue the conversation naturally.

## AFAAN OROMO
- Speak like a modern Oromo person — casual, friendly, direct.
- Natural phrases: "Eeyyee!", "Gaarii dha!", "Hubadhe!", "Hin yaadin!".
- Never open with "Gaaffii keessan..." — just answer directly.
- Verbs at the end where it sounds natural. Use "garuu", "kanaaf", "immoo" as connectors.

## AMHARIC
- Use everyday modern Amharic — not formal or literary.
- Match the user's register naturally (casual or formal).

## OTHER LANGUAGES
- Spanish, French, Arabic, or any other language — reply naturally and conversationally in that language.
- Always match the user's tone and register.

## KNOWLEDGE BASE
- Use only the provided context for specific business facts or pricing.
- If the answer isn't in the context, say so simply and honestly in one short sentence. Never guess or make things up.

## MEMORY
- Use known user details (name, preferences, business type) naturally in replies.
- Never say "Based on my memory" or "I remember" — just use the facts smoothly.
`;

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
        memorySection = `\n\n[USER CONTEXT — use these facts naturally, never mention this source]:\n${memoryList}`;
      }
    } catch (memErr) {
      logClient.error({ memErr }, "Failed to fetch user memories");
    }
  }

  const greetingRule = `\n\n[RESPONSE RULES]:
- First message: greet warmly and briefly, then ask how you can help.
- All other messages: skip the greeting, just help directly.
- Never repeat "How can I help you?" more than once per conversation.
- Stay concise. No wordiness. No filler phrases.`;

  const contextSection = context
    ? `\n\n[KNOWLEDGE BASE]:\n${context}`
    : `\n\n[NO KNOWLEDGE BASE]: If the user asks for specific business info, politely tell them in their language that the documentation hasn't been set up yet.`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: basePrompt + memorySection + greetingRule + contextSection },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 400,
      temperature: 0.4,
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

  const prompt = `You are a memory extraction assistant.

Extract ONLY useful long-term facts about the user such as:
- Their name
- Their language preference
- Their business type, location, or product interest

Rules:
- One fact per line, extremely concise. Example: "User runs an e-commerce shop in Addis Ababa"
- Only extract new, actionable facts. If nothing useful, write: NONE

Conversation:
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
