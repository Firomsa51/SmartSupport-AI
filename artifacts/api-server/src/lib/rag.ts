import { db, userMemoriesTable } from "@workspace/db"; 
import { eq, and } from "drizzle-orm";
// logger fi groq akka koodii kee isa duraa irraa import ta'anitti dhiisneerra

export async function generateAIResponse(
  systemPrompt: string | null,
  context: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  chatbotId?: number,   
  visitorId?: string    
): Promise<string> {
  const basePrompt = systemPrompt ?? "You are a helpful customer support assistant.";
  
  // 1. Long-term Memory Dubbisuu
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
        .limit(5); 

      if (pastMemories.length > 0) {
        const memoryList = pastMemories.map((m) => `- ${m.memoryText}`).join("\n");
        memorySection = `\n\n[USER LONG-TERM INSIGHTS / MEMORY]:\nUse these historical facts about this user to personalize your response and maintain continuous context. Do not explicitly say "according to my memory":\n${memoryList}`;
      }
    } catch (memErr) {
      logger.error({ memErr }, "Failed to fetch user memories");
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

    // 2. Background Memory Extraction
    if (chatbotId && visitorId && conversationHistory.length >= 3) {
      extractAndSaveMemory(chatbotId, visitorId, [...conversationHistory, { role: "user", content: userMessage }, { role: "assistant", content: aiReply }]).catch((err) => 
        logger.error({ err }, "Background memory extraction failed")
      );
    }

    return aiReply;
  } catch (err) {
    logger.error({ err }, "Groq generation failed");
    return "I'm sorry, I encountered an error processing your request.";
  }
}

// Memory Extract godhee kan database keessatti ol kuusu
export async function extractAndSaveMemory(
  chatbotId: number,
  visitorId: string,
  history: { role: "user" | "assistant" | "system"; content: string }[]
): Promise<void> {
  const conversationText = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `You are an AI Memory Extraction system. Analyze the following chat history between a user and a customer support bot. 
Extract any long-term core facts, user business preferences, user language choice, or critical context that would be useful for future chats.
Be extremely concise. Write one clean fact per line. 
If nothing important or new is found, reply strictly with the word "NONE".

Chat History:
${conversationText}

Extracted Facts:`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content?.trim();

    if (text && text !== "NONE" && !text.includes("NONE")) {
      const facts = text.split("\n").filter((f) => f.trim().length > 2);
      
      for (const fact of facts) {
        await db.insert(userMemoriesTable).values({
          chatbotId,
          visitorId,
          memoryText: fact.trim(),
        });
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to extract memory");
  }
}
