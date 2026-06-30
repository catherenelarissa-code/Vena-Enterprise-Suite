import { pgTable, serial, text, timestamp, numeric, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "paused", "completed", "cancelled"]);
export const projectTypeEnum = pgEnum("project_type", ["fotovoltaica", "subestacao", "rede_distribuicao", "outro"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),           // nome interno
  costCenter: text("cost_center"),        // CENTRO DE CUSTO — nome em destaque no card
  client: text("client").notNull(),       // nome do cliente (texto livre)
  clientId: integer("client_id"),         // ID do cliente no CRM (opcional)
  type: projectTypeEnum("type").notNull().default("fotovoltaica"),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("planning"),
  budget: numeric("budget", { precision: 15, scale: 2 }).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  manager: text("manager"),
  // Tags de andamento (JSON array)
  tags: text("tags"),  // JSON: ["materiais", "estrutura_civil", ...]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
