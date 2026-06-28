import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "vena_salt").digest("hex");
}

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    const user = users[0];
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ error: "Conta pendente de aprovação" });
    }
    (req.session as any).userId = user.id;
    // FIX: aguarda o save antes de responder
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => err ? reject(err) : resolve());
    });
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      token: "session",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Erro interno no login" });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

// GET /auth/me
router.get("/me", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado" });
  }
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    position: user.position,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  });
});

// POST /auth/request-access — agora aceita senha opcional
router.post("/request-access", async (req, res) => {
  try {
    const { name, email, department, position, password } = req.body as {
      name: string; email: string; department: string; position: string; password?: string;
    };
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing[0]) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }
    await db.insert(usersTable).values({
      name,
      email: email.toLowerCase(),
      role: "engineer",
      department,
      position,
      status: "pending",
      // Se veio com senha, já salva o hash
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    });
    return res.status(201).json({ ok: true, message: "Solicitação enviada com sucesso" });
  } catch (err) {
    console.error("Request access error:", err);
    return res.status(500).json({ error: "Erro ao enviar solicitação" });
  }
});

// POST /auth/set-password — usando email como token
router.post("/set-password", async (req, res) => {
  try {
    const { token: email, password } = req.body as { token: string; password: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    await db.update(usersTable)
      .set({ passwordHash: hashPassword(password), status: "active" })
      .where(eq(usersTable.id, user.id));
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao definir senha" });
  }
});

// POST /auth/forgot-password — envia email ou retorna link de set-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    if (!email) return res.status(400).json({ error: "Email é obrigatório" });
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    // Retorna ok mesmo se não encontrar (segurança)
    if (!users[0]) return res.json({ ok: true });
    // Por enquanto retorna o link direto (sem email)
    // Futuramente integrar com serviço de email
    const resetLink = `${process.env.FRONTEND_URL ?? ""}/set-password?token=${encodeURIComponent(email.toLowerCase())}`;
    return res.json({ ok: true, resetLink });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

// GET /auth/users
router.get("/users", async (req, res) => {
  const users = await db.select().from(usersTable);
  return res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    position: u.position,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  })));
});

// POST /auth/users/:id/approve
router.post("/users/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, id));
  return res.json({ ok: true });
});

export default router;
