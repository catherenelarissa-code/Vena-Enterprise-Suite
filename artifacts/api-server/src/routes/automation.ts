import { Router } from "express";
import { db } from "@workspace/db";
import { messageTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

router.get("/ping", async (req, res) => {
  return res.json({ ok: true, timestamp: new Date().toISOString() });
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/automation/templates
router.get("/templates", async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(messageTemplatesTable)
      .orderBy(messageTemplatesTable.name);
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
    if (!name || !template) {
      return res.status(400).json({ error: "Nome e template são obrigatórios" });
    }
    const [created] = await db
      .insert(messageTemplatesTable)
      .values({ name, description, template, label: label || null })
      .returning();
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
    if (label !== undefined) updates.label = label || null;  // ← salva etiqueta

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

// POST /api/automation/ocr - OCR para modelos de mensagem (mantido para compatibilidade)
router.post("/ocr", async (req, res) => {
  try {
    const { imageBase64, mediaType, templateFields } = req.body;
    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: "Imagem é obrigatória" });
    }

    const fieldsHint = templateFields?.length
      ? `Tente extrair especialmente os seguintes campos: ${templateFields.join(", ")}.`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: `Analise esta imagem e extraia todas as informações relevantes como: nome do cliente, CPF/CNPJ, valor, data, endereço, potência, unidade, número do pedido, forma de pagamento, e qualquer outro dado importante. ${fieldsHint}

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

Não inclua markdown, blocos de código ou texto fora do JSON.`,
          },
        ],
      }],
    });

    const text = response.content.filter((b) => b.type === "text").map((b) => (b as any).text).join("");
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: "Não foi possível interpretar a resposta da IA" });
    }
    return res.json(parsed);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar imagem" });
  }
});

// POST /api/automation/ocr-quote - OCR específico para leitura de orçamentos em Compras
router.post("/ocr-quote", async (req, res) => {
  try {
    const { imageBase64, mediaType, itemNames } = req.body;
    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: "Imagem é obrigatória" });
    }

    const itemsHint = itemNames?.length
      ? `Os itens da solicitação de compra são: ${itemNames.join(", ")}. Tente encontrar o preço unitário de cada um deles no orçamento.`
      : "Extraia todos os itens e preços que encontrar.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: `Você está analisando um orçamento ou cotação de fornecedor. ${itemsHint}

Extraia as seguintes informações do documento:
- Nome do fornecedor/empresa
- Prazo de entrega em dias (apenas o número)
- Valor do frete em reais (apenas o número, sem R$)
- Preço unitário de cada item listado
- Observações relevantes (condições de pagamento, validade, etc)

Responda APENAS com um JSON válido neste formato exato:
{
  "supplierName": "nome do fornecedor ou null",
  "deliveryDays": "número de dias ou null",
  "freightCost": "valor numérico do frete ou null",
  "notes": "observações ou null",
  "prices": {
    "nome exato do item": "preço unitário numérico"
  }
}

Exemplos de prices: { "Cabo 10mm²": "12.50", "Disjuntor 63A": "45.00" }
Não inclua R$, unidades ou texto nos valores numéricos.
Não inclua markdown, blocos de código ou texto fora do JSON.`,
          },
        ],
      }],
    });

    const text = response.content.filter((b) => b.type === "text").map((b) => (b as any).text).join("");
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: "Não foi possível interpretar a resposta da IA" });
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar orçamento" });
  }
});

export default router;
