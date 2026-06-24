import { pgTable, serial, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "paused", "completed", "cancelled"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  client: text("client").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("planning"),
  budget: numeric("budget", { precision: 15, scale: 2 }).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  manager: text("manager"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
