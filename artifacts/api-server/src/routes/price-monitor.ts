import { Router } from "express";
import { db } from "@workspace/db";
import {
  monitoredProductsTable,
  priceHistoryTable,
  priceAlertsTable,
  suppliersTable,
  supplierEvaluationsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function enrichProduct(p: any) {
  const history = await db.select().from(priceHistoryTable)
    .where(eq(priceHistoryTable.productId, p.id))
    .orderBy(desc(priceHistoryTable.recordedAt));

  const now = Date.now();
  const prices30 = history.filter(h => now - h.recordedAt.getTime() < 30 * 86400000).map(h => parseFloat(h.price));
  const prices60 = history.filter(h => now - h.recordedAt.getTime() < 60 * 86400000).map(h => parseFloat(h.price));
  const prices90 = history.filter(h => now - h.recordedAt.getTime() < 90 * 86400000).map(h => parseFloat(h.price));

  const currentPrice = parseFloat(p.currentPrice);
  const lowestPrice30d = prices30.length ? Math.min(...prices30) : currentPrice;
  const lowestPrice60d = prices60.length ? Math.min(...prices60) : currentPrice;
  const lowestPrice90d = prices90.length ? Math.min(...prices90) : currentPrice;

  const prevPrice = history[1] ? parseFloat(history[1].price) : currentPrice;
  const priceChangePercent = prevPrice > 0 ? Math.round(((currentPrice - prevPrice) / prevPrice) * 100 * 10) / 10 : 0;

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    url: p.url,
    currentPrice,
    lowestPrice30d,
    lowestPrice60d,
    lowestPrice90d,
    priceChangePercent,
    alertThresholdPercent: parseFloat(p.alertThresholdPercent),
    aiInsight: p.aiInsight,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  const products = await db.select().from(monitoredProductsTable).orderBy(monitoredProductsTable.name);
  return res.json(await Promise.all(products.map(enrichProduct)));
});

router.post("/products", async (req, res) => {
  const { name, category, url, currentPrice, alertThresholdPercent } = req.body;
  const [product] = await db.insert(monitoredProductsTable).values({
    name,
    category,
    url,
    currentPrice: currentPrice.toString(),
    alertThresholdPercent: (alertThresholdPercent ?? 10).toString(),
  }).returning();

  await db.insert(priceHistoryTable).values({
    productId: product.id,
    price: currentPrice.toString(),
    supplier: null,
  });

  return res.status(201).json(await enrichProduct(product));
});

router.get("/products/:id", async (req, res) => {
  const [p] = await db.select().from(monitoredProductsTable).where(eq(monitoredProductsTable.id, parseInt(req.params.id))).limit(1);
  if (!p) return res.status(404).json({ error: "Produto não encontrado" });
  return res.json(await enrichProduct(p));
});

router.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(priceHistoryTable).where(eq(priceHistoryTable.productId, id));
  await db.delete(priceAlertsTable).where(eq(priceAlertsTable.productId, id));
  await db.delete(monitoredProductsTable).where(eq(monitoredProductsTable.id, id));
  return res.status(204).send();
});

router.get("/products/:id/price-history", async (req, res) => {
  const id = parseInt(req.params.id);
  const history = await db.select().from(priceHistoryTable)
    .where(eq(priceHistoryTable.productId, id))
    .orderBy(priceHistoryTable.recordedAt);

  return res.json(history.map(h => ({
    date: h.recordedAt.toISOString().slice(0, 10),
    price: parseFloat(h.price),
    supplier: h.supplier,
  })));
});

router.get("/supplier-comparison", async (req, res) => {
  const { product_name } = req.query as { product_name?: string };
  if (!product_name) return res.status(400).json({ error: "product_name required" });

  const suppliers = await db.select().from(suppliersTable);
  const evals = await db.select().from(supplierEvaluationsTable);

  const result = suppliers.slice(0, 4).map((s, i) => {
    const supplierEvals = evals.filter(e => e.supplierId === s.id);
    const avgRating = supplierEvals.length
      ? supplierEvals.reduce((sum, e) => sum + (parseFloat(e.priceScore) + parseFloat(e.deliveryScore) + parseFloat(e.qualityScore)) / 3, 0) / supplierEvals.length
      : 3.5 + Math.random();

    const basePrice = 100 + i * 15 - Math.random() * 10;
    return {
      supplier: s.name,
      price: Math.round(basePrice * 100) / 100,
      deliveryDays: 3 + i * 2,
      freight: Math.round(Math.random() * 50 * 100) / 100,
      rating: Math.round(avgRating * 10) / 10,
      isRecommended: i === 1,
    };
  });

  result.sort((a, b) => a.price - b.price);
  if (result.length > 0) {
    result.forEach(r => r.isRecommended = false);
    result[0].isRecommended = true;
  }

  return res.json(result);
});

router.get("/alerts", async (req, res) => {
  const alerts = await db.select().from(priceAlertsTable).orderBy(desc(priceAlertsTable.createdAt)).limit(20);
  const products = await db.select().from(monitoredProductsTable);
  const productMap = new Map(products.map(p => [p.id, p.name]));

  return res.json(alerts.map(a => ({
    id: a.id,
    productId: a.productId,
    productName: productMap.get(a.productId) ?? "Produto",
    type: a.type,
    message: a.message,
    priceBefore: parseFloat(a.priceBefore),
    priceAfter: parseFloat(a.priceAfter),
    percentChange: parseFloat(a.percentChange),
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
