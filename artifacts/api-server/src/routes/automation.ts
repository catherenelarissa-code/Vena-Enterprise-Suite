import { Router } from "express";
import { db } from "@workspace/db";
import { messageTemplatesTable, prostasFVTable, filesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer";

const router = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqErrorResponse {
  error?: {
    message?: string;
  };
}

interface GroqSuccessResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

async function callGemini(prompt: string, imageBase64?: string, mediaType?: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY não configurada");

  const userContent: any[] = [];

  if (imageBase64 && mediaType) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mediaType};base64,${imageBase64}` }
    });
  }
  userContent.push({ type: "text", text: prompt });

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: userContent }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as GroqErrorResponse;
    throw new Error(err.error?.message ?? `Groq error ${res.status}`);
  }

  const data = (await res.json()) as GroqSuccessResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson(text: string): any {
  const clean = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Resposta da IA não é um JSON válido");
  }
}

router.get("/ping", async (req, res) => {
  return res.json({ ok: true, timestamp: new Date().toISOString() });
});

// GET /api/automation/templates
router.get("/templates", async (req, res) => {
  try {
    const templates = await db.select().from(messageTemplatesTable).orderBy(messageTemplatesTable.name);
    return res.json(templates);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar modelos" });
  }
});

// POST /api/automation/templates
router.post("/templates", async (req, res) => {
  try {
    const { name, description, template, label } = req.body;
    if (!name || !template) return res.status(400).json({ error: "Nome e template são obrigatórios" });
    const [created] = await db.insert(messageTemplatesTable).values({ name, description, template, label: label || null }).returning();
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar modelo" });
  }
});

// PATCH /api/automation/templates/:id
router.patch("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, template, label } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (template !== undefined) updates.template = template;
    if (label !== undefined) updates.label = label || null;
    await db.update(messageTemplatesTable).set(updates).where(eq(messageTemplatesTable.id, id));
    const [updated] = await db.select().from(messageTemplatesTable).where(eq(messageTemplatesTable.id, id));
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar modelo" });
  }
});

// DELETE /api/automation/templates/:id
router.delete("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(messageTemplatesTable).where(eq(messageTemplatesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir modelo" });
  }
});

// POST /api/automation/ocr - OCR para modelos de mensagem
router.post("/ocr", async (req, res) => {
  try {
    const { imageBase64, mediaType, templateFields } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: "Imagem é obrigatória" });

    const fieldsHint = templateFields?.length
      ? `Tente extrair especialmente os seguintes campos: ${templateFields.join(", ")}.`
      : "";

    const prompt = `Analise esta imagem e extraia todas as informações relevantes como: nome do cliente, CPF/CNPJ, valor, data, endereço, potência, unidade, número do pedido, forma de pagamento, etc.\n\n${fieldsHint}\n\nResponda APENAS com um JSON válido no formato { "campo": "valor", ... }`;

    const text = await callGemini(prompt, imageBase64, mediaType);
    return res.json(parseJson(text));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar imagem" });
  }
});

// ... other OCR endpoints unchanged ...

// POST /api/automation/render-template
router.post("/render-template", async (req, res) => {
  try {
    const { templateId, templateMetadata, proposalData, clientData } = req.body;

    let metadata: any = {};
    let htmlTemplate: string | null = null;

    if (templateId) {
      const [row] = await db.select().from(messageTemplatesTable).where(eq(messageTemplatesTable.id, templateId)).limit(1);
      if (!row) return res.status(404).json({ error: "Template não encontrado" });
      htmlTemplate = row.template ?? null;
      try { metadata = row.label ? JSON.parse(row.label) : {}; } catch { metadata = {}; }
    } else if (templateMetadata) {
      metadata = templateMetadata;
    } else {
      return res.status(400).json({ error: "templateId ou templateMetadata é obrigatório" });
    }

    const useGeneratedHtml = !!metadata.useGeneratedHtml;

    // Merge placeholders: proposalData first, clientData overrides if same keys
    const mergedPlaceholders: Record<string, any> = { ...(proposalData ?? {}), ...(clientData ?? {}) };

    if (!useGeneratedHtml && htmlTemplate) {
      let html = String(htmlTemplate);
      Object.entries(mergedPlaceholders).forEach(([key, value]) => {
        const re = new RegExp(`\\{\\{${key.toUpperCase()}\\}\\}`, "g");
        html = html.replace(re, String(value ?? ""));
      });
      return res.json({ html });
    }

    // Build HTML from metadata
    const colors = metadata.colors ?? { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" };
    const fonts = metadata.fonts ?? { body: "Arial, sans-serif", heading: "Arial Black, sans-serif" };
    const logoUrl = metadata.logoFileId ? `/api/client-files/${metadata.logoFileId}` : null;
    const bannerUrl = metadata.bannerFileId ? `/api/client-files/${metadata.bannerFileId}` : null;
    const images = (metadata.imageFileIds ?? []) as number[];

    const imagesHtml = images.map((id) => `<img src="/api/client-files/${id}" style="max-width:140px;margin-right:8px;border-radius:4px" />`).join("");

    const placeholdersHtml = (obj: any) => {
      if (!obj) return "";
      return Object.entries(obj).map(([k, v]) => `<div><strong>${k}</strong>: ${v ?? ""}</div>`).join("");
    };

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Proposta</title><style>body{font-family:${fonts.body};background:${colors.secondary};color:${colors.primary};padding:24px}h1{font-family:${fonts.heading};color:${colors.primary}}.accent{color:${colors.accent}}</style></head><body>${bannerUrl?`<img src="${bannerUrl}" style="width:100%;height:auto;margin-bottom:16px" />`:''}<div style="display:flex;align-items:center;gap:16px">${logoUrl?`<img src="${logoUrl}" style="height:64px;width:auto" />`:''}<div><h1>${metadata.title ?? 'Proposta'}</h1><div style="color:#666">${metadata.subtitle ?? ''}</div></div></div><hr/><section><h2>Dados do Cliente</h2>${placeholdersHtml(clientData)}</section><section><h2>Dados da Proposta</h2>${placeholdersHtml(proposalData)}</section><section style="margin-top:16px"><h3>Imagens</h3><div style="display:flex;flex-wrap:wrap">${imagesHtml}</div></section></body></html>`;

    return res.json({ html });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao renderizar template" });
  }
});

