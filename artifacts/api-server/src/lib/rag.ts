import { db } from "../db"; // Database connection kee asirraan fudhata (drizzle instance)
import { userMemoriesTable } from "@smart-support-ai/db/src/schema/conversations"; // ykn path drizzle schema kee
import { eq, and } from "drizzle-orm";

export async function generateAIResponse(
  systemPrompt: string | null,
  context: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  chatbotId?: number,   // Itti dabalame
  visitorId?: string    // Itti dabalame
): Promise<string> {
  const basePrompt = systemPrompt ?? "You are a helpful customer support assistant.";
  
  // 1. Long-term Memory Dubbisuu (Yoo chatbotId fi visitorId jiraatan)
  let memorySection = "";
  if (chatbotId && visitorId) {
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
        .limit(5); // Memory 5 rgaa dhiheenyaa gahaadha

      if (pastMemories.length > 0) {
        const memoryList = pastMemories.map((m) => `- ${m.memoryText}`).join("\n");
        memorySection = `\n\n[USER LONG-TERM INSIGHTS / MEMORY]:\nUse these historical facts about this user to personalize your response and maintain continuous context. Do not explicitly say "according to my memory":\n${memoryList}`;
      }
    } catch (memErr) {
      logger.error({ memErr }, "Failed to fetch user memories");
    }
  }

  // Asirratti seera ifa ta'e fi gabaabaa AI'n burjaajii malee hubattu kennina
  const greetingRule = `
\n\nCORE BEHAVIOR RULES:
1. GREETING DETECTION: If the user message is JUST a greeting (e.g., "Akkam", "Akkami", "Hello", "Hi", "Akkam nagaya ketti"), reply warmly in the same language.
2. QUESTION HANDLING: If the user asks a question about a person, place, or object (e.g., "Firomsa ni beyta?", "Do you know X?"), DO NOT repeat their question as a greeting. Treat it as an informational query. Check the context below. If the information is not in the context, politely say: "I don't have that information in my knowledge base."
`;

  const contextSection = context
    ? `\n\nUse the following knowledge base context to answer questions. Only answer based on this context:\n\nContext:\n${context}`
    : "\n\nYou don't have any knowledge base context yet. Inform the user politely that you don't have information about this topic because no documentation has been uploaded to your knowledge base yet.";

  // Injection: basePrompt + memorySection + greetingRule + contextSection walitti makanna
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
      temperature: 0.2, // Temperature gadi buifneerra akka ishiin ofirraa hin dabalreuf
    });

    return response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
  } catch (err) {
    logger.error({ err }, "Groq generation failed");
    return "I'm sorry, I encountered an error processing your request.";
  }
}
