import { pgTable, serial, text, timestamp, integer, jsonb, blob } from "drizzle-orm/pg-core";

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  data: blob("data").$type<Buffer>().notNull(),
  clientId: integer("client_id"),
  proposalId: integer("proposal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FileRow = typeof filesTable.$inferSelect;
