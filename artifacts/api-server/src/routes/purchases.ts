import { Router } from "express";
import { db } from "@workspace/db";
import {
  purchaseRequestsTable,
  purchaseRequestItemsTable,
  quotesTable,
  quoteItemsTable,
  purchaseOrdersTable,
  projectsTable,
  suppliersTable,
  financialAccountsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichRequest(req: any) {
  const items = await db.select().from(purchaseRequestItemsTable).where(eq(purchaseRequestItemsTable.requestId, req.id));
  let projectName = null;
  if (req.projectId) {
    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, req.projectId)).limit(1);
    projectName = p?.name ?? null;
  }
  return {
    id: req.id,
    title: req.title,
    requestedBy: req.requestedBy,
    projectId: req.projectId,
    projectName,
    status: req.status,
    urgency: req.urgency,
    notes: req.notes,
    createdAt: req.createdAt.toISOString(),
    items: items.map(i => ({
      id: i.id,
      materialName: i.materialName,
      quantity: parseFloat(i.quantity),
      unit: i.unit,
      notes: i.notes,
    })),
  };
}

// ── Purchase Requests ─────────────────────────────────────────────────────────

router.get("/requests", async (req, res) => {
  const { status, project_id } = req.query as { status?: string; project_id?: string };
  let reqs = await db.select().from(purchaseRequestsTable).orderBy(purchaseRequestsTable.createdAt);
  if (status) reqs = reqs.filter(r => r.status === status);
  if (project_id) reqs = reqs.filter(r => r.projectId === parseInt(project_id));
  const result = await Promise.all(reqs.map(enrichRequest));
  return res.json(result);
});

router.post("/requests", async (req, res) => {
  const { title, projectId, urgency, notes, items } = req.body;
  const [pr] = await db.insert(purchaseRequestsTable).values({
    title,
    requestedBy: "Usuário atual",
    projectId,
    urgency: urgency ?? "normal",
    notes,
  }).returning();

  if (items?.length) {
    await db.insert(purchaseRequestItemsTable).values(
      items.map((item: any) => ({
        requestId: pr.id,
        materialName: item.materialName,
        quantity: item.quantity.toString(),
        unit: item.unit,
        notes: item.notes,
      }))
    );
  }

  return res.status(201).json(await enrichRequest(pr));
});

router.get("/requests/:id", async (req, res) => {
  const [pr] = await db.select().from(purchaseRequestsTable).where(eq(purchaseRequestsTable.id, parseInt(req.params.id))).limit(1);
  if (!pr) return res.status(404).json({ error: "Não encontrado" });
  return res.json(await enrichRequest(pr));
});

router.patch("/requests/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: any = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.urgency) updates.urgency = req.body.urgency;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  await db.update(purchaseRequestsTable).set(updates).where(eq(purchaseRequestsTable.id, id));
  const [pr] = await db.select().from(purchaseRequestsTable).where(eq(purchaseRequestsTable.id, id)).limit(1);
  return res.json(await enrichRequest(pr));
});

// ✅ DELETE /requests/:id — exclui solicitação e tudo vinculado
router.delete("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Busca cotações vinculadas
    const quotes = await db.select().from(quotesTable).where(eq(quotesTable.purchaseRequestId, id));

    // Deleta itens das cotações
    for (const quote of quotes) {
      await db.delete(quoteItemsTable).where(eq(quoteItemsTable.quoteId, quote.id));
      await db.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.quoteId, quote.id));
    }

    // Deleta cotações
    await db.delete(quotesTable).where(eq(quotesTable.purchaseRequestId, id));

    // Deleta itens da solicitação
    await db.delete(purchaseRequestItemsTable).where(eq(purchaseRequestItemsTable.requestId, id));

    // Deleta a solicitação
    await db.delete(purchaseRequestsTable).where(eq(purchaseRequestsTable.id, id));

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir solicitação" });
  }
});

// ── Quotes ────────────────────────────────────────────────────────────────────

