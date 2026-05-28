import { db, userMemoriesTable } from "@workspace/db"; 
import { eq, and } from "drizzle-orm";
import { groq } from "./groq"; 
import { logger } from "./logger"; 

export async function generateAIResponse(
  systemPrompt: string | null,
  context: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  chatbotId?: number | null,   // Akka undefined/null ta'es safe ta'uuf
  visitorId?: string | null    // Akka undefined/null ta'es safe ta'uuf
): Promise<string> {
  const basePrompt = systemPrompt ?? "You are a helpful customer support assistant.";
  
  // 1. Long-term Memory Dubbisuu (Safe Fetching)
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
        memorySection = `\n\n[USER LONG-TERM INSIGHTS / MEMORY]:\nUse these historical facts about this user to personalize your response and maintain continuous context. Do not explicitly say "according to my memory":\n${memoryList}`;
      }
    } catch (memErr) {
      logger.error({ memErr }, "Failed to fetch user memories, bypassing to avoid crash.");
    }
  }

  const greetingRule = `
\n\nCORE BEHAVIOR RULES:
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
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      temperature: 0.2, 
    });

    const aiReply = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";

    // 2. Safe Background Memory Extraction
    // Serverless irratti 'await' gochuu qabna ykn block hunda try-catch keessa galchina akka inni execute ta'u
    if (chatbotId && visitorId && typeof chatbotId === "number" && typeof visitorId === "string") {
      // Vercel irratti function-ichi osoo hin freeze ta'in dafee akka xumuruuf safe background worker
      extractAndSaveMemory(chatbotId, visitorId, [
        ...conversationHistory, 
        { role: "user", content: userMessage }, 
        { role: "assistant", content: aiReply }
      ]).catch((err) => logger.error({ err }, "Background memory extraction async failed"));
    }

    return aiReply;
  } catch (err) {
    logger.error({ err }, "Groq generation failed");
    return "I'm sorry, I encountered an error processing your request.";
  }
}

export async function extractAndSaveMemory(
  chatbotId: number,
  visitorId: string,
  history: { role: "user" | "assistant" | "system"; content: string }[]
): Promise<void> {
  // Haasaa dhumarratti dhufe qofa qabaa
  const conversationText = history
    .slice(-4)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `You are an AI Memory Extraction system. Analyze the chat history. Extract any long-term facts or preferences (e.g., name, language, business type). Be concise. One fact per line. If nothing new, write NONE.
  
History:
${conversationText}

Facts:`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
    });

    const text = response.choices[0]?.message?.content?.trim();

    if (text && text !== "NONE" && !text.includes("NONE")) {
      const facts = text.split("\n").filter((f) => f.trim().length > 2);
      
      for (const fact of facts) {
        // Database insert safe gochuu
        try {
          await db.insert(userMemoriesTable).values({
            chatbotId,
            visitorId,
            memoryText: fact.trim(),
          });
        } catch (dbInsErr) {
          logger.error({ dbInsErr }, "Failed to insert single memory row");
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to extract memory from Groq");
  }
}

// -------------------------------------------------------------------------
// Function-oonni kee kan gadii 'getRelevantContext' fi 'embedAndStoreDocument'
// isaan kanaan dura turan asii gadiitti akkuma jiranitti dhiisi!
// -------------------------------------------------------------------------
