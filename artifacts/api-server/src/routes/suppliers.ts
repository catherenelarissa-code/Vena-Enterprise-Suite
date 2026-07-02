import { Router } from "express";
import { db } from "@workspace/db";
import {
  suppliersTable,
  supplierEvaluationsTable,
  quoteItemsTable,
  quotesTable,
  purchaseOrdersTable,
} from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";

const router = Router();

async function getSupplierWithScores(supplierId: number) {
  const supplier = await db.select().from(suppliersTable).where(eq(suppliersTable.id, supplierId)).limit(1);
  if (!supplier[0]) return null;

  const evals = await db.select().from(supplierEvaluationsTable).where(eq(supplierEvaluationsTable.supplierId, supplierId));
  const count = evals.length;
  const avgPriceScore = count ? evals.reduce((s, e) => s + parseFloat(e.priceScore), 0) / count : 0;
  const avgDeliveryScore = count ? evals.reduce((s, e) => s + parseFloat(e.deliveryScore), 0) / count : 0;
  const avgQualityScore = count ? evals.reduce((s, e) => s + parseFloat(e.qualityScore), 0) / count : 0;

  const orders = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.supplierId, supplierId));

  return {
    ...supplier[0],
    avgPriceScore: Math.round(avgPriceScore * 10) / 10,
    avgDeliveryScore: Math.round(avgDeliveryScore * 10) / 10,
    avgQualityScore: Math.round(avgQualityScore * 10) / 10,
    totalPurchases: orders.length,
    createdAt: supplier[0].createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { search, category } = req.query as { search?: string; category?: string };
  let suppliers = await db.select().from(suppliersTable);

  if (search) {
    const q = search.toLowerCase();
    suppliers = suppliers.filter(s => s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q));
  }
  if (category) {
    suppliers = suppliers.filter(s => s.category === category);
  }

  const result = await Promise.all(suppliers.map(s => getSupplierWithScores(s.id)));
  return res.json(result.filter(Boolean));
});

router.post("/", async (req, res) => {
  const [supplier] = await db.insert(suppliersTable).values({
    name: req.body.name,
    category: req.body.category,
    contact: req.body.contact,
    email: req.body.email,
    phone: req.body.phone,
    cnpj: req.body.cnpj,
    address: req.body.address,
    pixKey: req.body.pixKey,   // <-- adicionar
    notes: req.body.notes,
  }).returning();
  const full = await getSupplierWithScores(supplier.id);
  return res.status(201).json(full);
});

router.get("/:id", async (req, res) => {
  const full = await getSupplierWithScores(parseInt(req.params.id));
  if (!full) return res.status(404).json({ error: "Fornecedor não encontrado" });
  return res.json(full);
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(suppliersTable).set({
    name: req.body.name,
    category: req.body.category,
    contact: req.body.contact,
    email: req.body.email,
    phone: req.body.phone,
    cnpj: req.body.cnpj,
    address: req.body.address,
    pixKey: req.body.pixKey,   // <-- adicionar
    notes: req.body.notes,
  }).where(eq(suppliersTable.id, id));
  const full = await getSupplierWithScores(id);
  return res.json(full);
});

router.delete("/:id", async (req, res) => {
  await db.delete(suppliersTable).where(eq(suppliersTable.id, parseInt(req.params.id)));
  return res.status(204).send();
});

router.post("/:id/evaluate", async (req, res) => {
  const supplierId = parseInt(req.params.id);
  const [evaluation] = await db.insert(supplierEvaluationsTable).values({
    supplierId,
    priceScore: req.body.priceScore.toString(),
    deliveryScore: req.body.deliveryScore.toString(),
    qualityScore: req.body.qualityScore.toString(),
    notes: req.body.notes,
    purchaseOrderId: req.body.purchaseOrderId,
  }).returning();
  return res.status(201).json({
    ...evaluation,
    priceScore: parseFloat(evaluation.priceScore),
    deliveryScore: parseFloat(evaluation.deliveryScore),
    qualityScore: parseFloat(evaluation.qualityScore),
    createdAt: evaluation.createdAt.toISOString(),
  });
});

router.get("/:id/price-history", async (req, res) => {
  const supplierId = parseInt(req.params.id);
  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.supplierId, supplierId));
  const history: any[] = [];
  for (const quote of quotes) {
    const items = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, quote.id));
    for (const item of items) {
      history.push({
        date: quote.createdAt.toISOString().slice(0, 10),
        material: item.materialName,
        unitPrice: parseFloat(item.unitPrice),
        quantity: parseFloat(item.quantity),
        total: parseFloat(item.unitPrice) * parseFloat(item.quantity),
      });
    }
  }
  return res.json(history);
});

// GET /monthly-discounts
// Valor em R$ economizado por mês, considerando apenas cotações aprovadas
// (discount% aplicado sobre o valor total dos itens daquela cotação).
router.get("/monthly-discounts", async (req, res) => {
  try {
    const approvedQuotes = await db.select().from(quotesTable).where(eq(quotesTable.status, "approved"));

    const monthlyMap: Record<string, number> = {};

    for (const quote of approvedQuotes) {
      const discountPercent = parseFloat(quote.discount ?? "0");
      if (!discountPercent) continue;

      const items = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, quote.id));
      const quoteTotal = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * parseFloat(item.quantity), 0);
      const savedAmount = quoteTotal * (discountPercent / 100);

      const month = quote.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap[month] = (monthlyMap[month] ?? 0) + savedAmount;
    }

    const result = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, savedAmount]) => ({ month, savedAmount: Math.round(savedAmount * 100) / 100 }));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao calcular descontos mensais" });
  }
});

export default router;
