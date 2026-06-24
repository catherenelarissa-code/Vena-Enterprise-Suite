import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertTypeEnum = pgEnum("alert_type", [
  "low_stock", "price_drop", "due_payment", "budget_exceeded", "quote_pending"
]);
export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "urgent"]);

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: alertTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("info"),
  relatedId: integer("related_id"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
