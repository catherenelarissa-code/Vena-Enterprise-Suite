import { Router } from "express";
import { db } from "@workspace/db";
import {
  financialAccountsTable,
  projectsTable,
  suppliersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichAccount(a: any) {
  let projectName = null;
  let supplierName = null;
  if (a.projectId) {
    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, a.projectId)).limit(1);
    projectName = p?.name ?? null;
  }
  if (a.supplierId) {
    const [s] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, a.supplierId)).limit(1);
    supplierName = s?.name ?? null;
  }
  return {
    id: a.id,
    type: a.type,
    description: a.description,
    amount: parseFloat(a.amount),
    dueDate: a.dueDate,
    paidAt: a.paidAt?.toISOString() ?? null,
    status: a.status,
    projectId: a.projectId,
    projectName,
    supplierId: a.supplierId,
    supplierName,
    category: a.category,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/accounts", async (req, res) => {
  const { type, status, due_in_days } = req.query as { type?: string; status?: string; due_in_days?: string };
  let accounts = await db.select().from(financialAccountsTable).orderBy(financialAccountsTable.dueDate);

  if (type) accounts = accounts.filter(a => a.type === type);
  if (status) accounts = accounts.filter(a => a.status === status);
  if (due_in_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + parseInt(due_in_days));
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    accounts = accounts.filter(a => a.dueDate <= cutoffStr);
  }

  return res.json(await Promise.all(accounts.map(enrichAccount)));
});

router.post("/accounts", async (req, res) => {
  const { type, description, amount, dueDate, projectId, supplierId, category } = req.body;
  const [account] = await db.insert(financialAccountsTable).values({
    type,
    description,
    amount: amount.toString(),
    dueDate,
    projectId,
    supplierId,
    category,
  }).returning();
  return res.status(201).json(await enrichAccount(account));
});

router.patch("/accounts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: any = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.paidAt) updates.paidAt = new Date(req.body.paidAt);
  if (req.body.amount) updates.amount = req.body.amount.toString();
  if (req.body.dueDate) updates.dueDate = req.body.dueDate;
  await db.update(financialAccountsTable).set(updates).where(eq(financialAccountsTable.id, id));
  const [account] = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.id, id)).limit(1);
  return res.json(await enrichAccount(account));
});

router.get("/expenses-by-project", async (req, res) => {
  const projects = await db.select().from(projectsTable);
  const accounts = await db.select().from(financialAccountsTable);

  return res.json(projects.map(p => {
    const expenses = accounts
      .filter(a => a.projectId === p.id && a.type === "payable")
      .reduce((s, a) => s + parseFloat(a.amount), 0);
    const budget = parseFloat(p.budget);
    return {
      projectId: p.id,
      projectName: p.name,
      totalExpenses: expenses,
      budgeted: budget,
      percentUsed: budget > 0 ? Math.round((expenses / budget) * 100) : 0,
    };
  }));
});

router.get("/monthly-summary", async (req, res) => {
  const accounts = await db.select().from(financialAccountsTable);
  const summaryMap: Record<string, { income: number; expenses: number }> = {};

  for (const a of accounts) {
    const month = a.dueDate.slice(0, 7);
    if (!summaryMap[month]) summaryMap[month] = { income: 0, expenses: 0 };
    if (a.type === "receivable") summaryMap[month].income += parseFloat(a.amount);
    else summaryMap[month].expenses += parseFloat(a.amount);
  }

  const result = Object.entries(summaryMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses,
    }));

  return res.json(result);
});

export default router;
