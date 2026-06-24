import { pgTable, serial, text, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const materialsTable = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  currentStock: numeric("current_stock", { precision: 12, scale: 3 }).notNull().default("0"),
  minimumStock: numeric("minimum_stock", { precision: 12, scale: 3 }).notNull().default("0"),
  projectId: integer("project_id").references(() => projectsTable.id),
  lastPurchasePrice: numeric("last_purchase_price", { precision: 12, scale: 2 }),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaterialSchema = createInsertSchema(materialsTable).omit({ id: true, createdAt: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materialsTable.$inferSelect;
