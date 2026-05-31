import { db, documentsTable, userMemoriesTable } from "@workspace/db";
import { crawlJobs } from "@workspace/db/schema";
import { inngest } from "../lib/inngest";
import { and, eq, ne } from "drizzle-orm";
import { embedAndStoreDocument } from "../lib/rag";

export class IngestionService {
  /**
   * Safe-trigger for asynchronous website crawling
   */
  static async triggerCrawl(chatbotId: number, url: string) {
    const existingJob = await db
      .select()
      .from(crawlJobs)
      .where(
        and(
          eq(crawlJobs.chatbotId, chatbotId),
          eq(crawlJobs.url, url),
          ne(crawlJobs.status, "completed"),
          ne(crawlJobs.status, "failed")
        )
      )
      .limit(1);

    if (existingJob.length > 0) {
      return {
        success: false,
        message: "Crawl job for this URL is already active or processing.",
        jobId: existingJob[0].id,
      };
    }

    const [newJob] = await db
      .insert(crawlJobs)
      .values({
        chatbotId,
        url,
        status: "pending",
        totalPages: 0,
        processedPages: 0,
      })
      .returning();

    await inngest.send({
      name: "crawl.start",
      payload: {
        jobId: newJob.id,
        chatbotId: chatbotId,
        url: url,
      },
    });

    return {
      success: true,
      message: "Ingestion pipeline triggered successfully.",
      jobId: newJob.id,
    };
  }

  /**
   * Ingest a plain-text document into the knowledge base
   */
  static async ingestDocument(
    chatbotId: number,
    documentId: number,
    content: unknown
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate content is a non-empty string at service boundary
      if (content === null || content === undefined) {
        return { success: false, error: "Content is null or undefined." };
      }

      const safeContent =
        typeof content === "string"
          ? content.trim()
          : typeof content === "object"
          ? (() => {
              const obj = content as Record<string, unknown>;
              const extracted = obj.content ?? obj.text ?? obj.body ?? obj.data;
              return typeof extracted === "string" ? extracted.trim() : "";
            })()
          : String(content).trim();

      if (!safeContent) {
        // Mark document as failed — no valid content
        await db
          .update(documentsTable)
          .set({ status: "failed" })
          .where(eq(documentsTable.id, documentId));
        return { success: false, error: "Content is empty after sanitization." };
      }

      // Mark as processing
      await db
        .update(documentsTable)
        .set({ status: "processing" })
        .where(eq(documentsTable.id, documentId));

      // Embed and store chunks
      const result = await embedAndStoreDocument(safeContent, { chatbotId });

      if (!result.success) {
        await db
          .update(documentsTable)
          .set({ status: "failed" })
          .where(eq(documentsTable.id, documentId));
        return result;
      }

      // Count how many chunks were stored
      const chunks = safeContent.split(/\s+/);
      const chunkCount = Math.ceil(chunks.length / 500);

      // Mark as ready with chunk count
      await db
        .update(documentsTable)
        .set({ status: "ready", chunkCount })
        .where(eq(documentsTable.id, documentId));

      return { success: true };
    } catch (err) {
      // Mark as failed on unexpected error
      await db
        .update(documentsTable)
        .set({ status: "failed" })
        .where(eq(documentsTable.id, documentId));
      return { success: false, error: String(err) };
    }
  }
}
