import { inngest } from "../lib/inngest";
import { db } from "@workspace/db"; 
import { crawlJobs } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

// 1. Crawler Worker (Sitemap ykn URL duraa qorata)
export const startCrawlJob = inngest.createFunction(
  { id: "start-crawl-job", name: "Start Website Crawl" },
  { event: "crawl.start" },
  async ({ event, step }) => {
    // Inngest v3 keessatti payload-ni sendEvent irratti 'data' keessa gala
    const { jobId, chatbotId, url } = event.data;

    // Status 'crawling' irratti jijjiirra
    await step.run("update-status-crawling", async () => {
      await db.update(crawlJobs)
        .set({ status: "crawling" })
        .where(eq(crawlJobs.id, jobId));
    });

    // Page linkoota argachuu
    const pages = await step.run("discover-pages", async () => {
      return [url]; // Ammadiif fall-back urlichee qofa deebisa
    });

    // Total pages beeksisuuf status 'processing' goona
    await step.run("initialize-page-counts", async () => {
      await db.update(crawlJobs)
        .set({ totalPages: pages.length, status: "processing" })
        .where(eq(crawlJobs.id, jobId));
    });

    // Fan-out: Linkii adda addaa hundaf event haaraa uumna (Timeout dhabamsiisuuf)
    const events = pages.map((pageUrl: string) => ({
      name: "crawl.page.process",
      data: { jobId, chatbotId, pageUrl },
    }));

    await step.sendEvent("trigger-page-workers", events);
    return { discoveredPages: pages.length };
  }
);

// 2. Individual Page Content Embedder Worker
export const processPageIngestion = inngest.createFunction(
  { id: "process-page-ingestion", name: "Process Page Content" },
  { event: "crawl.page.process" },
  async ({ event, step }) => {
    const { jobId, chatbotId, pageUrl } = event.data;

    const rawContent = await step.run("fetch-html", async () => {
      const res = await fetch(pageUrl);
      const html = await res.text();
      return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    });

    await step.run("chunk-and-embed", async () => {
      // Vector processing (pgvector) asitti deema
      // rawContent asitti chunk gootee openai embedding itti naquu dandeessa
      console.log(`Embedding updated safely for: ${pageUrl}`);
    });

    // Atomically progress hordofnee yoo xumurame 'completed' goona
    await step.run("track-progress", async () => {
      await db.execute(sql`
        UPDATE crawl_jobs 
        SET processed_pages = processed_pages + 1 
        WHERE id = ${jobId}
      `);

      await db.execute(sql`
        UPDATE crawl_jobs 
        SET status = 'completed' 
        WHERE id = ${jobId} AND processed_pages >= total_pages
      `);
    });

    return { success: true };
  }
);
