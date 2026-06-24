import { pgTable, serial, text, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { suppliersTable } from "./suppliers";

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
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccountsTable).omit({ id: true, createdAt: true });
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;
export type FinancialAccount = typeof financialAccountsTable.$inferSelect;
