import { pgTable, serial, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  contact: text("contact").notNull(),
  email: text("email"),
  phone: text("phone"),
  cnpj: text("cnpj"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierEvaluationsTable = pgTable("supplier_evaluations", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliersTable.id),
  priceScore: numeric("price_score", { precision: 3, scale: 1 }).notNull(),
  deliveryScore: numeric("delivery_score", { precision: 3, scale: 1 }).notNull(),
  qualityScore: numeric("quality_score", { precision: 3, scale: 1 }).notNull(),
  notes: text("notes"),
  purchaseOrderId: integer("purchase_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  contact: text("contact").notNull(),
  email: text("email"),
  phone: text("phone"),
  cnpj: text("cnpj"),
  address: text("address"),
  pixKey: text("pix_key"),   // <-- adicionar esta linha
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliersTable).omit({ id: true, createdAt: true });
export const insertSupplierEvaluationSchema = createInsertSchema(supplierEvaluationsTable).omit({ id: true, createdAt: true });

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliersTable.$inferSelect;
export type SupplierEvaluation = typeof supplierEvaluationsTable.$inferSelect;
