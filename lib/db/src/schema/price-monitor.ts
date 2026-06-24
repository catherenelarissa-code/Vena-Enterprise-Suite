import { pgTable, serial, text, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceAlertTypeEnum = pgEnum("price_alert_type", [
  "price_drop", "lowest_in_30d", "lowest_in_90d", "stock_low"
]);

export const monitoredProductsTable = pgTable("monitored_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  url: text("url"),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }).notNull(),
  alertThresholdPercent: numeric("alert_threshold_percent", { precision: 5, scale: 2 }).notNull().default("10"),
  aiInsight: text("ai_insight"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => monitoredProductsTable.id),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  supplier: text("supplier"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const priceAlertsTable = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => monitoredProductsTable.id),
  type: priceAlertTypeEnum("type").notNull(),
  message: text("message").notNull(),
  priceBefore: numeric("price_before", { precision: 12, scale: 2 }).notNull(),
  priceAfter: numeric("price_after", { precision: 12, scale: 2 }).notNull(),
  percentChange: numeric("percent_change", { precision: 8, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMonitoredProductSchema = createInsertSchema(monitoredProductsTable).omit({ id: true, createdAt: true });
export type InsertMonitoredProduct = z.infer<typeof insertMonitoredProductSchema>;
export type MonitoredProduct = typeof monitoredProductsTable.$inferSelect;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
export type PriceAlert = typeof priceAlertsTable.$inferSelect;
