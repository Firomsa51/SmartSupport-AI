import { pgTable, serial, integer, text, timestamp, pgEnum, customJson, index } from "drizzle-orm/pg-core";
import { chatbots } from "./chatbots";

// 1. Enum ijaaruu (Neon irratti uumne waliin tokko)
export const crawlJobStatusEnum = pgEnum("crawl_job_status", [
  "pending",
  "crawling",
  "processing",
  "completed",
  "failed"
]);

// 2. Tabilii crawl_jobs Drizzle ijaarama isaa
export const crawlJobs = pgTable(
  "crawl_jobs",
  {
    id: serial("id").primaryKey(),
    chatbotId: integer("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    status: crawlJobStatusEnum("status").default("pending").notNull(),
    totalPages: integer("total_pages").default(0).notNull(),
    processedPages: integer("processed_pages").default(0).notNull(),
    errorMessage: text("error_message"),
    // JSONB columns for rich metadata
    progress: text("progress").default("{}"), 
    resultMetadata: text("result_metadata").default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_crawl_jobs_chatbot_status").on(table.chatbotId, table.status)
  ]
);
