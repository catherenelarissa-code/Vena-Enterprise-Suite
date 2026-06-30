import { pgTable, serial, text, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { suppliersTable } from "./suppliers";
import { clientsTable } from "./crm";
import { purchaseOrdersTable } from "./purchases";

export const financialTypeEnum = pgEnum("financial_type", ["payable", "receivable"]);
export const financialStatusEnum = pgEnum("financial_status", ["pending", "paid", "overdue", "cancelled"]);

export const financialAccountsTable = pgTable("financial_accounts", {
  id: serial("id").primaryKey(),
  type: financialTypeEnum("type").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: text("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  status: financialStatusEnum("status").notNull().default("pending"),
  projectId: integer("project_id").references(() => projectsTable.id),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  clientId: integer("client_id").references(() => clientsTable.id),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrdersTable.id),
  category: text("category"),
  clientName: text("client_name"),
  attachmentUrl: text("attachment_url"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categorias customizadas
export const financialCategoriesTable = pgTable("financial_categories_custom", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: financialTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Despesas operacionais
export const operationalExpensesTable = pgTable("operational_expenses", {
  id: serial("id").primaryKey(),
  expenseType: text("expense_type").notNull(),
  description: text("description").notNull(),
  supplierName: text("supplier_name"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  attachmentUrl: text("attachment_url"),
  ocrRawText: text("ocr_raw_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenseTypeTagsTable = pgTable("expense_type_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccountsTable).omit({ id: true, createdAt: true });
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;
export type FinancialAccount = typeof financialAccountsTable.$inferSelect;
export type FinancialCategory = typeof financialCategoriesTable.$inferSelect;

export const insertOperationalExpenseSchema = createInsertSchema(operationalExpensesTable).omit({ id: true, createdAt: true });
export type InsertOperationalExpense = z.infer<typeof insertOperationalExpenseSchema>;
export type OperationalExpense = typeof operationalExpensesTable.$inferSelect;
export type ExpenseTypeTag = typeof expenseTypeTagsTable.$inferSelect;
