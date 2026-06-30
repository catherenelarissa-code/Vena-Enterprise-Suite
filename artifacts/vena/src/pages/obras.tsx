import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, getListProjectsQueryKey, useCreateProject, useUpdateProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, Plus, Filter, Building2, MapPin, Calendar, Download,
  Zap, Activity, Network, Tag, User, Pencil, ChevronRight,
} from "lucide-react";

// ── Constantes ───────────────────────────────────────────────────────────────

const PROJECT_TYPES = [
  { value: "fotovoltaica", label: "Fotovoltaica", icon: "⚡" },
  { value: "subestacao", label: "Subestação", icon: "🔌" },
  { value: "rede_distribuicao", label: "Rede de Distribuição", icon: "🕸️" },
  { value: "outro", label: "Outro", icon: "🏗️" },
];

const PROJECT_TAGS = [
  { value: "materiais", label: "Materiais", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "estrutura_civil", label: "Estrutura Civil", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "servicos_terceirizados", label: "Serviços Terceirizados", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "seguranca_sinalizacao", label: "Segurança e Sinalização", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "transporte_logistica", label: "Transporte e Logística", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "taxas_licencas_art", label: "Taxas / Licenças / ART", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "custos_diversos", label: "Custos Diversos", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const PROJECT_STATUS = [
  { value: "planning", label: "Planejamento" },
  { value: "active", label: "Em andamento" },
  { value: "paused", label: "Pausada" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

// Sentinela pra "todos" — shadcn Select não aceita value=""
const ALL = "all";

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-secondary/10 text-secondary border-secondary/20";
    case "completed": return "bg-muted text-muted-foreground";
    case "paused": return "bg-accent/10 text-accent border-accent/20";
    case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-primary/10 text-primary border-primary/20";
  }
}

function getStatusLabel(status: string) {
  return PROJECT_STATUS.find(s => s.value === status)?.label ?? status;
}

function getTypeIcon(type: string) {
  return PROJECT_TYPES.find(t => t.value === type)?.icon ?? "🏗️";
}

// ── Modal Criar/Editar Obra ───────────────────────────────────────────────────

type ProjectForm = {
  name: string;
  costCenter: string;
  client: string;
  type: string;
  description: string;
  budget: string;
  startDate: string;
  endDate: string;
  location: string;
  manager: string;
  status: string;
  tags: string[];
};

function ProjectModal({
  editing,
  onClose,
  onSaved,
  clients,
}: {
  editing: any | null;
  onClose: () => void;
  onSaved: () => void;
  clients: any[];
}) {
  const queryClient = useQueryClient();
  const { mutateAsync: createProject, isPending: isCreating } = useCreateProject();
  const { mutateAsync: updateProject, isPending: isUpdating } = useUpdateProject();

  const [form, setForm] = useState<ProjectForm>({
    name: editing?.name ?? "",
    costCenter: editing?.costCenter ?? "",
    client: editing?.client ?? "",
    type: editing?.type ?? "fotovoltaica",
    description: editing?.description ?? "",
    budget: editing?.budget?.toString() ?? "",
    startDate: editing?.startDate ?? "",
    endDate: editing?.endDate ?? "",
    location: editing?.location ?? "",
    manager: editing?.manager ?? "",
    status: editing?.status ?? "planning",
    tags: editing?.tags ?? [],
  });

  const isPending = isCreating || isUpdating;

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  async function handleSubmit() {
    if (!form.costCenter || !form.client || !form.budget || !form.startDate) {
      toast.error("Centro de custo, cliente, orçamento e data início são obrigatórios.");
      return;
    }
    try {
      const payload = {
        name: form.name || form.costCenter,
        costCenter: form.costCenter,
        client: form.client,
        type: form.type,
        description: form.description,
        budget: parseFloat(form.budget.replace(",", ".")),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        location: form.location,
        manager: form.manager,
        status: form.status,
        tags: form.tags,
      };
      if (editing) {
        await updateProject({ id: editing.id, data: payload });
        toast.success("Obra atualizada!");
      } else {
        await createProject({ data: payload });
        toast.success("Obra criada!");
      }
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar obra.");
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Obra" : "Nova Obra"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">

          {/* Tipo de obra */}
          <div className="space-y-2">
            <Label>Tipo de Obra *</Label>
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`p-3 rounded-lg border text-center text-sm transition-all ${
                    form.type === t.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-xs">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Centro de custo */}
          <div className="space-y-1.5">
            <Label className="text-base font-semibold">Centro de Custo * <span className="text-xs font-normal text-muted-foreground">(nome em destaque)</span></Label>
            <Input
              placeholder="Ex: USINA FOTOVOLTAICA ANTUNES, SE GOIÁS 01..."
              value={form.costCenter}
              onChange={e => setForm(f => ({ ...f, costCenter: e.target.value }))}
              className="text-base font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome interno</Label>
              <Input
                placeholder="Ex: Obra Solar Fazenda Silva"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input
                placeholder="Nome do engenheiro"
                value={form.manager}
                onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Cliente *</Label>
            {clients.length > 0 ? (
              <Select value={form.client || ALL} onValueChange={v => setForm(f => ({ ...f, client: v === ALL ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Selecione o cliente</SelectItem>
                  {clients.filter(c => c.name).map((c: any) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Nome do cliente"
                value={form.client}
                onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Local / Município</Label>
              <Input
                placeholder="Ex: Goiânia - GO"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Orçamento (R$) *</Label>
              <Input
                placeholder="0,00"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Data Início *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Data Conclusão</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Tags de Andamento</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TAGS.map(tag => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    form.tags.includes(tag.value)
                      ? tag.color + " ring-2 ring-offset-1 ring-current"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição / Observações</Label>
            <Textarea
              placeholder="Detalhes da obra, escopo, observações..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Card de Obra ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onEdit }: { project: any; onEdit: (p: any) => void }) {
  const percentUsed = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  const isOverBudget = percentUsed > 100;
  const isWarning = percentUsed > 85 && !isOverBudget;

  function exportCSV() {
    window.open(`/api/projects/${project.id}/export-csv`, "_blank");
  }

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors flex flex-col">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getTypeIcon(project.type)}</span>
              <CardTitle className="text-lg leading-tight truncate" title={project.costCenter}>
                {project.costCenter || project.name}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> {project.client}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </Badge>
            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
              {project.typeLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 space-y-4">
        {/* Orçamento */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gasto / Orçamento</span>
            <span className={`font-medium ${isOverBudget ? "text-destructive" : isWarning ? "text-accent" : ""}`}>
              {Math.round(percentUsed)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : isWarning ? "bg-accent" : "bg-secondary"}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(project.spent)}</span>
            <span>{formatCurrency(project.budget)}</span>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {project.location}
            </div>
          )}
          {project.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(project.startDate + "T12:00:00").toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 4).map((tag: string) => {
              const tagDef = PROJECT_TAGS.find(t => t.value === tag);
              return (
                <Badge key={tag} variant="outline" className={`text-[10px] px-1.5 py-0 ${tagDef?.color ?? ""}`}>
                  {tagDef?.label ?? tag}
                </Badge>
              );
            })}
            {project.tags.length > 4 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{project.tags.length - 4}</Badge>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onEdit(project)}
          >
            <Pencil className="h-3 w-3" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={exportCSV}
            title="Exportar fechamento"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Link href={`/obras/${project.id}`}>
            <Button size="sm" className="gap-1.5 text-xs">
              Ver <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────

export function Obras() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  const { data: projects, isLoading } = useListProjects({}, { query: { queryKey: getListProjectsQueryKey() } });

  // Carrega clientes do CRM
  useState(() => {
    fetch("/api/crm/clients", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setClients)
      .catch(() => {});
  });

  const filtered = projects?.filter(p => {
    const matchSearch = !search ||
      (p.costCenter ?? p.name).toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === ALL || p.type === filterType;
    const matchStatus = filterStatus === ALL || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totals = {
    active: projects?.filter(p => p.status === "active").length ?? 0,
    budget: projects?.reduce((s, p) => s + (p.budget ?? 0), 0) ?? 0,
    spent: projects?.reduce((s, p) => s + (p.spent ?? 0), 0) ?? 0,
  };

  function handleEdit(project: any) {
    setEditingProject(project);
    setShowModal(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Obras</h2>
          <p className="text-muted-foreground">Gestão de projetos, centros de custo e fechamento.</p>
        </div>
        <Button
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Obra
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Em andamento</p>
                <p className="text-2xl font-bold">{totals.active}</p>
              </div>
              <Activity className="h-8 w-8 text-secondary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Orçamento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.budget)}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Gasto</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.spent)}</p>
              </div>
              <Zap className="h-8 w-8 text-accent opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por centro de custo ou cliente..."
            className="pl-8 bg-card"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo de obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos</SelectItem>
            {PROJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {PROJECT_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de obras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
        ) : filtered && filtered.length > 0 ? (
          filtered.map((project: any) => (
            <ProjectCard key={project.id} project={project} onEdit={handleEdit} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center border rounded-xl bg-card">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">Nenhuma obra encontrada.</p>
            <Button onClick={() => { setEditingProject(null); setShowModal(true); }} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Criar primeira obra
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProjectModal
          editing={editingProject}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
          onSaved={() => {}}
          clients={clients}
        />
      )}
    </div>
  );
}
