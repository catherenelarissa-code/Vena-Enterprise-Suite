import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// ── Tarefas ──────────────────────────────────────────────
router.get("/tasks", async (req, res) => {
  const result = await db.execute(sql`
    SELECT t.*, 
      u1.name as assigned_name,
      u2.name as created_name,
      c.name as client_name,
      p.name as project_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    ORDER BY 
      CASE t.priority 
        WHEN 'urgente' THEN 1 
        WHEN 'alta' THEN 2 
        WHEN 'media' THEN 3 
        WHEN 'baixa' THEN 4 
      END,
      t.due_date ASC NULLS LAST
  `);
  return res.json(result.rows);
});

router.post("/tasks", async (req, res) => {
  const { title, description, priority, due_date, start_date, assigned_to, client_id, project_id } = req.body;
  const userId = (req.session as any).userId;
  const result = await db.execute(sql`
    INSERT INTO tasks (title, description, priority, due_date, start_date, assigned_to, client_id, project_id, created_by)
    VALUES (
      ${title},
      ${description || null},
      ${priority || 'media'},
      ${due_date || null},
      ${start_date || null},
      ${assigned_to || null},
      ${client_id || null},
      ${project_id || null},
      ${userId}
    )
    RETURNING *
  `);
  return res.status(201).json(result.rows[0]);
});

router.patch("/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, priority, status, due_date, assigned_to } = req.body;
  const result = await db.execute(sql`
    UPDATE tasks SET
      title = COALESCE(${title || null}, title),
      description = COALESCE(${description || null}, description),
      priority = COALESCE(${priority || null}, priority),
      status = COALESCE(${status || null}, status),
      due_date = COALESCE(${due_date || null}, due_date),
      assigned_to = COALESCE(${assigned_to || null}, assigned_to)
    WHERE id = ${id}
    RETURNING *
  `);
  return res.json(result.rows[0]);
});

router.delete("/tasks/:id", async (req, res) => {
  await db.execute(sql`DELETE FROM tasks WHERE id = ${parseInt(req.params.id)}`);
  return res.json({ ok: true });
});

// ── Compromissos ─────────────────────────────────────────
router.get("/appointments", async (req, res) => {
  const result = await db.execute(sql`
    SELECT a.*,
      u.name as created_name,
      c.name as client_name,
      p.name as project_name
    FROM appointments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN projects p ON a.project_id = p.id
    ORDER BY a.start_time ASC
  `);
  return res.json(result.rows);
});

router.post("/appointments", async (req, res) => {
  const { title, description, start_time, end_time, priority, type, client_id, project_id } = req.body;
  const userId = (req.session as any).userId;
  const result = await db.execute(sql`
    INSERT INTO appointments (title, description, start_time, end_time, priority, type, client_id, project_id, created_by)
    VALUES (
      ${title},
      ${description || null},
      ${start_time || null},
      ${end_time || null},
      ${priority || 'media'},
      ${type || 'reuniao'},
      ${client_id || null},
      ${project_id || null},
      ${userId}
    )
    RETURNING *
  `);
  return res.status(201).json(result.rows[0]);
});

router.patch("/appointments/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, start_time, end_time, priority, type } = req.body;
  const result = await db.execute(sql`
    UPDATE appointments SET
      title = COALESCE(${title || null}, title),
      description = COALESCE(${description || null}, description),
      start_time = COALESCE(${start_time || null}, start_time),
      end_time = COALESCE(${end_time || null}, end_time),
      priority = COALESCE(${priority || null}, priority),
      type = COALESCE(${type || null}, type)
    WHERE id = ${id}
    RETURNING *
  `);
  return res.json(result.rows[0]);
});

router.delete("/appointments/:id", async (req, res) => {
  await db.execute(sql`DELETE FROM appointments WHERE id = ${parseInt(req.params.id)}`);
  return res.json({ ok: true });
});

export default router;
