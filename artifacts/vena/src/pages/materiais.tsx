import { useEffect, useState } from "react";
import {
  useListMaterials,
  getListMaterialsQueryKey,
  useCreateMaterial,
  useUpdateMaterial,
  useListProjects,
} from "@workspace/api-client-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, Plus, Filter, AlertCircle, Package,
  Pencil, ArrowDown, ArrowUp, History, X,
  Clock, ShoppingCart, Zap,
} from "lucide-react";

// ── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Aterramento","Cabos","Caixas","Condutores","Conectores",
  "Disjuntores","Eletrodutos","EPI","Estruturas","Ferramentas",
  "Fixação","Fotovoltaico","Isoladores","Outros","Proteção","Transformadores",
];
const UNITS = ["un","m","mt","kg","cx","rl","par","um"];

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  projectId?: number | null;
  lastPurchasePrice?: number | null;
};

type Movement = {
  id: number;
  type: "entrada" | "saida";
  quantity: number;
  reason?: string;
  projectName?: string;
  createdAt: string;
};

type ForecastItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  consumoMedioDiario: number;
  diasRestantes: number | null;
  critico: boolean;
  lastPurchasePrice: number | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Monta a URL completa do backend (Railway), já que chamadas com caminho
// relativo (ex: fetch("/api/...")) caem no domínio do Vercel, que não tem
// proxy configurado para /api e não chegam ao backend.
function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}

async function postMovement(materialId: number, payload: object) {
  const res = await fetch(apiUrl(`/api/materials/${materialId}/movements`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? "Erro ao registrar movimentação");
  }
  return res.json();
}

