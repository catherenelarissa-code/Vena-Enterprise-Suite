import { Router } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/client-files/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const clientId = req.body.clientId ? parseInt(req.body.clientId) : null;
    const proposalId = req.body.proposalId ? parseInt(req.body.proposalId) : null;

    if (!file) return res.status(400).json({ error: "Arquivo é obrigatório" });

    // TODO: Integrar com a tabela `files` após criar migration.
    // Por enquanto apenas retorna metadados.
    // Quando a tabela existir, inserir SQL para gravar `file.buffer` em bytea.

    // Example return structure compatible with frontend expectations
    return res.status(201).json({
      filename: file.originalname,
      contentType: file.mimetype,
      size: file.size,
      clientId,
      proposalId,
      // id: createdId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao enviar arquivo" });
  }
});

// GET /api/client-files/:id
router.get(":id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // TODO: Buscar arquivo na tabela `files` e fazer stream
    // Exemplo de resposta enquanto migration não existir:
    return res.status(501).json({ error: "Not Implemented - retrieve file by id (pending migration)" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar arquivo" });
  }
});

// GET /api/client-files/client/:clientId
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    // TODO: listar arquivos associados ao clientId na tabela `files`
    return res.status(501).json({ error: "Not Implemented - list files for client (pending migration)" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar arquivos do cliente" });
  }
});

// DELETE /api/client-files/:id
router.delete(":id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // TODO: deletar arquivo da tabela `files`
    return res.status(501).json({ error: "Not Implemented - delete file by id (pending migration)" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir arquivo" });
  }
});

export default router;
