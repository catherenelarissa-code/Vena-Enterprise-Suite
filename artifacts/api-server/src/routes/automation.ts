import { Router } from "express";
import { db } from "@workspace/db";
import { messageTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

router.get("/ping", (req, res) => {
  res.json({
    ok: true,
    route: "automation"
  });
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/automation/templates - Listar modelos
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

// POST /api/automation/templates - Criar modelo
router.post("/templates", async (req, res) => {
  try {
    const { name, description, template } = req.body;
    if (!name || !template) {
      return res.status(400).json({ error: "Nome e template são obrigatórios" });
    }
    const [created] = await db
      .insert(messageTemplatesTable)
      .values({ name, description, template })
      .returning();
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar modelo" });
  }
});

// PATCH /api/automation/templates/:id - Atualizar modelo
router.patch("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, template } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (template !== undefined) updates.template = template;

    await db.update(messageTemplatesTable).set(updates).where(eq(messageTemplatesTable.id, id));
    const [updated] = await db.select().from(messageTemplatesTable).where(eq(messageTemplatesTable.id, id));
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar modelo" });
  }
});

// DELETE /api/automation/templates/:id - Excluir modelo
router.delete("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(messageTemplatesTable).where(eq(messageTemplatesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir modelo" });
  }
});

// POST /api/automation/ocr - Ler imagem e extrair dados com Claude Vision
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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
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
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("");

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      // Tenta extrair JSON mesmo com texto extra
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return res.status(500).json({ error: "Não foi possível interpretar a resposta da IA" });
      }
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "Erro ao processar imagem" });
  }
});

export default router;
