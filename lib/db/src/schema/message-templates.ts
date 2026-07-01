import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const messageTemplatesTable = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // Allow null template when using generated HTML (metadata-only templates)
  template: text("template"),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MessageTemplate = typeof messageTemplatesTable.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplatesTable.$inferInsert;
