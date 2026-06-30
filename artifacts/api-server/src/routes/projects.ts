import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, financialAccountsTable, purchaseOrdersTable, quotesTable, quoteItemsTable, suppliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const TAG_LABELS: Record<string, string> = {
  materiais: "Materiais",
  estrutura_civil: "Estrutura Civil",
  servicos_terceirizados: "Serviços Terceirizados",
  seguranca_sinalizacao: "Segurança e Sinalização",
  transporte_logistica: "Transporte e Logística",
  taxas_licencas_art: "Taxas / Licenças / ART",
  custos_diversos: "Custos Diversos (Excedente)",
};

const TYPE_LABELS: Record<string, string> = {
  fotovoltaica: "Fotovoltaica",
  subestacao: "Subestação",
  rede_distribuicao: "Rede de Distribuição",
  outro: "Outro",
};

function formatProject(p: any, spent = 0) {
  return {
    id: p.id,
    name: p.name,
    costCenter: p.costCenter ?? p.name,
    client: p.client,
    clientId: p.clientId,
    type: p.type ?? "fotovoltaica",
    typeLabel: TYPE_LABELS[p.type ?? "fotovoltaica"] ?? p.type,
    description: p.description,
    status: p.status,
    budget: parseFloat(p.budget),
    spent,
    startDate: p.startDate,
    endDate: p.endDate,
    location: p.location,
    manager: p.manager,
    tags: p.tags ? JSON.parse(p.tags) : [],
    createdAt: p.createdAt.toISOString(),
  };
}

// GET /
router.get("/", async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    let projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
    if (status) projects = projects.filter(p => p.status === status);
    const accounts = await db.select().from(financialAccountsTable);
    return res.json(projects.map(p => {
      const spent = accounts.filter(a => a.projectId === p.id && a.type === "payable").reduce((s, a) => s + parseFloat(a.amount), 0);
      return formatProject(p, spent);
    }));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar obras" });
  }
});

// POST /
router.post("/", async (req, res) => {
  try {
    const { name, costCenter, client, clientId, type, description, budget, startDate, endDate, location, manager, tags } = req.body;
    const [project] = await db.insert(projectsTable).values({
      name,
      costCenter: costCenter || name,
      client,
      clientId: clientId ?? null,
      type: type ?? "fotovoltaica",
      description,
      budget: budget.toString(),
      startDate,
      endDate,
      location,
      manager,
      tags: tags ? JSON.stringify(tags) : null,
    }).returning();
    return res.status(201).json(formatProject(project));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar obra" });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  try {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parseInt(req.params.id))).limit(1);
    if (!project) return res.status(404).json({ error: "Obra não encontrada" });
    const accounts = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.projectId, project.id));
    const spent = accounts.filter(a => a.type === "payable").reduce((s, a) => s + parseFloat(a.amount), 0);
    return res.json(formatProject(project, spent));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar obra" });
  }
});

// PATCH /:id
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: any = {};
    const fields = ["name", "costCenter", "client", "clientId", "type", "description", "status", "endDate", "location", "manager"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
    if (req.body.budget !== undefined) updates.budget = req.body.budget.toString();
    if (req.body.tags !== undefined) updates.tags = JSON.stringify(req.body.tags);
    await db.update(projectsTable).set(updates).where(eq(projectsTable.id, id));
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
    return res.json(formatProject(project));
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar obra" });
  }
});

// DELETE /:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir obra" });
  }
});

// GET /:id/export-csv — Fechamento da obra em CSV (formato planilha)
router.get("/:id/export-csv", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
    if (!project) return res.status(404).json({ error: "Obra não encontrada" });

    // Busca pedidos de compra vinculados à obra
    const orders = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.projectId, id));
    const accounts = await db.select().from(financialAccountsTable).where(eq(financialAccountsTable.projectId, id));
    const suppliers = await db.select().from(suppliersTable);
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    // Cabeçalho da planilha
    const rows: string[][] = [
      [`PLANILHA CUSTOS DE OBRA - ${project.costCenter ?? project.name}`],
      [`Cliente: ${project.client}`, `Tipo: ${TYPE_LABELS[project.type ?? "fotovoltaica"] ?? ""}`, `Local: ${project.location ?? ""}`],
      [`Orçamento: ${parseFloat(project.budget).toFixed(2)}`, `Início: ${project.startDate}`, `Responsável: ${project.manager ?? ""}`],
      [],
      ["Item", "Data", "Categoria", "Material/Serviço", "UN", "Quantidade", "Preço Cotado", "Preço Realizado", "Fornecedor", "NF/Documento", "Forma Pagamento", "Situação", "Observações"],
    ];

    // Adiciona contas financeiras
    const tagOrder = ["materiais", "estrutura_civil", "servicos_terceirizados", "seguranca_sinalizacao", "transporte_logistica", "taxas_licencas_art", "custos_diversos"];
    let itemNum = 1;

    for (const tag of tagOrder) {
      const tagAccounts = accounts.filter(a => a.category?.toLowerCase().includes(TAG_LABELS[tag]?.toLowerCase().split(" ")[0].toLowerCase() ?? tag));
      if (tagAccounts.length > 0) {
        rows.push([``, ``, TAG_LABELS[tag].toUpperCase(), ``, ``, ``, ``, ``, ``, ``, ``, ``, ``]);
        for (const acc of tagAccounts) {
          rows.push([
            `${itemNum++}`,
            acc.createdAt.toLocaleDateString("pt-BR"),
            TAG_LABELS[tag],
            acc.description,
            "UN",
            "1",
            acc.amount,
            acc.status === "paid" ? acc.amount : "0",
            supplierMap.get(acc.supplierId ?? 0) ?? "",
            "",
            "",
            acc.status === "paid" ? "LANÇADO" : "NÃO LANÇADO",
            acc.notes ?? "",
          ]);
        }
      }
    }

    // Resumo final
    const totalBudget = parseFloat(project.budget);
    const totalSpent = accounts.filter(a => a.type === "payable" && a.status === "paid").reduce((s, a) => s + parseFloat(a.amount), 0);
    rows.push([]);
    rows.push(["RESUMO FINANCEIRO"]);
    rows.push(["Orçamento Total", totalBudget.toFixed(2)]);
    rows.push(["Total Realizado", totalSpent.toFixed(2)]);
    rows.push(["Saldo", (totalBudget - totalSpent).toFixed(2)]);
    rows.push(["% Executado", `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`]);

    const csv = rows
      .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const filename = `fechamento_${(project.costCenter ?? project.name).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv;charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send("\uFEFF" + csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao exportar fechamento" });
  }
});

export default router;