async function enrichQuote(quote: any) {
  const items = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, quote.id));
  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, quote.supplierId)).limit(1);
  const subtotal = items.reduce((s: number, i: any) => s + parseFloat(i.unitPrice) * parseFloat(i.quantity), 0);
  const discountPct = quote.discount ? parseFloat(quote.discount) : 0;
  const discountAmount = subtotal * (discountPct / 100);
  const totalAmount = subtotal - discountAmount;
  return {
    id: quote.id,
    purchaseRequestId: quote.purchaseRequestId,
    supplierId: quote.supplierId,
    supplierName: supplier?.name ?? "Desconhecido",
    subtotal,
    discount: discountPct,
    discountAmount,
    totalAmount,
    deliveryDays: quote.deliveryDays,
    freightCost: quote.freightCost ? parseFloat(quote.freightCost) : null,
    status: quote.status,
    notes: quote.notes,
    createdAt: quote.createdAt.toISOString(),
    items: items.map(i => ({
      id: i.id,
      materialName: i.materialName,
      quantity: parseFloat(i.quantity),
      unit: i.unit,
      unitPrice: parseFloat(i.unitPrice),
      total: parseFloat(i.quantity) * parseFloat(i.unitPrice),
    })),
  };
}

router.get("/quotes", async (req, res) => {
  const { request_id } = req.query as { request_id?: string };
  let quotes = await db.select().from(quotesTable).orderBy(quotesTable.createdAt);
  if (request_id) quotes = quotes.filter(q => q.purchaseRequestId === parseInt(request_id));
  return res.json(await Promise.all(quotes.map(enrichQuote)));
});

router.post("/quotes", async (req, res) => {
  const { purchaseRequestId, supplierId, deliveryDays, freightCost, discount, notes, items } = req.body;
  const [quote] = await db.insert(quotesTable).values({
    purchaseRequestId,
    supplierId,
    deliveryDays,
    freightCost: freightCost?.toString(),
    discount: discount?.toString() ?? "0",   // ✅ salva desconto
    notes,
  }).returning();

  if (items?.length) {
    await db.insert(quoteItemsTable).values(
      items.map((item: any) => ({
        quoteId: quote.id,
        materialName: item.materialName,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
      }))
    );
  }

  await db.update(purchaseRequestsTable)
    .set({ status: "quoting" })
    .where(eq(purchaseRequestsTable.id, purchaseRequestId));

  return res.status(201).json(await enrichQuote(quote));
});

router.post("/quotes/:id/approve", async (req, res) => {
  const quoteId = parseInt(req.params.id);
  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, quoteId)).limit(1);
  if (!quote) return res.status(404).json({ error: "Cotação não encontrada" });

  await db.update(quotesTable).set({ status: "approved" }).where(eq(quotesTable.id, quoteId));

  const enriched = await enrichQuote({ ...quote, status: "approved" });

  const [pr] = await db.select().from(purchaseRequestsTable).where(eq(purchaseRequestsTable.id, quote.purchaseRequestId)).limit(1);

  const [order] = await db.insert(purchaseOrdersTable).values({
    quoteId,
    supplierId: quote.supplierId,
    projectId: pr?.projectId,
    totalAmount: enriched.totalAmount.toString(),
    status: "pending",
  }).returning();

  await db.update(purchaseRequestsTable).set({ status: "ordered" }).where(eq(purchaseRequestsTable.id, quote.purchaseRequestId));
  await db.insert(financialAccountsTable).values({
    type: "payable",
    description: `Pedido de compra #${order.id} — ${pr?.title ?? "Sem título"}`,
    amount: enriched.totalAmount.toString(),
    dueDate: new Date().toISOString().slice(0, 10),
    status: "pending",
    supplierId: quote.supplierId,
    projectId: pr?.projectId ?? null,
    purchaseOrderId: order.id,
  });

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, quote.supplierId)).limit(1);

  return res.json({
    id: order.id,
    quoteId: order.quoteId,
    supplierId: order.supplierId,
    supplierName: supplier?.name ?? "",
    projectId: order.projectId,
    projectName: null,
    totalAmount: parseFloat(order.totalAmount),
    status: order.status,
    expectedDelivery: order.expectedDelivery,
    deliveredAt: null,
    createdAt: order.createdAt.toISOString(),
  });
});

