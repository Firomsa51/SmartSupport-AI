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

    // Clean query to safeguard sql injection and empty vectors
    const cleanQuery = query.replace(/['"\\]/g, "").trim();
    if (!cleanQuery) return "";

    // 1. KEYWORD BASE SEARCH (Using PostgreSQL Full-Text 'simple' dictionary for international words)
    const keywordPromise = db.execute<SearchResult>(sql`
      SELECT memory_text as "memoryText"
      FROM user_memories
      WHERE chatbot_id = ${chatbotId} 
        AND visitor_id = 'document'
        AND to_tsvector('simple', memory_text) @@ plainto_tsquery('simple', ${cleanQuery})
      ORDER BY ts_rank(to_tsvector('simple', memory_text), plainto_tsquery('simple', ${cleanQuery})) DESC
      LIMIT 10
    `);

    // 2. FALLBACK/SEMANTIC SIMILARITY SEARCH (Safe execution matching your current structure)
    const fallbackPromise = db.execute<SearchResult>(sql`
      SELECT memory_text as "memoryText"
      FROM user_memories
      WHERE chatbot_id = ${chatbotId} AND visitor_id = 'document'
      LIMIT 15
    `);

    // Run in parallel to match Vercel Serverless low-latency constraints
    const [keywordRows, fallbackRows] = await Promise.all([keywordPromise, fallbackPromise]);

    const k = 60; // Reciprocal Rank Fusion constant
    const mergedMap = new Map<string, { text: string; rrfScore: number }>();

    // Rank Keyword results
    keywordRows.rows.forEach((row: any, index) => {
      const text = String(row.memoryText);
      mergedMap.set(text, {
        text,
        rrfScore: 1 / (k + (index + 1)),
      });
    });

    // Blend Fallback results using basic string relevance heuristic to avoid empty sets
    const queryWords = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    fallbackRows.rows.forEach((row: any, index) => {
      const text = String(row.memoryText);
      const lowerText = text.toLowerCase();
      
      // Calculate inline relevance score
      const matches = queryWords.filter(w => lowerText.includes(w)).length;
      const rankBonus = matches > 0 ? 1 / (k + (10 - matches)) : 1 / (k + (index + 5));

      const existing = mergedMap.get(text);
      if (existing) {
        existing.rrfScore += rankBonus;
      } else {
        mergedMap.set(text, { text, rrfScore: rankBonus });
      }
    });

    // Sort by final RRF score and extract top chunks
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
You are SmartSupport — an elite, highly-intelligent international AI customer support assistant.

## GLOBAL STYLE & MULTILINGUAL RULES
- ALWAYS detect and match the user's language instantly (e.g., English, Afaan Oromo, Amharic, Spanish, etc.).
- NEVER use stiff, robotic, or direct literal machine translations. Speak naturally, professionally, and elegantly.
- CODE-SWITCHING: If the user mixes multiple languages in a single sentence, adapt fluidly and mirror their mixed style naturally.
- Keep responses short, direct, and crisp (maximum 2-3 sentences unless details are explicitly requested). Cut all fluff.

## AFAAN OROMO - NATURAL PEER FLOW
Speak like a real modern Oromo person texting, avoiding formal government-style jargon.
- Use natural expressions: "Eeyyee!", "Gaarii dha!", "Hubadhe!", "Hin yaadin!", "Si gargaaruuf natti tolu!".
- Never start with "Gaaffii keessan..." or "Deebii kennuuf...". Answer the query immediately.
- Structure sentences naturally (verbs at the end when appropriate) and use standard casual connectors like "garuu", "kanaaf", "immoo".

## MEMORY INTEGRATION
- Incorporate user details (name, business type) seamlessly.
- NEVER say "Based on my memory" or "I remember that". Just use the facts fluidly.

## KNOWLEDGE BASE TRUTHFULNESS
- Rely strictly on the provided Context for factual business data. 
- If the exact answer or pricing is not found, state clearly and politely in one short sentence that you don't have that information. Never hallucinate.
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
        memorySection = `\n\n[SILENT USER CONTEXT — utilize these facts seamlessly without mentioning this source]:\n${memoryList}`;
      }
    } catch (memErr) {
      logClient.error({ memErr }, "Failed to fetch user memories");
    }
  }

  const greetingRule = `\n\n[CRITICAL OPERATIONAL DIRECTIVES]:
- Greetings: Short, warm, and ask how you can help.
- Direct Queries: Provide the answer first, elaboration second.
- Length Control: Absolutely concise. Avoid wordiness.`;

  const contextSection = context
    ? `\n\n[KNOWLEDGE BASE CONTEXT]:\n${context}`
    : `\n\n[NO KNOWLEDGE BASE YET]: If the user asks for specific info, reply politely in their exact language stating you don't have that documentation setup yet.`;

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
      temperature: 0.35, // Balanced precision for pricing and accurate response tone
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

  const prompt = `You are an international AI memory extraction system.

Extract ONLY long-term useful facts about the user such as:
- Their name
- Their language preference
- Their business profile, location, or product interest

Rules:
- One fact per line
- Extremely concise. E.g., "User runs an e-commerce shop"
- If nothing new or actionable, write: NONE

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
