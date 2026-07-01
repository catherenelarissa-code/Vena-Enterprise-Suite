import { Router } from "express";
import multer from "multer";
import { db, filesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/client-files/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const clientId = req.body.clientId ? parseInt(req.body.clientId) : null;
    const proposalId = req.body.proposalId ? parseInt(req.body.proposalId) : null;

    if (!file) return res.status(400).json({ error: "Arquivo é obrigatório" });

   const [created] = await db.insert(filesTable).values({
  filename: fileName ?? `proposta-${Date.now()}.pdf`,
  contentType: "application/pdf",
  data: Buffer.from(pdfBuffer),
  clientId: clientId ?? null,
  proposalId: proposalId ?? null,
}).returning();

    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao enviar arquivo" });
  }
});

// GET /api/client-files/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [row] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!row) return res.status(404).json({ error: "Arquivo não encontrado" });

    res.setHeader("Content-Type", row.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${row.filename}"`);
    return res.send(row.data as Buffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar arquivo" });
  }
});

// GET /api/client-files/client/:clientId
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) return res.status(400).json({ error: "clientId inválido" });

    const rows = await db.select().from(filesTable).where(eq(filesTable.clientId, clientId)).orderBy(filesTable.createdAt);
    return res.json(rows.map(r => ({
      id: r.id,
      filename: r.filename,
      contentType: r.contentType,
      clientId: r.clientId,
      proposalId: r.proposalId,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar arquivos do cliente" });
  }
});

// DELETE /api/client-files/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    await db.delete(filesTable).where(eq(filesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir arquivo" });
  }
});

export default router;
