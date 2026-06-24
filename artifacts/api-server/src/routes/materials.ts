import { Router } from "express";
import { db } from "@workspace/db";
import { materialsTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

router.get("/", async (req, res) => {
  const { project_id, low_stock, search } = req.query as { project_id?: string; low_stock?: string; search?: string };
  let materials = await db.select().from(materialsTable).orderBy(materialsTable.name);

  if (project_id) materials = materials.filter(m => m.projectId === parseInt(project_id));
  if (search) materials = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const result = await Promise.all(materials.map(enrichMaterial));
  const filtered = low_stock === "true" ? result.filter(m => m.isLowStock) : result;
  return res.json(filtered);
});

router.post("/", async (req, res) => {
  const { name, category, unit, currentStock, minimumStock, projectId, location, notes } = req.body;
  const [material] = await db.insert(materialsTable).values({
    name,
    category,
    unit,
    currentStock: (currentStock ?? 0).toString(),
    minimumStock: (minimumStock ?? 0).toString(),
    projectId,
    location,
    notes,
  }).returning();
  return res.status(201).json(await enrichMaterial(material));
});

router.get("/categories", async (req, res) => {
  const materials = await db.select().from(materialsTable);
  const counts: Record<string, number> = {};
  for (const m of materials) {
    counts[m.category] = (counts[m.category] ?? 0) + 1;
  }
  return res.json(Object.entries(counts).map(([name, count]) => ({ name, count })));
});

router.get("/low-stock-alerts", async (req, res) => {
  const materials = await db.select().from(materialsTable);
  const result = await Promise.all(materials.map(enrichMaterial));
  return res.json(result.filter(m => m.isLowStock));
});

router.get("/:id", async (req, res) => {
  const [m] = await db.select().from(materialsTable).where(eq(materialsTable.id, parseInt(req.params.id))).limit(1);
  if (!m) return res.status(404).json({ error: "Material não encontrado" });
  return res.json(await enrichMaterial(m));
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: any = {};
  const fields = ["name", "category", "location", "notes"];
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (req.body.currentStock !== undefined) updates.currentStock = req.body.currentStock.toString();
  if (req.body.minimumStock !== undefined) updates.minimumStock = req.body.minimumStock.toString();
  if (req.body.projectId !== undefined) updates.projectId = req.body.projectId;
  await db.update(materialsTable).set(updates).where(eq(materialsTable.id, id));
  const [m] = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).limit(1);
  return res.json(await enrichMaterial(m));
});

export default router;
