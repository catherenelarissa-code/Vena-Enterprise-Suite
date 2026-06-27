// artifacts/api-server/src/routes/price-monitor.ts
// Substitua o arquivo inteiro por este conteúdo

import { Router } from "express";
import { db } from "@workspace/db";
import {
  monitoredProductsTable,
  priceHistoryTable,
  priceAlertsTable,
  productLinksTable,
  suppliersTable,
  supplierEvaluationsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function enrichProduct(p: any) {
  const history = await db.select().from(priceHistoryTable)
    .where(eq(priceHistoryTable.productId, p.id))
    .orderBy(desc(priceHistoryTable.recordedAt));

  const links = await db.select().from(productLinksTable)
    .where(eq(productLinksTable.productId, p.id))
    .orderBy(productLinksTable.createdAt);

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

  // Comparação entre links: ordena por menor preço
  const enrichedLinks = links.map(l => ({
    id: l.id,
    supplierName: l.supplierName,
    url: l.url,
    currentPrice: l.currentPrice ? parseFloat(l.currentPrice) : null,
    isMain: l.isMain,
    createdAt: l.createdAt.toISOString(),
  }));

  const linkPrices = enrichedLinks.filter(l => l.currentPrice !== null) as any[];
  linkPrices.sort((a, b) => a.currentPrice - b.currentPrice);
  const bestLink = linkPrices[0] ?? null;

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
    links: enrichedLinks,
    bestLink,
  };
}

// GET /products
router.get("/products", async (req, res) => {
  try {
    const products = await db.select().from(monitoredProductsTable).orderBy(monitoredProductsTable.name);
    return res.json(await Promise.all(products.map(enrichProduct)));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

// POST /products
router.post("/products", async (req, res) => {
  try {
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

    // Se veio com URL, cria link principal automaticamente
    if (url) {
      await db.insert(productLinksTable).values({
        productId: product.id,
        supplierName: detectMarketplace(url),
        url,
        currentPrice: currentPrice.toString(),
        isMain: true,
      });
    }

    return res.status(201).json(await enrichProduct(product));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// PATCH /products/:id - Editar produto
router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, alertThresholdPercent, currentPrice, aiInsight } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (alertThresholdPercent !== undefined) updates.alertThresholdPercent = alertThresholdPercent.toString();
    if (currentPrice !== undefined) {
      updates.currentPrice = currentPrice.toString();
      await db.insert(priceHistoryTable).values({
        productId: id,
        price: currentPrice.toString(),
        supplier: null,
      });
    }
    if (aiInsight !== undefined) updates.aiInsight = aiInsight;

    await db.update(monitoredProductsTable).set(updates).where(eq(monitoredProductsTable.id, id));
    const [p] = await db.select().from(monitoredProductsTable).where(eq(monitoredProductsTable.id, id)).limit(1);
    return res.json(await enrichProduct(p));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productLinksTable).where(eq(productLinksTable.productId, id));
    await db.delete(priceHistoryTable).where(eq(priceHistoryTable.productId, id));
    await db.delete(priceAlertsTable).where(eq(priceAlertsTable.productId, id));
    await db.delete(monitoredProductsTable).where(eq(monitoredProductsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

// GET /products/:id/price-history
router.get("/products/:id/price-history", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const history = await db.select().from(priceHistoryTable)
      .where(eq(priceHistoryTable.productId, id))
      .orderBy(priceHistoryTable.recordedAt);
    return res.json(history.map(h => ({
      date: h.recordedAt.toISOString().slice(0, 10),
      price: parseFloat(h.price),
      supplier: h.supplier,
    })));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

// GET /products/:id/links - Listar links de um produto
router.get("/products/:id/links", async (req, res) => {
  try {
    const links = await db.select().from(productLinksTable)
      .where(eq(productLinksTable.productId, parseInt(req.params.id)))
      .orderBy(productLinksTable.createdAt);
    return res.json(links.map(l => ({
      ...l,
      currentPrice: l.currentPrice ? parseFloat(l.currentPrice) : null,
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar links" });
  }
});

// POST /products/:id/links - Adicionar link
router.post("/products/:id/links", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { supplierName, url, currentPrice, isMain } = req.body;
    if (!supplierName || !url) {
      return res.status(400).json({ error: "Nome do fornecedor e URL são obrigatórios" });
    }

    // Se isMain, remove flag dos outros
    if (isMain) {
      await db.update(productLinksTable)
        .set({ isMain: false })
        .where(eq(productLinksTable.productId, productId));
    }

    const [link] = await db.insert(productLinksTable).values({
      productId,
      supplierName: supplierName || detectMarketplace(url),
      url,
      currentPrice: currentPrice ? currentPrice.toString() : null,
      isMain: isMain ?? false,
    }).returning();

    return res.status(201).json({
      ...link,
      currentPrice: link.currentPrice ? parseFloat(link.currentPrice) : null,
      createdAt: link.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao adicionar link" });
  }
});

// PATCH /products/:id/links/:linkId - Editar link
router.patch("/products/:id/links/:linkId", async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    const productId = parseInt(req.params.id);
    const { supplierName, url, currentPrice, isMain } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (supplierName !== undefined) updates.supplierName = supplierName;
    if (url !== undefined) updates.url = url;
    if (currentPrice !== undefined) updates.currentPrice = currentPrice?.toString() ?? null;
    if (isMain !== undefined) {
      if (isMain) {
        await db.update(productLinksTable)
          .set({ isMain: false })
          .where(eq(productLinksTable.productId, productId));
      }
      updates.isMain = isMain;
    }

    await db.update(productLinksTable).set(updates).where(eq(productLinksTable.id, linkId));
    const [link] = await db.select().from(productLinksTable).where(eq(productLinksTable.id, linkId)).limit(1);
    return res.json({
      ...link,
      currentPrice: link.currentPrice ? parseFloat(link.currentPrice) : null,
      createdAt: link.createdAt.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao editar link" });
  }
});

// DELETE /products/:id/links/:linkId - Remover link
router.delete("/products/:id/links/:linkId", async (req, res) => {
  try {
    await db.delete(productLinksTable).where(eq(productLinksTable.id, parseInt(req.params.linkId)));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao remover link" });
  }
});

function detectMarketplace(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("mercadolivre")) return "Mercado Livre";
  if (u.includes("amazon")) return "Amazon";
  if (u.includes("shopee")) return "Shopee";
  if (u.includes("americanas")) return "Americanas";
  if (u.includes("magazineluiza") || u.includes("magalu")) return "Magazine Luiza";
  return "Distribuidor";
}

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
      isRecommended: false,
    };
  });
  result.sort((a, b) => a.price - b.price);
  if (result.length > 0) result[0].isRecommended = true;
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
