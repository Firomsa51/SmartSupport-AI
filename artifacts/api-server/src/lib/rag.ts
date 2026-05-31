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
  content: unknown, // ← FIX: was `string`, now `unknown` to catch bad input
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // ── FIX: Defensive coercion before any .trim() call ──────────────────
    let safeContent: string;

    if (content === null || content === undefined) {
      return { success: false, error: "Document content is null or undefined." };
    }

    if (Array.isArray(content)) {
      // Accidental array — join into one string
      safeContent = content.map((c) => String(c)).join("\n");
    } else if (typeof content === "object") {
      // Accidental object — try common field names
      const obj = content as Record<string, unknown>;
      const extracted = obj.content ?? obj.text ?? obj.body ?? obj.data;
      if (typeof extracted === "string") {
        safeContent = extracted;
      } else {
        return {
          success: false,
          error: `Document content is an object with no valid string field. Got: ${JSON.stringify(content).slice(0, 120)}`,
        };
      }
    } else {
      safeContent = String(content);
    }

    // Now safe to call .trim()
    if (safeContent.trim().length === 0) {
      return { success: false, error: "Document content is empty." };
    }

    const chunks = chunkText(safeContent.trim(), 500);

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
// getRelevantContext (HYBRID RETRIEVAL)
// ---------------------------------------------------------------------------
export async function getRelevantContext(
  query: unknown, // ← FIX: was `string`, now `unknown` to catch bad input
  chatbotId: number,
  maxChunks = 5
): Promise<string> {
  try {
    // ── FIX: Defensive coercion before any .replace() call ───────────────
    let safeQuery: string;

    if (query === null || query === undefined) {
      return "";
    }

    if (typeof query === "object") {
      // Accidental object — try common field names
      const obj = query as Record<string, unknown>;
      const extracted = obj.message ?? obj.text ?? obj.content ?? obj.query;
      safeQuery = typeof extracted === "string" ? extracted : String(extracted ?? "");
    } else {
      safeQuery = String(query);
    }

    if (!safeQuery.trim() || !chatbotId) return "";

    // Now safe to call .replace()
    const cleanQuery = safeQuery.replace(/['"\\]/g, "").trim();
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
      return fallbackRows.rows
        .slice(0, maxChunks)
        .map((r: any) => String(r.memoryText))
        .join("\n\n");
    }

    return finalSorted.map((r) => r.text).join("\n\n");
  } catch (err) {
    logClient.error({ err }, "getRelevantContext hybrid search failed");
    return "";
  }
}

// ---------------------------------------------------------------------------
// detectQueryType
// ---------------------------------------------------------------------------
function detectQueryType(
  userMessage: string,
  hasContext: boolean,
  hasMemory: boolean
): "knowledge_base" | "personal_memory" | "general" {
  const msg = userMessage.toLowerCase();

  const kbKeywords = [
    "what is", "how does", "tell me about", "explain", "what are",
    "pricing", "price", "cost", "plan", "feature", "smartsupport",
    "service", "offer", "work", "support", "product", "package",
    "how much", "what do you", "can you", "do you have",
  ];

  const personalKeywords = [
    "my name", "who am i", "my business", "my shop", "remember me",
    "what do you know about me", "my account", "my preference",
    "i told you", "last time", "i said", "my language",
  ];

  const isKB = kbKeywords.some(k => msg.includes(k));
  const isPersonal = personalKeywords.some(k => msg.includes(k));

  if (isPersonal && hasMemory) return "personal_memory";
  if (isKB && hasContext) return "knowledge_base";
  if (hasContext) return "knowledge_base";
  return "general";
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

  const chatbotId = options?.chatbotId;
  const visitorId = options?.visitorId;

  // ── 1. Fetch personal memories ──────────────────────────────────────────
  let memorySection = "";
  let hasMemory = false;

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
        hasMemory = true;
        const memoryList = pastMemories.map((m) => `- ${m.memoryText}`).join("\n");
        memorySection = `\n\n[PERSONAL USER FACTS — weave these into your reply naturally, never cite this list directly]:\n${memoryList}`;
      }
    } catch (memErr) {
      logClient.error({ memErr }, "Failed to fetch user memories");
    }
  }

  // ── 2. Classify query type ───────────────────────────────────────────────
  const hasContext = context.trim().length > 0;
  const queryType = detectQueryType(userMessage, hasContext, hasMemory);

  // ── 3. Build context section ─────────────────────────────────────────────
  let contextSection = "";
  if (hasContext) {
    contextSection = `\n\n[KNOWLEDGE BASE — PRIMARY source for product/service questions. Always check here first]:\n${context}`;
  } else {
    contextSection = `\n\n[NO KNOWLEDGE BASE LOADED]: For specific product or pricing questions, tell the user clearly and briefly that this information isn't available yet.`;
  }

  // ── 4. Query-type instruction ────────────────────────────────────────────
  const queryTypeInstruction = {
    knowledge_base: `[CURRENT QUERY TYPE: KNOWLEDGE BASE]
The user is asking about a product, service, or feature.
- Answer ONLY from the Knowledge Base above.
- Do not add generic information not found there.
- If the exact answer isn't in the Knowledge Base, say so in one sentence.`,

    personal_memory: `[CURRENT QUERY TYPE: PERSONAL]
The user is asking about themselves or something they shared before.
- Answer using the Personal User Facts above.
- Speak naturally — do not recite the facts like a list.
- If you don't have the specific info they're asking about, say so simply.`,

    general: `[CURRENT QUERY TYPE: GENERAL CONVERSATION]
This is a general message (greeting, small talk, or unclear intent).
- Reply naturally and briefly.
- If context exists and is even slightly relevant, reference it.
- Keep it warm, concise, and helpful.`,
  }[queryType];

  // ── 5. Compose system prompt ─────────────────────────────────────────────
  const basePrompt = systemPrompt ?? `
You are SmartSupport — a helpful, professional AI customer support assistant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Default language: English. Always respond in English unless told otherwise.
- If the user explicitly requests another language, switch to it immediately and maintain it.
- NEVER mix languages in a single response unless the user does it first.
- If the user's language is unclear, use English.
- If asked to switch back to English, do so immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & LENGTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Be clear, warm, and direct. Sound like a knowledgeable human, not a chatbot script.
- Keep replies concise: 2–3 sentences for simple questions, more only when detail is needed.
- Never use filler phrases like "Great question!", "Certainly!", or "Of course!".
- Do not repeat greetings. If the user says hello again mid-conversation, just continue naturally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANSWER PRIORITY ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Knowledge Base → for product, pricing, and service questions
2. Personal Memory → for questions about the user themselves
3. General reasoning → only when neither above applies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HONESTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Never guess or make up facts.
- If the Knowledge Base doesn't have the answer, say so briefly and offer to help with something else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AFAAN OROMO (only when user requests it)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Speak naturally like a modern Oromo person — casual and direct.
- Use: "Eeyyee!", "Gaarii dha!", "Hubadhe!", "Hin yaadin!".
- Never open with "Gaaffii keessan..." — answer directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AMHARIC (only when user requests it)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use everyday modern Amharic — not overly formal or literary.
- Match the user's register (casual or formal) naturally.
`;

  const fullSystemPrompt =
    basePrompt +
    memorySection +
    contextSection +
    `\n\n${queryTypeInstruction}`;

  // ── 6. Build messages ────────────────────────────────────────────────────
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: fullSystemPrompt },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  // ── 7. Call Groq ─────────────────────────────────────────────────────────
  try {
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 400,
      temperature: 0.3,
    });

    const aiReply =
      response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";

    // ── 8. Background memory extraction ─────────────────────────────────────
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
- One fact per line, extremely concise. Example: "User runs a clothing shop in Addis Ababa"
- Only extract new, clearly stated facts. Do not infer or guess.
- If nothing useful found, write exactly: NONE

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