async function fetchMovements(materialId: number): Promise<Movement[]> {
  const res = await fetch(apiUrl(`/api/materials/${materialId}/movements`), { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
}

// ── Modal: Novo / Editar Material ────────────────────────────────────────────

function MaterialFormModal({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Material | null;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync: createMaterial, isPending: isCreating } = useCreateMaterial();
  const { mutateAsync: updateMaterial, isPending: isUpdating } = useUpdateMaterial();

  const [form, setForm] = useState({
    name: editing?.name ?? "",
    category: editing?.category ?? "",
    unit: editing?.unit ?? "un",
    currentStock: editing?.currentStock ?? 0,
    minimumStock: editing?.minimumStock ?? 0,
    lastPurchasePrice: editing?.lastPurchasePrice ?? "",
  });

  const isPending = isCreating || isUpdating;

  async function handleSubmit() {
    if (!form.name || !form.category) {
      toast.error("Nome e categoria são obrigatórios.");
      return;
    }
    try {
      if (editing) {
        await updateMaterial({
          id: editing.id,
          data: {
            name: form.name,
            category: form.category,
            unit: form.unit,
            minimumStock: Number(form.minimumStock),
            lastPurchasePrice: form.lastPurchasePrice ? Number(form.lastPurchasePrice) : undefined,
          },
        });
        toast.success("Material atualizado!");
      } else {
        await createMaterial({
          data: {
            name: form.name,
            category: form.category,
            unit: form.unit,
            currentStock: Number(form.currentStock),
            minimumStock: Number(form.minimumStock),
            lastPurchasePrice: form.lastPurchasePrice ? Number(form.lastPurchasePrice) : undefined,
          },
        });
        toast.success("Material cadastrado!");
      }
      queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
      onClose();
    } catch {
      toast.error("Erro ao salvar material.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Material" : "Novo Material"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              placeholder="Ex: Cabo PFXB 6mm²"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Unidade</Label>
            <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {!editing && (
              <div className="space-y-1.5">
                <Label>Estoque Atual</Label>
                <Input
                  type="number" min={0}
                  value={form.currentStock}
                  onChange={(e) => setForm((f) => ({ ...f, currentStock: Number(e.target.value) }))}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Estoque Mínimo</Label>
              <Input
                type="number" min={0}
                value={form.minimumStock}
                onChange={(e) => setForm((f) => ({ ...f, minimumStock: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Último Preço (R$)</Label>
              <Input
                type="number" min={0} step="0.01"
                placeholder="0,00"
                value={form.lastPurchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, lastPurchasePrice: e.target.value }))}
              />
            </div>
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

// ── Modal: Movimentação ──────────────────────────────────────────────────────

function MovementModal({
  material, initialType, onClose,
}: {
  material: Material;
  initialType: "entrada" | "saida";
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: projects } = useListProjects();

  const [type, setType] = useState<"entrada" | "saida">(initialType);
  const [qty, setQty] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);

  const qtyNum = parseFloat(qty) || 0;
  const stockInsufficient = type === "saida" && qtyNum > material.currentStock;

  async function handleConfirm() {
    if (qtyNum <= 0) { toast.error("Informe uma quantidade válida."); return; }
    if (stockInsufficient) { toast.error("Quantidade maior que o estoque disponível!"); return; }

    setIsPending(true);
    try {
      await postMovement(material.id, {
        type,
        quantity: qtyNum,
        projectId: projectId ? parseInt(projectId) : undefined,
        reason: reason || undefined,
      });
      queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
      toast.success(type === "entrada" ? "Entrada registrada!" : "Saída registrada!");
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao registrar movimentação.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar Estoque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <span className="font-medium">{material.name}</span>
            <span className="text-muted-foreground ml-2">
              Estoque atual: <strong>{material.currentStock} {material.unit}</strong>
            </span>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={type === "entrada" ? "default" : "outline"}
                onClick={() => setType("entrada")}
                className="gap-2"
              >
                <ArrowDown className="h-4 w-4" /> Entrada
              </Button>
              <Button
                variant={type === "saida" ? "default" : "outline"}
                onClick={() => setType("saida")}
                className="gap-2"
              >
                <ArrowUp className="h-4 w-4" /> Saída
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Quantidade *</Label>
            <Input
              type="number" min={0} step="0.001"
              placeholder={`em ${material.unit}`}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            {stockInsufficient && (
              <p className="text-xs text-destructive">Estoque insuficiente!</p>
            )}
          </div>

          {projects && projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>Obra vinculada</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Motivo / Observação</Label>
            <Textarea
              placeholder={type === "entrada" ? "Ex: Compra NF 1234, reposição de estoque..." : "Ex: Uso na Obra Silva, instalação..."}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isPending || stockInsufficient}>
            {isPending ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal: Histórico ─────────────────────────────────────────────────────────

function HistoryModal({ material, onClose }: { material: Material; onClose: () => void }) {
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements(material.id)
      .then(setMovements)
      .catch(() => toast.error("Erro ao carregar histórico."))
      .finally(() => setLoading(false));
  }, [material.id]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico — {material.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto space-y-2 py-2">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : movements && movements.length > 0 ? (
            movements.map((m) => (
              <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border text-sm">
                <div className={`mt-0.5 p-1.5 rounded-full ${m.type === "entrada" ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"}`}>
                  {m.type === "entrada" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium ${m.type === "entrada" ? "text-secondary" : "text-destructive"}`}>
                      {m.type === "entrada" ? "+" : "-"}{m.quantity} {material.unit}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {m.reason && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.reason}</p>}
                  {m.projectName && <p className="text-xs text-primary mt-0.5">Obra: {m.projectName}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma movimentação registrada.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Aba: Reposição Automática ────────────────────────────────────────────────

function ReposicaoAutomatica() {
  const [itens, setItens] = useState<ForecastItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<number | null>(null);

  useEffect(() => {
    carregarPrevisao();
  }, []);

  async function carregarPrevisao() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/materials/forecast"), { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar previsão");
      const data = await res.json();
      setItens(data);
    } catch (err) {
      setError("Não foi possível carregar a previsão de reposição.");
    } finally {
      setLoading(false);
    }
  }

  async function gerarSolicitacaoCompra(item: ForecastItem) {
    setEnviando(item.id);
    try {
      const quantidadeSugerida = Math.max(
        item.minimumStock - item.currentStock,
        Math.ceil(item.minimumStock * 0.5),
      );

      const res = await fetch(apiUrl("/api/purchase-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Reposição automática: ${item.name}`,
          requestedBy: "Sistema (reposição automática)",
          urgency: item.critico ? "urgent" : "normal",
          notes: `Gerado automaticamente. Estoque atual: ${item.currentStock} ${item.unit}, mínimo: ${item.minimumStock} ${item.unit}, previsão de ${item.diasRestantes} dias até esgotar.`,
          items: [
            {
              materialName: item.name,
              quantity: quantidadeSugerida,
              unit: item.unit,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar solicitação");

      toast.success(`Solicitação de compra criada: ${quantidadeSugerida} ${item.unit} de ${item.name}`);
    } catch (err) {
      toast.error("Não foi possível criar a solicitação de compra.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-accent" /> Estoque mínimo inteligente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cálculo dinâmico com base no consumo médio real dos últimos 90 dias (movimentações de saída registradas). Materiais sem histórico suficiente não aparecem aqui.
          </p>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="size-4" /> {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : itens && itens.length > 0 ? (
          itens.map((item) => {
            const pct = Math.min((item.currentStock / item.minimumStock) * 100, 100);
            return (
              <Card key={item.id} className={item.critico ? "border-destructive/40" : ""}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> Com base no consumo médio, o estoque acaba em {item.diasRestantes} dias.
                    </p>
                  </div>
                  <Badge className={item.critico ? "bg-destructive text-white" : "bg-amber-500 text-white"}>
                    {item.diasRestantes} dias
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Estoque atual: {item.currentStock} {item.unit}</span>
                      <span>Mínimo: {item.minimumStock} {item.unit}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Rascunho de solicitação de compra</p>
                    <p>Consumo médio: {item.consumoMedioDiario} {item.unit}/dia</p>
                    {item.lastPurchasePrice && (
                      <p>Último preço pago: {formatCurrency(item.lastPurchasePrice)} / {item.unit}</p>
                    )}
                  </div>

                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={enviando === item.id}
                    onClick={() => gerarSolicitacaoCompra(item)}
                  >
                    <ShoppingCart className="size-4" />
                    {enviando === item.id ? "Enviando..." : "Aprovar auto-compra (1 clique)"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Nenhum material com histórico de consumo suficiente para gerar previsão ainda.
              Registre algumas saídas de estoque para habilitar esta análise.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Aba: Lista de Materiais (conteúdo original) ──────────────────────────────

function ListaMateriais() {
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [modalForm, setModalForm] = useState<{ open: boolean; editing: Material | null }>({ open: false, editing: null });
  const [modalMove, setModalMove] = useState<{ material: Material; type: "entrada" | "saida" } | null>(null);
  const [modalHistory, setModalHistory] = useState<Material | null>(null);

  const { data: materials, isLoading } = useListMaterials({}, { query: { queryKey: getListMaterialsQueryKey() } });

  const filtered = materials
    ?.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    )
    .filter((m) => !filterLow || m.currentStock <= m.minimumStock);

  const lowStockCount = materials?.filter((m) => m.currentStock <= m.minimumStock).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Alerta estoque baixo */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{lowStockCount} material{lowStockCount > 1 ? "is" : ""}</strong> com estoque abaixo do mínimo.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-destructive hover:text-destructive"
            onClick={() => setFilterLow((v) => !v)}
          >
            {filterLow ? <><X className="mr-1 h-3 w-3" />Mostrar todos</> : "Ver somente"}
          </Button>
        </div>
      )}

      {/* Busca */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou categoria..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={filterLow ? "default" : "outline"}
          size="icon"
          className="shrink-0"
          onClick={() => setFilterLow((v) => !v)}
          title="Filtrar estoque baixo"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b bg-muted/50 text-sm text-muted-foreground">
              <div className="col-span-4">Material / Categoria</div>
              <div className="col-span-2 text-right">Estoque Atual</div>
              <div className="col-span-1 text-right">Mínimo</div>
              <div className="col-span-2 text-right">Último Preço</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-center">Ações</div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 p-4 items-center">
                    <div className="col-span-12"><Skeleton className="h-6 w-full" /></div>
                  </div>
                ))
              ) : filtered && filtered.length > 0 ? (
                filtered.map((item) => {
                  const isLow = item.currentStock <= item.minimumStock;
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                      <div className="col-span-4">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">{item.category}</div>
                      </div>
                      <div className={`col-span-2 text-right font-medium ${isLow ? "text-destructive" : ""}`}>
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="col-span-1 text-right text-muted-foreground">
                        {item.minimumStock} {item.unit}
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {item.lastPurchasePrice ? formatCurrency(item.lastPurchasePrice) : "-"}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {isLow ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-xs">
                            <AlertCircle className="h-3 w-3" /> Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 text-xs">
                            Normal
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" title="Entrada"
                          onClick={() => setModalMove({ material: item as Material, type: "entrada" })}
                        >
                          <ArrowDown className="h-3.5 w-3.5 text-secondary" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" title="Saída"
                          onClick={() => setModalMove({ material: item as Material, type: "saida" })}
                        >
                          <ArrowUp className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" title="Histórico"
                          onClick={() => setModalHistory(item as Material)}
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" title="Editar"
                          onClick={() => setModalForm({ open: true, editing: item as Material })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum material encontrado.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      {modalForm.open && (
        <MaterialFormModal
          open
          editing={modalForm.editing}
          onClose={() => setModalForm({ open: false, editing: null })}
        />
      )}
      {modalMove && (
        <MovementModal
          material={modalMove.material}
          initialType={modalMove.type}
          onClose={() => setModalMove(null)}
        />
      )}
      {modalHistory && (
        <HistoryModal
          material={modalHistory}
          onClose={() => setModalHistory(null)}
        />
      )}
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────

export function Materiais() {
  const [modalForm, setModalForm] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Materiais e Estoque</h2>
          <p className="text-muted-foreground">Controle de insumos e alertas de reposição.</p>
        </div>
        <Button
          onClick={() => setModalForm(true)}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Material
        </Button>
      </div>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista de Materiais</TabsTrigger>
          <TabsTrigger value="reposicao">Reposição Automática</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-4">
          <ListaMateriais />
        </TabsContent>
        <TabsContent value="reposicao" className="mt-4">
          <ReposicaoAutomatica />
        </TabsContent>
      </Tabs>

      {modalForm && (
        <MaterialFormModal
          open
          editing={null}
          onClose={() => setModalForm(false)}
        />
      )}
    </div>
  );
}
