import { Router } from "express";
import { db } from "@workspace/db";
import {
  financialAccountsTable,
  purchaseRequestsTable,
  projectsTable,
  materialsTable,
  alertsTable,
} from "@workspace/db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
const router = Router();
router.get("/summary", async (req, res) => {
  const allAccounts = await db.select().from(financialAccountsTable);
  const payable = allAccounts.filter(a => a.type === "payable" && a.status === "pending");
  const receivable = allAccounts.filter(a => a.type === "receivable" && a.status === "pending");
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);
  const payableThisWeek = payable
    .filter(a => a.dueDate <= nextWeekStr && a.dueDate >= todayStr)
    .reduce((sum, a) => sum + parseFloat(a.amount), 0);
  const receivableThisWeek = receivable
    .filter(a => a.dueDate <= nextWeekStr && a.dueDate >= todayStr)
    .reduce((sum, a) => sum + parseFloat(a.amount), 0);
  const cashBalance = receivable.reduce((s, a) => s + parseFloat(a.amount), 0)
    - payable.reduce((s, a) => s + parseFloat(a.amount), 0);
  const [pendingPurchasesRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(purchaseRequestsTable)
    .where(eq(purchaseRequestsTable.status, "pending"));
  const [activeProjectsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projectsTable)
    .where(eq(projectsTable.status, "active"));
  const materials = await db.select().from(materialsTable);
  const lowStockItems = materials.filter(m => parseFloat(m.currentStock) <= parseFloat(m.minimumStock)).length;
  return res.json({
    cashBalance,
    payableThisWeek,
    receivableThisWeek,
    pendingPurchases: Number(pendingPurchasesRes?.count ?? 0),
    activeProjects: Number(activeProjectsRes?.count ?? 0),
    lowStockItems,
  });
});
router.get("/projects-overview", async (req, res) => {
  const projects = await db.select().from(projectsTable);
  const accounts = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.status, "paid"));
  return res.json(projects.slice(0, 8).map(p => {
    const spent = accounts
      .filter(a => a.projectId === p.id && a.type === "payable")
      .reduce((s, a) => s + parseFloat(a.amount), 0);
    const budget = parseFloat(p.budget);
    return {
      id: p.id,
      name: p.name,
      budgeted: budget,
      spent,
      percentUsed: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      status: p.status,
    };
  }));
});
router.get("/alerts", async (req, res) => {
  const alerts = await db.select().from(alertsTable)
    .orderBy(sql`${alertsTable.createdAt} desc`)
    .limit(10);
  return res.json(alerts.map(a => ({
    id: a.id,
    type: a.type,
    title: a.title,
    message: a.message,
    severity: a.severity,
    relatedId: a.relatedId,
    createdAt: a.createdAt.toISOString(),
  })));
});
export default router;
