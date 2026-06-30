import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { material_id } = req.query;
  const result = material_id
    ? await db.execute(sql`
        SELECT sm.*, c.name as client_name
        FROM stock_movements sm
        LEFT JOIN clients c ON sm.client_id = c.id
        WHERE sm.material_id = ${parseInt(material_id as string)}
        ORDER BY sm.created_at DESC
      `)
    : await db.execute(sql`
        SELECT sm.*, c.name as client_name, m.name as material_name
        FROM stock_movements sm
        LEFT JOIN clients c ON sm.client_id = c.id
        LEFT JOIN materials m ON sm.material_id = m.id
        ORDER BY sm.created_at DESC
        LIMIT 100
      `);
  return res.json(result.rows);
});

router.post("/", async (req, res) => {
  const { material_id, type, quantity, withdrawn_by, client_id, notes } = req.body;

  // Registra a movimentação
  const result = await db.execute(sql`
    INSERT INTO stock_movements (material_id, type, quantity, withdrawn_by, client_id, notes)
    VALUES (${material_id}, ${type}, ${quantity}, ${withdrawn_by ?? null}, ${client_id ?? null}, ${notes ?? null})
    RETURNING *
  `);

  // Atualiza o estoque do material
  if (type === "entrada") {
    await db.execute(sql`
      UPDATE materials SET current_stock = current_stock + ${quantity} WHERE id = ${material_id}
    `);
  } else {
    await db.execute(sql`
      UPDATE materials SET current_stock = GREATEST(0, current_stock - ${quantity}) WHERE id = ${material_id}
    `);
  }

  // Se tiver cliente, registra no histórico do cliente
  if (client_id && type === "saida") {
    const [material] = await db.execute(sql`SELECT name, unit FROM materials WHERE id = ${material_id}`).then(r => r.rows);
    await db.execute(sql`
      INSERT INTO client_history (client_id, type, description)
      VALUES (${client_id}, 'estoque', ${`Retirada de material: ${quantity} ${material?.unit ?? 'un'} de ${material?.name ?? ''}`})
    `);
  }

  return res.status(201).json(result.rows[0]);
});

export default router;
