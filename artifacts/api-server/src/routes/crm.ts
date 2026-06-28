import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// ── Colunas ──────────────────────────────────────────────
router.get("/columns", async (req, res) => {
  const columns = await db.execute(sql`
    SELECT * FROM crm_columns ORDER BY position ASC
  `);
  return res.json(columns.rows);
});

router.post("/columns", async (req, res) => {
  const { name, color } = req.body;
  const result = await db.execute(sql`
    INSERT INTO crm_columns (name, color, position)
    VALUES (${name}, ${color ?? '#F97316'}, 
      (SELECT COALESCE(MAX(position), -1) + 1 FROM crm_columns))
    RETURNING *
  `);
  return res.status(201).json(result.rows[0]);
});

router.patch("/columns/:id", async (req, res) => {
  const { name, color } = req.body;
  const result = await db.execute(sql`
    UPDATE crm_columns SET
      name = COALESCE(${name}, name),
      color = COALESCE(${color}, color)
    WHERE id = ${parseInt(req.params.id)}
    RETURNING *
  `);
  return res.json(result.rows[0]);
});

router.delete("/columns/:id", async (req, res) => {
  await db.execute(sql`DELETE FROM crm_columns WHERE id = ${parseInt(req.params.id)}`);
  return res.json({ ok: true });
});

// ── Clientes ─────────────────────────────────────────────
router.get("/clients", async (req, res) => {
  const clients = await db.execute(sql`
    SELECT c.*, col.name as column_name, col.color as column_color
    FROM clients c
    LEFT JOIN crm_columns col ON c.column_id = col.id
    ORDER BY c.column_id, c.position ASC
  `);
  return res.json(clients.rows);
});

router.post("/clients", async (req, res) => {
  const { name, phone, email, cpf_cnpj, address, origin, notes, column_id } = req.body;
  const result = await db.execute(sql`
    INSERT INTO clients (name, phone, email, cpf_cnpj, address, origin, notes, column_id, position)
    VALUES (${name}, ${phone}, ${email}, ${cpf_cnpj}, ${address}, ${origin}, ${notes}, ${column_id},
      (SELECT COALESCE(MAX(position), -1) + 1 FROM clients WHERE column_id = ${column_id}))
    RETURNING *
  `);
  // Registra no histórico
  await db.execute(sql`
    INSERT INTO client_history (client_id, type, description)
    VALUES (${result.rows[0].id}, 'criacao', 'Cliente cadastrado no sistema')
  `);
  return res.status(201).json(result.rows[0]);
});

router.get("/clients/:id", async (req, res) => {
  const client = await db.execute(sql`
    SELECT c.*, col.name as column_name, col.color as column_color
    FROM clients c
    LEFT JOIN crm_columns col ON c.column_id = col.id
    WHERE c.id = ${parseInt(req.params.id)}
  `);
  if (!client.rows[0]) return res.status(404).json({ error: "Cliente não encontrado" });
  
  const history = await db.execute(sql`
    SELECT h.*, u.name as user_name
    FROM client_history h
    LEFT JOIN users u ON h.created_by = u.id
    WHERE h.client_id = ${parseInt(req.params.id)}
    ORDER BY h.created_at DESC
  `);
  
  return res.json({ ...client.rows[0], history: history.rows });
});

router.patch("/clients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, email, cpf_cnpj, address, origin, notes, column_id, position } = req.body;
  
  const result = await db.execute(sql`
    UPDATE clients SET
      name = COALESCE(${name}, name),
      phone = COALESCE(${phone}, phone),
      email = COALESCE(${email}, email),
      cpf_cnpj = COALESCE(${cpf_cnpj}, cpf_cnpj),
      address = COALESCE(${address}, address),
      origin = COALESCE(${origin}, origin),
      notes = COALESCE(${notes}, notes),
      column_id = COALESCE(${column_id}, column_id),
      position = COALESCE(${position}, position)
    WHERE id = ${id}
    RETURNING *
  `);

  if (column_id) {
    await db.execute(sql`
      INSERT INTO client_history (client_id, type, description)
      VALUES (${id}, 'movimentacao', 'Status atualizado no kanban')
    `);
  }
  return res.json(result.rows[0]);
});

router.delete("/clients/:id", async (req, res) => {
  await db.execute(sql`DELETE FROM clients WHERE id = ${parseInt(req.params.id)}`);
  return res.json({ ok: true });
});

// ── Histórico ─────────────────────────────────────────────
router.post("/clients/:id/history", async (req, res) => {
  const { type, description } = req.body;
  const userId = (req.session as any).userId;
  const result = await db.execute(sql`
    INSERT INTO client_history (client_id, type, description, created_by)
    VALUES (${parseInt(req.params.id)}, ${type}, ${description}, ${userId})
    RETURNING *
  `);
  return res.status(201).json(result.rows[0]);
});

export default router;