// POST /api/automation/generate-pdf and /api/automation/pdf
async function handleGeneratePdf(req: any, res: any) {
  try {
    const { html, clientId, proposalId, fileName } = req.body;
    if (!html) return res.status(400).json({ error: "HTML é obrigatório" });

    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

      // Save in DB
      const [created] = await db.insert(filesTable).values({
        filename: fileName ?? `proposta-${Date.now()}.pdf`,
        contentType: "application/pdf",
        data: pdfBuffer,
        clientId: clientId ?? null,
        proposalId: proposalId ?? null,
      } as any).returning();

      const fileId = (created as any).id;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${(created as any).filename}"`);
      res.setHeader("X-File-Id", String(fileId));
      return res.send(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao gerar PDF" });
  }
}

router.post("/generate-pdf", handleGeneratePdf);
router.post("/pdf", handleGeneratePdf);

// ── GET /api/automation/propostas ─────────────────────────────────────────────
router.get("/propostas", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(prostasFVTable)
      .orderBy(prostasFVTable.createdAt);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar propostas" });
  }
});

// ── POST /api/automation/propostas ────────────────────────────────────────────
router.post("/propostas", async (req, res) => {
  try {
    const {
      nomeCliente, cpfCnpj, cidade, estado, data,
      kwp, areaM2, kwhMes, quantidadePaineis, moduloW,
      baseInstalacao, inversor, valorAVista, valorExtenso,
      pagamento, status,
    } = req.body;

    if (!nomeCliente) {
      return res.status(400).json({ error: "Nome do cliente é obrigatório" });
    }

    const [created] = await db
      .insert(prostasFVTable)
      .values({
        nomeCliente, cpfCnpj, cidade, estado, data,
        kwp, areaM2, kwhMes, quantidadePaineis, moduloW,
        baseInstalacao, inversor, valorAVista, valorExtenso,
        pagamento: pagamento ?? [],
        status: status ?? "rascunho",
      })
      .returning();

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar proposta" });
  }
});

// ── PATCH /api/automation/propostas/:id ───────────────────────���───────────────
router.patch("/propostas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: any = { updatedAt: new Date(), ...req.body };
    await db
      .update(prostasFVTable)
      .set(updates)
      .where(eq(prostasFVTable.id, id));
    const [updated] = await db
      .select()
      .from(prostasFVTable)
      .where(eq(prostasFVTable.id, id));
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar proposta" });
  }
});

// ── DELETE /api/automation/propostas/:id ──────────────────────────────────────
router.delete("/propostas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(prostasFVTable).where(eq(prostasFVTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir proposta" });
  }
});
export default router;
