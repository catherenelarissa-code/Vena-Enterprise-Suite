import { Router } from "express";
import { db } from "@workspace/db";
import { messageTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Helper to parse label JSON if present
function parseLabel(label: string | null | undefined) {
  if (!label) return {};
  try {
    return JSON.parse(label);
  } catch {
    return { rawLabel: label };
  }
}

// GET /api/proposal-templates
router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(messageTemplatesTable).orderBy(messageTemplatesTable.name);
    const mapped = rows.map((r: any) => {
      const meta = parseLabel(r.label);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        html: r.template,
        colors: meta.colors ?? null,
        fonts: meta.fonts ?? null,
        logoFileId: meta.logoFileId ?? null,
        bannerFileId: meta.bannerFileId ?? null,
        imageFileIds: meta.imageFileIds ?? [],
        useGeneratedHtml: meta.useGeneratedHtml ?? false,
        isDefault: meta.isDefault ?? "false",
        createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
        updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
      };
    });
    return res.json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar templates" });
  }
});

// POST /api/proposal-templates
router.post("/", async (req, res) => {
  try {
    const { name, description, html, colors, fonts, logoFileId, bannerFileId, imageFileIds, useGeneratedHtml, isDefault } = req.body;
    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });
    if (!useGeneratedHtml && !html) return res.status(400).json({ error: "HTML é obrigatório quando não se usa gerarHTMLProposta" });

    const label = JSON.stringify({ colors: colors ?? null, fonts: fonts ?? null, logoFileId: logoFileId ?? null, bannerFileId: bannerFileId ?? null, imageFileIds: imageFileIds ?? [], useGeneratedHtml: !!useGeneratedHtml, isDefault: isDefault ?? "false" });

    const [created] = await db.insert(messageTemplatesTable).values({ name, description: description ?? null, template: useGeneratedHtml ? null : html, label }).returning();

    const meta = parseLabel((created as any).label);

    return res.status(201).json({
      id: (created as any).id,
      name: (created as any).name,
      description: (created as any).description,
      html: (created as any).template,
      colors: meta.colors ?? null,
      fonts: meta.fonts ?? null,
      logoFileId: meta.logoFileId ?? null,
      bannerFileId: meta.bannerFileId ?? null,
      imageFileIds: meta.imageFileIds ?? [],
      useGeneratedHtml: meta.useGeneratedHtml ?? false,
      isDefault: meta.isDefault ?? "false",
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar template" });
  }
});

// PATCH /api/proposal-templates/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, html, colors, fonts, logoFileId, bannerFileId, imageFileIds, useGeneratedHtml, isDefault } = req.body;

    const [existing] = await db.select().from(messageTemplatesTable).where(eq(messageTemplatesTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Template não encontrado" });

    const currentMeta = parseLabel(existing.label);
    const newMeta = {
      ...currentMeta,
      ...(colors !== undefined ? { colors } : {}),
      ...(fonts !== undefined ? { fonts } : {}),
      ...(logoFileId !== undefined ? { logoFileId } : {}),
      ...(bannerFileId !== undefined ? { bannerFileId } : {}),
      ...(imageFileIds !== undefined ? { imageFileIds } : {}),
      ...(useGeneratedHtml !== undefined ? { useGeneratedHtml } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
    };

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    // only set template if not using generated html
    if (useGeneratedHtml === true) {
      updates.template = null;
    } else if (html !== undefined) {
      updates.template = html;
    }
    updates.label = JSON.stringify(newMeta);

    await db.update(messageTemplatesTable).set(updates).where(eq(messageTemplatesTable.id, id));

    const [updated] = await db.select().from(messageTemplatesTable).where(eq(messageTemplatesTable.id, id)).limit(1);
    const meta = parseLabel(updated.label);

    return res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      html: updated.template,
      colors: meta.colors ?? null,
      fonts: meta.fonts ?? null,
      logoFileId: meta.logoFileId ?? null,
      bannerFileId: meta.bannerFileId ?? null,
      imageFileIds: meta.imageFileIds ?? [],
      useGeneratedHtml: meta.useGeneratedHtml ?? false,
      isDefault: meta.isDefault ?? "false",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar template" });
  }
});

// DELETE /api/proposal-templates/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(messageTemplatesTable).where(eq(messageTemplatesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir template" });
  }
});

export default router;
