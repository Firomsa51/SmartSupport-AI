import { db } from "@workspace/db";
import { crawlJobs } from "@workspace/db/schema";
import { inngest } from "../lib/inngest";
import { and, eq, ne } from "drizzle-orm";

export class IngestionService {
  /**
   * Safe-trigger for asynchronous website crawling
   */
  static async triggerCrawl(chatbotId: number, url: string) {
    // 1. Duplicate jobs dhowwuuf active job qorachuu
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
        jobId: existingJob[0].id 
      };
    }

    // 2. Job Record haaraa uumuu
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

    // 3. Inngest Event Pipeline Trigger gochuu
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
      jobId: newJob.id 
    };
  }
}