router.get("/quotes/compare", async (req, res) => {
  const { request_id } = req.query as { request_id?: string };
  if (!request_id) return res.status(400).json({ error: "request_id required" });

  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.purchaseRequestId, parseInt(request_id)));
  const enriched = await Promise.all(quotes.map(enrichQuote));

  const sorted = [...enriched].sort((a, b) => a.totalAmount - b.totalAmount);
  const recommended = sorted[0];

  const aiInsight = enriched.length > 1
    ? `Fornecedor "${recommended.supplierName}" está ${Math.round((1 - recommended.totalAmount / sorted[1].totalAmount) * 100)}% mais barato. Verificar histórico de entrega antes de confirmar.`
    : null;

  return res.json({
    purchaseRequestId: parseInt(request_id),
    quotes: enriched,
    recommendedQuoteId: recommended?.id ?? null,
    aiInsight,
  });
});

// ── Purchase Orders ───────────────────────────────────────────────────────────

router.get("/orders", async (req, res) => {
  const { status, supplier_id } = req.query as { status?: string; supplier_id?: string };
  let orders = await db.select().from(purchaseOrdersTable).orderBy(purchaseOrdersTable.createdAt);
  if (status) orders = orders.filter(o => o.status === status);
  if (supplier_id) orders = orders.filter(o => o.supplierId === parseInt(supplier_id));

  const result = await Promise.all(orders.map(async o => {
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, o.supplierId)).limit(1);
    const [project] = o.projectId ? await db.select().from(projectsTable).where(eq(projectsTable.id, o.projectId!)).limit(1) : [null];
    return {
      id: o.id,
      quoteId: o.quoteId,
      supplierId: o.supplierId,
      supplierName: supplier?.name ?? "",
      projectId: o.projectId,
      projectName: project?.name ?? null,
      totalAmount: parseFloat(o.totalAmount),
      status: o.status,
      expectedDelivery: o.expectedDelivery,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
    };
  }));
  return res.json(result);
});

router.get("/orders/:id", async (req, res) => {
  const [order] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, parseInt(req.params.id))).limit(1);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, order.supplierId)).limit(1);
  return res.json({
    id: order.id,
    quoteId: order.quoteId,
    supplierId: order.supplierId,
    supplierName: supplier?.name ?? "",
    projectId: order.projectId,
    projectName: null,
    totalAmount: parseFloat(order.totalAmount),
    status: order.status,
    expectedDelivery: order.expectedDelivery,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  });
});

router.get("/history", async (req, res) => {
  const { material } = req.query as { material?: string };
  const items = await db.select().from(quoteItemsTable);
  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.status, "approved"));
  const suppliers = await db.select().from(suppliersTable);

  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
  const quoteMap = new Map(quotes.map(q => [q.id, q]));

  const allPrices: Record<string, number[]> = {};
  for (const item of items) {
    if (!allPrices[item.materialName]) allPrices[item.materialName] = [];
    allPrices[item.materialName].push(parseFloat(item.unitPrice));
  }

  const history = items
    .filter(i => quoteMap.has(i.quoteId))
    .filter(i => !material || i.materialName.toLowerCase().includes(material.toLowerCase()))
    .map(i => {
      const quote = quoteMap.get(i.quoteId)!;
      const avg = allPrices[i.materialName] ? allPrices[i.materialName].reduce((a, b) => a + b, 0) / allPrices[i.materialName].length : null;
      const unitPrice = parseFloat(i.unitPrice);
      const vsAvgPercent = avg ? Math.round(((unitPrice - avg) / avg) * 100) : null;
      return {
        date: quote.createdAt.toISOString().slice(0, 10),
        supplier: supplierMap.get(quote.supplierId) ?? "Desconhecido",
        material: i.materialName,
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        unitPrice,
        total: parseFloat(i.quantity) * unitPrice,
        vsAvgPercent,
      };
    });

  return res.json(history.sort((a, b) => b.date.localeCompare(a.date)));
});

export default router;
