import { pgTable, serial, text, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { suppliersTable } from "./suppliers";

export const purchaseRequestStatusEnum = pgEnum("purchase_request_status", [
  "pending", "quoting", "approved", "ordered", "delivered", "cancelled"
]);
export const urgencyEnum = pgEnum("urgency_level", ["low", "normal", "high", "urgent"]);
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "pending", "confirmed", "shipped", "delivered", "cancelled"
]);
export const quoteStatusEnum = pgEnum("quote_status", ["pending", "approved", "rejected"]);

export const purchaseRequestsTable = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  requestedBy: text("requested_by").notNull(),
  projectId: integer("project_id").references(() => projectsTable.id),
  status: purchaseRequestStatusEnum("status").notNull().default("pending"),
  urgency: urgencyEnum("urgency").notNull().default("normal"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseRequestItemsTable = pgTable("purchase_request_items", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => purchaseRequestsTable.id),
  materialName: text("material_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  notes: text("notes"),
});

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequestsTable.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliersTable.id),
  deliveryDays: integer("delivery_days").notNull(),
  freightCost: numeric("freight_cost", { precision: 12, scale: 2 }),
  discount: numeric("discount", { precision: 5, scale: 2 }).default("0"), // ✅ campo de desconto
  status: quoteStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quoteItemsTable = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotesTable.id),
  materialName: text("material_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
});

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotesTable.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliersTable.id),
  projectId: integer("project_id").references(() => projectsTable.id),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: purchaseOrderStatusEnum("status").notNull().default("pending"),
  expectedDelivery: text("expected_delivery"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequestsTable).omit({ id: true, createdAt: true });
export const insertQuoteSchema = createInsertSchema(quotesTable).omit({ id: true, createdAt: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrdersTable).omit({ id: true, createdAt: true });

export type PurchaseRequest = typeof purchaseRequestsTable.$inferSelect;
export type PurchaseRequestItem = typeof purchaseRequestItemsTable.$inferSelect;
export type Quote = typeof quotesTable.$inferSelect;
export type QuoteItem = typeof quoteItemsTable.$inferSelect;
export type PurchaseOrder = typeof purchaseOrdersTable.$inferSelect;
