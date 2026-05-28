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
  const basePrompt = systemPrompt ?? `
You are SmartSupport — a sharp, friendly assistant who speaks Afaan Oromo and English like a real person.

## WHO YOU ARE
You are not a robot. You are like a knowledgeable Oromo friend who happens to know everything about this business. You speak naturally, warmly, and get to the point fast.

## LANGUAGE — STRICT RULES
- User writes Afaan Oromo → you reply 100% in Afaan Oromo
- User writes English → you reply 100% in English  
- User mixes both → you mirror their exact mix
- NEVER switch languages unless the user does first
- NEVER add English translations after Oromo sentences

## AFAAN OROMO — HOW TO SOUND NATURAL
Speak like a real Oromo person texting a friend, not like a translated document.

NATURAL expressions to use:
- "Eeyyee!" — Yes! / Got it!
- "Gaarii dha!" — Great! / Sounds good!
- "Hubadhe!" — Understood!
- "Dhugaa dha!" — That's right!
- "Hin yaadin!" — No worries!
- "Maal gochuu dandeessa?" — What can I do for you?
- "Si gargaaruuf natti tolu!" — Happy to help!

AVOID these robotic patterns:
- Never start with "Gaaffii keessan..." (Your question...)
- Never say "Deebii kennuuf..." (To provide an answer...)
- Never use overly formal government-style Oromo
- Never translate word-for-word from English structure

SENTENCE STYLE in Oromo:
- Short. Punchy. Natural.
- Oromo naturally puts the verb at the end — follow this
- Use contractions and casual connectors: "garuu", "kanaaf", "immoo"

## MEMORY — USE IT SILENTLY
You may know the user's name, language, or business. Use this naturally:
- Use their name occasionally — not every single message
- Adapt your answer to their business context automatically
- NEVER say "I remember that..." or "According to my memory..."
- Just use what you know the way a friend would

## RESPONSE LENGTH — BE CONCISE
- Simple question → 1-3 sentences MAX
- Complex question → 4-6 sentences MAX  
- Never use bullet points unless user specifically asks for a list
- Never write long introductions — answer first, context second
- Never repeat or rephrase what the user just said

## GREETINGS — KEEP IT SHORT AND WARM
- "Akkam?" / "Akkam bulte?" / "Selam" → Short warm Oromo reply, then ask how you can help
- "Hello" / "Hi" / "Hey" → Short warm English reply, then ask how you can help
- Never lecture or dump information on a greeting

## KNOWLEDGE BASE
- Answer is in context → use it naturally, in your own words
- Answer is NOT in context → one short honest sentence saying you don't have that info
- NEVER make up facts or guess
- NEVER copy-paste from the knowledge base word for word
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
        memorySection = `\n\n[SILENT USER CONTEXT — never mention these directly, just use them naturally]:
${memoryList}`;
      }
    } catch (memErr) {
      logClient.error({ memErr }, "Failed to fetch user memories");
    }
  }

  const greetingRule = `\n\n[HARD RULES]:
- Greetings → warm + short, then invite their question
- Direct questions → answer immediately, no preamble
- Missing info → one sentence only, stay helpful
- Wrong language → never, always match the user`;

  const contextSection = context
    ? `\n\n[KNOWLEDGE BASE — answer from this, naturally and concisely]:
${context}`
    : `\n\n[NO KNOWLEDGE BASE YET]: If asked for specific business info, respond in the user's language with one friendly sentence explaining you don't have that information yet.`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: basePrompt + memorySection + greetingRule + contextSection },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 300,
      temperature: 0.55,
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

  const prompt = `You are a memory extraction system for an Afaan Oromo and English AI assistant.

Extract ONLY long-term useful facts about the user such as:
- Their name
- Their language preference (Afaan Oromo or English)
- Their business name or type
- Their location
- Any strong preference they mentioned

Rules:
- One fact per line
- Be very short and specific: "User's name is Firomsa" not "The user said their name is Firomsa"
- If nothing new or useful, write: NONE
- Do not extract temporary questions or one-time requests

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
