import { Router } from "express";
import { db } from "@workspace/db";
import {
  financialAccountsTable,
  financialCategoriesTable,
  projectsTable,
  suppliersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const DEFAULT_EXPENSE_CATEGORIES = [
  "Compra de materiais","Mão de obra","Equipamentos",
  "Despesas administrativas","Combustível","EPI e segurança","Outros"
];
const DEFAULT_INCOME_CATEGORIES = ["Receita de obra","Adiantamento de cliente","Outros"];

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
    clientName: a.clientName,
    attachmentUrl: a.attachmentUrl,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  };
}

// GET /accounts
router.get("/accounts", async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar contas" });
  }
});

// POST /accounts
router.post("/accounts", async (req, res) => {
  try {
    const { type, description, amount, dueDate, projectId, supplierId, category, clientName, attachmentUrl, notes } = req.body;
    const [account] = await db.insert(financialAccountsTable).values({
      type, description,
      amount: amount.toString(),
      dueDate, projectId, supplierId, category,
      clientName: clientName || null,
      attachmentUrl: attachmentUrl || null,
      notes: notes || null,
    }).returning();
    return res.status(201).json(await enrichAccount(account));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar conta" });
  }
});

// PATCH /accounts/:id
router.patch("/accounts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: any = {};
    const fields = ["description", "category", "clientName", "attachmentUrl", "notes", "dueDate", "supplierId", "projectId"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f] || null;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.paidAt) updates.paidAt = new Date(req.body.paidAt);
    if (req.body.amount) updates.amount = req.body.amount.toString();
    await db.update(financialAccountsTable).set(updates).where(eq(financialAccountsTable.id, id));
    const [account] = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.id, id)).limit(1);
    return res.json(await enrichAccount(account));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar conta" });
  }
});

// DELETE /accounts/:id
router.delete("/accounts/:id", async (req, res) => {
  try {
    await db.delete(financialAccountsTable).where(eq(financialAccountsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir conta" });
  }
});

// GET /categories
router.get("/categories", async (req, res) => {
  try {
    const { type } = req.query as { type?: string };
    const custom = await db.select().from(financialCategoriesTable).orderBy(financialCategoriesTable.name);
    const defaults = type === "receivable" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    const customNames = custom.filter(c => !type || c.type === type).map(c => c.name);
    return res.json([...defaults, ...customNames.filter(n => !defaults.includes(n))]);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

// POST /categories
router.post("/categories", async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Nome e tipo são obrigatórios" });
    const [cat] = await db.insert(financialCategoriesTable).values({ name, type }).returning();
    return res.status(201).json(cat);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

// GET /export-csv?type=payable|receivable|all
router.get("/export-csv", async (req, res) => {
  try {
    const { type } = req.query as { type?: string };
    let accounts = await db.select().from(financialAccountsTable).orderBy(financialAccountsTable.dueDate);
    if (type && type !== "all") accounts = accounts.filter(a => a.type === type);
    const enriched = await Promise.all(accounts.map(enrichAccount));

    const headers = ["ID","Tipo","Descrição","Categoria","Valor","Vencimento","Pago em","Status","Fornecedor","Cliente","Projeto","Observações"];
    const rows = enriched.map(a => [
      a.id,
      a.type === "payable" ? "A Pagar" : "A Receber",
      a.description,
      a.category ?? "",
      a.amount.toFixed(2).replace(".", ","),
      a.dueDate,
      a.paidAt ? new Date(a.paidAt).toLocaleDateString("pt-BR") : "",
      a.status === "paid" ? "Pago" : a.status === "pending" ? "Pendente" : a.status === "overdue" ? "Vencido" : "Cancelado",
      a.supplierName ?? "",
      a.clientName ?? "",
      a.projectName ?? "",
      a.notes ?? "",
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    res.setHeader("Content-Type", "text/csv;charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="financeiro_${type ?? "all"}_${new Date().toISOString().slice(0,10)}.csv"`);
    return res.send("\uFEFF" + csv);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao exportar" });
  }
});

// GET /supplier-discounts - Dashboard de descontos com fornecedores
router.get("/supplier-discounts", async (req, res) => {
  try {
    const suppliers = await db.select().from(suppliersTable);
    const accounts = await db.select().from(financialAccountsTable);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const result = suppliers.map(s => {
      const supplierAccounts = accounts.filter(a =>
        a.supplierId === s.id &&
        a.type === "payable" &&
        a.dueDate >= startOfMonth &&
        a.dueDate <= endOfMonth
      );
      const totalPaid = supplierAccounts.filter(a => a.status === "paid").reduce((sum, a) => sum + parseFloat(a.amount), 0);
      const totalPending = supplierAccounts.filter(a => a.status !== "paid").reduce((sum, a) => sum + parseFloat(a.amount), 0);

      return {
        supplierId: s.id,
        supplierName: s.name,
        totalPaid,
        totalPending,
        totalMonth: totalPaid + totalPending,
        transactionCount: supplierAccounts.length,
      };
    }).filter(s => s.totalMonth > 0).sort((a, b) => b.totalMonth - a.totalMonth);

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar descontos" });
  }
});

router.get("/expenses-by-project", async (req, res) => {
  try {
    const projects = await db.select().from(projectsTable);
    const accounts = await db.select().from(financialAccountsTable);
    return res.json(projects.map(p => {
      const expenses = accounts.filter(a => a.projectId === p.id && a.type === "payable").reduce((s, a) => s + parseFloat(a.amount), 0);
      const budget = parseFloat(p.budget);
      return { projectId: p.id, projectName: p.name, totalExpenses: expenses, budgeted: budget, percentUsed: budget > 0 ? Math.round((expenses / budget) * 100) : 0 };
    }));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar despesas por projeto" });
  }
});

router.get("/monthly-summary", async (req, res) => {
  try {
    const accounts = await db.select().from(financialAccountsTable);
    const summaryMap: Record<string, { income: number; expenses: number }> = {};
    for (const a of accounts) {
      const month = a.dueDate.slice(0, 7);
      if (!summaryMap[month]) summaryMap[month] = { income: 0, expenses: 0 };
      if (a.type === "receivable") summaryMap[month].income += parseFloat(a.amount);
      else summaryMap[month].expenses += parseFloat(a.amount);
    }
    return res.json(Object.entries(summaryMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({ month, ...data, balance: data.income - data.expenses })));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar resumo mensal" });
  }
});

export default router;
