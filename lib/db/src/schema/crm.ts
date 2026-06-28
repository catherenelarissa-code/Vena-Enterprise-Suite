import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crmColumnsTable = pgTable("crm_columns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#F97316"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  cpfCnpj: text("cpf_cnpj"),
  address: text("address"),
  origin: text("origin"),
  notes: text("notes"),
  columnId: integer("column_id").references(() => crmColumnsTable.id),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientHistoryTable = pgTable("client_history", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrmColumnSchema = createInsertSchema(crmColumnsTable).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true });
export const insertClientHistorySchema = createInsertSchema(clientHistoryTable).omit({ id: true, createdAt: true });

export type InsertCrmColumn = z.infer<typeof insertCrmColumnSchema>;
export type CrmColumn = typeof crmColumnsTable.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
export type InsertClientHistory = z.infer<typeof insertClientHistorySchema>;
export type ClientHistory = typeof clientHistoryTable.$inferSelect;
