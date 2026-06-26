// lib/db/src/schema/material-movements.ts
// Adicione este arquivo em: lib/db/src/schema/material-movements.ts
// E exporte-o em: lib/db/src/schema/index.ts

import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { materialsTable } from "./materials";
import { projectsTable } from "./projects";

export const movementTypeEnum = pgEnum("movement_type", ["entrada", "saida"]);

export const materialMovementsTable = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  type: movementTypeEnum("type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  projectId: integer("project_id").references(() => projectsTable.id),
  reason: text("reason"),      // ex: "Compra NF 1234", "Uso na Obra Silva"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MaterialMovement = typeof materialMovementsTable.$inferSelect;
