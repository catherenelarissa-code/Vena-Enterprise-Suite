import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, financialAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function formatProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    client: p.client,
    description: p.description,
    status: p.status,
    budget: parseFloat(p.budget),
    spent: 0,
    startDate: p.startDate,
    endDate: p.endDate,
    location: p.location,
    manager: p.manager,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { status } = req.query as { status?: string };
  let projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  if (status) projects = projects.filter(p => p.status === status);

  const accounts = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.type, "payable"));
  return res.json(projects.map(p => {
    const spent = accounts.filter(a => a.projectId === p.id).reduce((s, a) => s + parseFloat(a.amount), 0);
    return { ...formatProject(p), spent };
  }));
});

router.post("/", async (req, res) => {
  const { name, client, description, budget, startDate, endDate, location, manager } = req.body;
  const [project] = await db.insert(projectsTable).values({
    name,
    client,
    description,
    budget: budget.toString(),
    startDate,
    endDate,
    location,
    manager,
  }).returning();
  return res.status(201).json(formatProject(project));
});

router.get("/:id", async (req, res) => {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parseInt(req.params.id))).limit(1);
  if (!project) return res.status(404).json({ error: "Obra não encontrada" });

  const accounts = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.projectId, project.id));
  const spent = accounts.filter(a => a.type === "payable").reduce((s, a) => s + parseFloat(a.amount), 0);
  return res.json({ ...formatProject(project), spent });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: any = {};
  const fields = ["name", "client", "description", "status", "budget", "endDate", "location", "manager"];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates[f === "budget" ? "budget" : f] = f === "budget" ? req.body[f].toString() : req.body[f];
    }
  }
  await db.update(projectsTable).set(updates).where(eq(projectsTable.id, id));
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
  return res.json(formatProject(project));
});

router.get("/:id/budget-analysis", async (req, res) => {
  const id = parseInt(req.params.id);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
  if (!project) return res.status(404).json({ error: "Obra não encontrada" });

  const accounts = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.projectId, id));

  const paid = accounts.filter(a => a.type === "payable" && a.status === "paid").reduce((s, a) => s + parseFloat(a.amount), 0);
  const pending = accounts.filter(a => a.type === "payable" && a.status === "pending").reduce((s, a) => s + parseFloat(a.amount), 0);
  const budget = parseFloat(project.budget);

  const categoryMap: Record<string, { budgeted: number; spent: number }> = {};
  for (const a of accounts.filter(a => a.type === "payable")) {
    const cat = a.category ?? "Outros";
    if (!categoryMap[cat]) categoryMap[cat] = { budgeted: budget / 4, spent: 0 };
    if (a.status === "paid") categoryMap[cat].spent += parseFloat(a.amount);
  }

  return res.json({
    projectId: id,
    projectName: project.name,
    budget,
    spent: paid,
    committed: pending,
    remaining: budget - paid - pending,
    percentUsed: budget > 0 ? Math.round(((paid + pending) / budget) * 100) : 0,
    byCategory: Object.entries(categoryMap).map(([category, data]) => ({ category, ...data })),
  });
});

export default router;
