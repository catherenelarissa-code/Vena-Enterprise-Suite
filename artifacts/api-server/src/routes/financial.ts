import { Router } from "express";
import { db } from "@workspace/db";
import {
  financialAccountsTable,
  financialCategoriesTable,
  projectsTable,
  suppliersTable,
  clientsTable,
  clientHistoryTable,
  purchaseOrdersTable,
  operationalExpensesTable,
  expenseTypeTagsTable,
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
  let clientNameResolved = a.clientName ?? null;

  if (a.projectId) {
    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, a.projectId)).limit(1);
    projectName = p?.name ?? null;
  }
  if (a.supplierId) {
    const [s] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, a.supplierId)).limit(1);
    supplierName = s?.name ?? null;
  }
  if (a.clientId) {
    const [c] = await db.select().from(clientsTable).where(eq(clientsTable.id, a.clientId)).limit(1);
    clientNameResolved = c?.name ?? clientNameResolved;
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
    clientId: a.clientId ?? null,
    clientName: clientNameResolved,
    purchaseOrderId: a.purchaseOrderId ?? null,
    paymentMethod: a.paymentMethod ?? null,
    category: a.category,
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
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar contas" });
  }
});

// POST /accounts
router.post("/accounts", async (req, res) => {
  try {
    const { type, description, amount, dueDate, projectId, supplierId, clientId, paymentMethod, category, clientName, attachmentUrl, notes } = req.body;
    const [account] = await db.insert(financialAccountsTable).values({
      type, description,
      amount: amount.toString(),
      dueDate, projectId, supplierId, category,
      clientId: clientId || null,
      paymentMethod: paymentMethod || null,
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
    const fields = ["description", "category", "clientName", "attachmentUrl", "notes", "dueDate", "supplierId", "projectId", "clientId", "paymentMethod"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f] || null;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.paidAt) updates.paidAt = new Date(req.body.paidAt);
    if (req.body.amount) updates.amount = req.body.amount.toString();
    await db.update(financialAccountsTable).set(updates).where(eq(financialAccountsTable.id, id));
    const [account] = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.id, id)).limit(1);
    return res.json(await enrichAccount(account));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar conta" });
  }
});

// PATCH /accounts/:id/pay — marca como pago e propaga o efeito (Compras + histórico do cliente)
router.patch("/accounts/:id/pay", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { paymentMethod } = req.body;

    const [account] = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.id, id)).limit(1);
    if (!account) return res.status(404).json({ error: "Lançamento não encontrado" });

    await db.update(financialAccountsTable)
      .set({
        status: "paid",
        paidAt: new Date(),
        paymentMethod: paymentMethod ?? account.paymentMethod,
      })
      .where(eq(financialAccountsTable.id, id));

    if (account.purchaseOrderId) {
      await db.update(purchaseOrdersTable)
        .set({ status: "confirmed" })
        .where(eq(purchaseOrdersTable.id, account.purchaseOrderId));
    }

    if (account.clientId) {
      await db.insert(clientHistoryTable).values({
        clientId: account.clientId,
        type: "payment",
        description: `Pagamento ${account.type === "payable" ? "efetuado" : "recebido"}: ${account.description} — R$ ${parseFloat(account.amount).toFixed(2)}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
      });
    }

    const [updated] = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.id, id)).limit(1);
    return res.json(await enrichAccount(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registrar pagamento" });
  }
});

// DELETE /accounts/:id
router.delete("/accounts/:id", async (req, res) => {
  try {
    await db.delete(financialAccountsTable).where(eq(financialAccountsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
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

// GET /supplier-discounts
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

// GET /expenses-by-project
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

// GET /monthly-summary
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

// ── Despesas Operacionais ──────────────────────────────────────────────────────

// GET /expenses
router.get("/expenses", async (_req, res) => {
  try {
    const expenses = await db.select().from(operationalExpensesTable).orderBy(desc(operationalExpensesTable.createdAt));
    return res.json(expenses.map((e: any) => ({
      ...e,
      amount: parseFloat(e.amount),
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar despesas" });
  }
});

// POST /expenses
router.post("/expenses", async (req, res) => {
  try {
    const { expenseType, description, supplierName, amount, paymentMethod, attachmentUrl, ocrRawText } = req.body;
    if (!expenseType || !description || !amount || !paymentMethod) {
      return res.status(400).json({ error: "Tipo, descrição, valor e método de pagamento são obrigatórios" });
    }
    const [expense] = await db.insert(operationalExpensesTable).values({
      expenseType, description, supplierName: supplierName || null,
      amount: amount.toString(),
      paymentMethod, attachmentUrl: attachmentUrl || null, ocrRawText: ocrRawText || null,
    }).returning();
    return res.status(201).json({ ...expense, amount: parseFloat(expense.amount), createdAt: expense.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar despesa" });
  }
});

// DELETE /expenses/:id
router.delete("/expenses/:id", async (req, res) => {
  try {
    await db.delete(operationalExpensesTable).where(eq(operationalExpensesTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir despesa" });
  }
});

// GET /expense-tags
router.get("/expense-tags", async (_req, res) => {
  try {
    return res.json(await db.select().from(expenseTypeTagsTable));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar tags" });
  }
});

// POST /expense-tags
router.post("/expense-tags", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome obrigatório" });
    const [tag] = await db.insert(expenseTypeTagsTable).values({ name }).returning();
    return res.status(201).json(tag);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar tag" });
  }
});

export default router;
