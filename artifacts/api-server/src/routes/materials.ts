// artifacts/api-server/src/routes/materials.ts
// Substitua o arquivo inteiro por este conteúdo

import { Router } from "express";
import { db } from "@workspace/db";
import { materialsTable, projectsTable, materialMovementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function enrichMaterial(m: any) {
  let projectName = null;
  if (m.projectId) {
    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, m.projectId)).limit(1);
    projectName = p?.name ?? null;
  }
  const currentStock = parseFloat(m.currentStock);
  const minimumStock = parseFloat(m.minimumStock);
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    unit: m.unit,
    currentStock,
    minimumStock,
    projectId: m.projectId,
    projectName,
    lastPurchasePrice: m.lastPurchasePrice ? parseFloat(m.lastPurchasePrice) : null,
    location: m.location,
    notes: m.notes,
    isLowStock: currentStock <= minimumStock,
    createdAt: m.createdAt.toISOString(),
  };
}

// GET / - Listar materiais
router.get("/", async (req, res) => {
  try {
    const { project_id, low_stock, search } = req.query as { project_id?: string; low_stock?: string; search?: string };
    let materials = await db.select().from(materialsTable).orderBy(materialsTable.name);

    if (project_id) materials = materials.filter(m => m.projectId === parseInt(project_id));
    if (search) materials = materials.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    );

    const result = await Promise.all(materials.map(enrichMaterial));
    const filtered = low_stock === "true" ? result.filter(m => m.isLowStock) : result;
    return res.json(filtered);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar materiais" });
  }
});

// POST / - Criar material
router.post("/", async (req, res) => {
  try {
    const { name, category, unit, currentStock, minimumStock, projectId, lastPurchasePrice, location, notes } = req.body;
    const [material] = await db.insert(materialsTable).values({
      name,
      category,
      unit,
      currentStock: (currentStock ?? 0).toString(),
      minimumStock: (minimumStock ?? 0).toString(),
      projectId: projectId ?? null,
      lastPurchasePrice: lastPurchasePrice ? lastPurchasePrice.toString() : null,
      location,
      notes,
    }).returning();

    // Se entrou com estoque inicial, registra movimentação
    if (currentStock && parseFloat(currentStock) > 0) {
      await db.insert(materialMovementsTable).values({
        materialId: material.id,
        type: "entrada",
        quantity: currentStock.toString(),
        reason: "Estoque inicial",
        projectId: projectId ?? null,
      });
    }

    return res.status(201).json(await enrichMaterial(material));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar material" });
  }
});

// GET /categories - Categorias
router.get("/categories", async (req, res) => {
  try {
    const materials = await db.select().from(materialsTable);
    const counts: Record<string, number> = {};
    for (const m of materials) {
      counts[m.category] = (counts[m.category] ?? 0) + 1;
    }
    return res.json(Object.entries(counts).map(([name, count]) => ({ name, count })));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

// GET /low-stock-alerts - Alertas de estoque baixo
router.get("/low-stock-alerts", async (req, res) => {
  try {
    const materials = await db.select().from(materialsTable);
    const result = await Promise.all(materials.map(enrichMaterial));
    return res.json(result.filter(m => m.isLowStock));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar alertas" });
  }
});

// GET /:id - Buscar material
router.get("/:id", async (req, res) => {
  try {
    const [m] = await db.select().from(materialsTable).where(eq(materialsTable.id, parseInt(req.params.id))).limit(1);
    if (!m) return res.status(404).json({ error: "Material não encontrado" });
    return res.json(await enrichMaterial(m));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar material" });
  }
});

// PATCH /:id - Atualizar material
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: any = {};
    const fields = ["name", "category", "unit", "location", "notes"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
    if (req.body.currentStock !== undefined) updates.currentStock = req.body.currentStock.toString();
    if (req.body.minimumStock !== undefined) updates.minimumStock = req.body.minimumStock.toString();
    if (req.body.projectId !== undefined) updates.projectId = req.body.projectId;
    if (req.body.lastPurchasePrice !== undefined) updates.lastPurchasePrice = req.body.lastPurchasePrice?.toString() ?? null;

    await db.update(materialsTable).set(updates).where(eq(materialsTable.id, id));
    const [m] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1);
    return res.json(await enrichMaterial(m));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar material" });
  }
});

// DELETE /:id - Excluir material
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(materialMovementsTable).where(eq(materialMovementsTable.materialId, id));
    await db.delete(materialsTable).where(eq(materialsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir material" });
  }
});

// POST /:id/movements - Registrar entrada ou saída
router.post("/:id/movements", async (req, res) => {
  try {
    const materialId = parseInt(req.params.id);
    const { type, quantity, projectId, reason, notes } = req.body;

    if (!["entrada", "saida"].includes(type)) {
      return res.status(400).json({ error: "Tipo deve ser 'entrada' ou 'saida'" });
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: "Quantidade deve ser maior que zero" });
    }

    const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, materialId)).limit(1);
    if (!material) return res.status(404).json({ error: "Material não encontrado" });

    const currentStock = parseFloat(material.currentStock);
    const qty = parseFloat(quantity);

    if (type === "saida" && qty > currentStock) {
      return res.status(400).json({ error: `Estoque insuficiente. Disponível: ${currentStock} ${material.unit}` });
    }

    const newStock = type === "entrada" ? currentStock + qty : currentStock - qty;

    await db.insert(materialMovementsTable).values({
      materialId,
      type,
      quantity: qty.toString(),
      projectId: projectId ?? null,
      reason,
      notes,
    });

    const [updated] = await db.update(materialsTable)
      .set({ currentStock: newStock.toString() })
      .where(eq(materialsTable.id, materialId))
      .returning();

    return res.status(201).json(await enrichMaterial(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registrar movimentação" });
  }
});

// GET /:id/movements - Histórico de movimentações
router.get("/:id/movements", async (req, res) => {
  try {
    const materialId = parseInt(req.params.id);
    const movements = await db
      .select()
      .from(materialMovementsTable)
      .where(eq(materialMovementsTable.materialId, materialId))
      .orderBy(desc(materialMovementsTable.createdAt));

    const enriched = await Promise.all(movements.map(async (mov) => {
      let projectName = null;
      if (mov.projectId) {
        const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, mov.projectId)).limit(1);
        projectName = p?.name ?? null;
      }
      return {
        ...mov,
        quantity: parseFloat(mov.quantity),
        projectName,
        createdAt: mov.createdAt.toISOString(),
      };
    }));

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

export default router;
