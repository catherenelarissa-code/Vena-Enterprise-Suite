import { Router } from "express";
import { db } from "@workspace/db";
import { messageTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
  }

  const data = await res.json();
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

    const prompt = `Analise esta imagem e extraia todas as informações relevantes como: nome do cliente, CPF/CNPJ, valor, data, endereço, potência, unidade, número do pedido, forma de pagamento. ${fieldsHint}

Responda APENAS com um JSON válido no formato:
{
  "campos": {
    "NOME_CLIENTE": "valor ou null",
    "CPF_CNPJ": "valor ou null",
    "VALOR": "valor ou null",
    "DATA": "valor ou null",
    "ENDERECO": "valor ou null",
    "POTENCIA": "valor ou null",
    "UNIDADE": "valor ou null",
    "NUMERO_PEDIDO": "valor ou null",
    "PAGAMENTO": "valor ou null",
    "OUTROS": {}
  },
  "resumo": "breve descrição do documento"
}
Não inclua markdown ou texto fora do JSON.`;

    const text = await callGemini(prompt, imageBase64, mediaType);
    return res.json(parseJson(text));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar imagem" });
  }
});

// POST /api/automation/ocr-quote - OCR para cotações
router.post("/ocr-quote", async (req, res) => {
  try {
    const { imageBase64, mediaType, itemNames } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: "Imagem é obrigatória" });

    const itemsHint = itemNames?.length
      ? `Os itens da solicitação são: ${itemNames.join(", ")}. Tente encontrar o preço unitário de cada um.`
      : "Extraia todos os itens e preços que encontrar.";

    const prompt = `Você está analisando um orçamento ou cotação de fornecedor. ${itemsHint}

Extraia: nome do fornecedor, prazo de entrega em dias, valor do frete, preço unitário de cada item, observações.

Responda APENAS com JSON:
{
  "supplierName": "nome ou null",
  "deliveryDays": "número ou null",
  "freightCost": "valor numérico ou null",
  "notes": "observações ou null",
  "prices": { "nome do item": "preço unitário numérico" }
}
Não inclua R$, unidades ou texto nos valores numéricos. Não inclua markdown.`;

    const text = await callGemini(prompt, imageBase64, mediaType);
    return res.json(parseJson(text));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar orçamento" });
  }
});

// POST /api/automation/ocr-materials - OCR para lista de materiais
router.post("/ocr-materials", async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: "Imagem é obrigatória" });

    const prompt = `Você está analisando um documento com itens de compra (lista de materiais, orçamento, nota fiscal).

Extraia TODOS os itens com suas quantidades e unidades. Use apenas estas unidades: un, m, m², kg, cx, rolo, pç, lt. Se não souber a unidade use "un". Se não souber a quantidade use "1".

Responda APENAS com JSON:
{
  "items": [
    { "materialName": "nome do material", "quantity": "número", "unit": "unidade", "notes": "" }
  ]
}
Não inclua markdown. Se não encontrar itens retorne { "items": [] }.`;

    const text = await callGemini(prompt, imageBase64, mediaType);
    return res.json(parseJson(text));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar materiais" });
  }
});
import { prostasFVTable } from "@workspace/db";

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

// ── PATCH /api/automation/propostas/:id ───────────────────────────────────────
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
