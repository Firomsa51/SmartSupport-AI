import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatbotsTable = pgTable("chatbots", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  uid: text("uid").notNull().unique(),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  primaryColor: text("primary_color").default("#2563eb"),
  logoUrl: text("logo_url"),
  welcomeMessage: text("welcome_message").default("Hi! How can I help you today?"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChatbotSchema = createInsertSchema(chatbotsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type Chatbot = typeof chatbotsTable.$inferSelect;
