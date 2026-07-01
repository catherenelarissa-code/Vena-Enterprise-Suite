import { pgTable, serial, text, timestamp, integer, customType } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  clientId: integer("client_id"),
  proposalId: integer("proposal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FileRow = typeof filesTable.$inferSelect;
