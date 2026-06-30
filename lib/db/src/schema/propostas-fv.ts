import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const prostasFVTable = pgTable("propostas_fv", {
  id: serial("id").primaryKey(),
  // Mala direta
  nomeCliente: text("nome_cliente").notNull(),
  cpfCnpj:     text("cpf_cnpj"),
  cidade:      text("cidade"),
  estado:      text("estado"),
  data:        text("data"),
  // Tabela técnica
  kwp:               text("kwp"),
  areaM2:            text("area_m2"),
  kwhMes:            text("kwh_mes"),
  quantidadePaineis: text("quantidade_paineis"),
  moduloW:           text("modulo_w"),
  baseInstalacao:    text("base_instalacao"),
  inversor:          text("inversor"),
  // Financeiro
  valorAVista:    text("valor_a_vista"),
  valorExtenso:   text("valor_extenso"),
  // Condições de pagamento — array de linhas
  pagamento: jsonb("pagamento").$type<PagamentoLinha[]>().default([]),
  // Meta
  status:    text("status").default("rascunho"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PropostaFV         = typeof prostasFVTable.$inferSelect;
export type InsertPropostaFV   = typeof prostasFVTable.$inferInsert;

export type PagamentoLinha = {
  forma: string;
  qtd:   string;
  valor: string;
};
