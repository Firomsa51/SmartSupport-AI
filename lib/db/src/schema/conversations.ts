import { pgTable, text, serial, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chatbotsTable } from "./chatbots";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  chatbotId: integer("chatbot_id").notNull().references(() => chatbotsTable.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  visitorId: text("visitor_id"),
  messageCount: integer("message_count").notNull().default(0),
  needs_human_review: boolean("needs_human_review").default(false),        // ← NEW
  last_unanswered_query: text("last_unanswered_query"),                    // ← NEW
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  confidence_score: decimal("confidence_score", { precision: 3, scale: 2 }), // ← NEW
  user_ip: text("user_ip"),
  request_timestamp: timestamp("request_timestamp", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// AI Long-term Memory Table (Persistent Insights Kuusuuf)
export const userMemoriesTable = pgTable("user_memories", {
  id: serial("id").primaryKey(),
  chatbotId: integer("chatbot_id").notNull().references(() => chatbotsTable.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id").notNull(),
  memoryText: text("memory_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Zod Schemas & Types
export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export const insertUserMemorySchema = createInsertSchema(userMemoriesTable).omit({ id: true, createdAt: true });

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
export type UserMemory = typeof userMemoriesTable.$inferSelect;
