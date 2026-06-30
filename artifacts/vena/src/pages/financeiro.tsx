import { useState, useRef, useEffect } from "react";
import {
  useListFinancialAccounts, getListFinancialAccountsQueryKey,
  useCreateFinancialAccount, useUpdateFinancialAccount,
  useListSuppliers,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  Plus, ArrowDownRight, ArrowUpRight, Wallet, CheckCircle,
  Trash2, Pencil, Download, Paperclip, Tag, User, X, TrendingDown, BarChart3,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL ?? "";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Compra de materiais","Mão de obra","Equipamentos",
  "Despesas administrativas","Combustível","EPI e segurança","Outros"
];
const DEFAULT_INCOME_CATEGORIES = ["Receita de obra","Adiantamento de cliente","Serviços prestados","Outros"];

function getStatusColor(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'pending': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'overdue': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-white/5 text-white/40 border-white/10';
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', cancelled: 'Cancelado' };
  return map[status] || status;
}

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API}/api/financial${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? "Erro");
  }
  return res.status === 204 ? null : res.json();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Account = {
  id: number; type: string; description: string; amount: number;
  dueDate: string; status: string; category?: string;
  supplierId?: number; supplierName?: string;
  clientName?: string; attachmentUrl?: string; notes?: string;
  projectId?: number; projectName?: string; paidAt?: string;
};

type Client = { id: number; name: string; };

// ── Modal Nova/Editar Conta ───────────────────────────────
function AccountModal({ editing, defaultType, onClose, onSaved, suppliers, categories, onAddCategory }: {
  editing: Account | null;
  defaultType: "payable" | "receivable";
  onClose: () => void;
  onSaved: () => void;
  suppliers: any[];
  categories: { expense: string[]; income: string[] };
  onAddCategory: (name: string, type: string) => void;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync: createAccount, isPending: isCreating } = useCreateFinancialAccount();
  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdateFinancialAccount();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState({
    type: editing?.type ?? defaultType,
    description: editing?.description ?? "",
    amount: editing?.amount?.toString() ?? "",
    dueDate: editing?.dueDate ?? "",
    category: editing?.category ?? "",
    supplierId: editing?.supplierId?.toString() ?? "",
    clientName: editing?.clientName ?? "",
    attachmentUrl: editing?.attachmentUrl ?? "",
    notes: editing?.notes ?? "",
  });
  const [newCategory, setNewCategory] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/crm/clients`, { credentials: "include" })
      .then(r => r.json()).then(setClients).catch(() => {});
  }, []);

  const isPending = isCreating || isUpdating;
  const cats = form.type === "receivable" ? categories.income : categories.expense;

  async function handleFile(file: File) {
    setUploadingFile(true);
    try {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, attachmentUrl: base64 }));
      toast.success("Arquivo anexado!");
    } catch { toast.error("Erro ao processar arquivo."); }
    finally { setUploadingFile(false); }
  }

  async function handleSubmit() {
    if (!form.description || !form.amount || !form.dueDate) {
      toast.error("Descrição, valor e vencimento são obrigatórios.");
      return;
    }
    try {
      const payload = {
        type: form.type,
        description: form.description,
        amount: parseFloat(form.amount.replace(",", ".")),
        dueDate: form.dueDate,
        category: form.category || null,
        supplierId: form.supplierId && form.supplierId !== "none" ? parseInt(form.supplierId) : undefined,
        clientName: form.clientName && form.clientName !== "none" ? form.clientName : null,
        attachmentUrl: form.attachmentUrl || null,
        notes: form.notes || null,
      };
      if (editing) {
        await updateAccount({ id: editing.id, data: payload });
        toast.success("Conta atualizada!");
      } else {
        await createAccount({ data: payload });
        toast.success("Conta criada!");
      }
      queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) });
      queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) });
      onSaved();
      onClose();
    } catch (err: any) { toast.error(err.message); }
  }

  function handleAddCategory() {
    if (!newCategory.trim()) return;
    onAddCategory(newCategory.trim(), form.type);
    setForm(f => ({ ...f, category: newCategory.trim() }));
    setNewCategory("");
    setShowNewCat(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
        <DialogHeader>
          <DialogTitle className="text-white">{editing ? "Editar Conta" : form.type === "payable" ? "Nova Conta a Pagar" : "Nova Conta a Receber"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!editing && (
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={form.type === "payable" ? "default" : "outline"} onClick={() => setForm(f => ({ ...f, type: "payable" }))}
                  className={form.type === "payable" ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-white/10 text-white/60"}>
                  <ArrowDownRight className="mr-2 h-4 w-4" /> A Pagar
                </Button>
                <Button variant={form.type === "receivable" ? "default" : "outline"} onClick={() => setForm(f => ({ ...f, type: "receivable" }))}
                  className={form.type === "receivable" ? "bg-green-500 hover:bg-green-600 text-white" : "border-white/10 text-white/60"}>
                  <ArrowUpRight className="mr-2 h-4 w-4" /> A Receber
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Descrição *</Label>
            <Input placeholder="Ex: Compra de cabos elétricos" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Valor (R$) *</Label>
              <Input placeholder="0,00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Vencimento *</Label>
              <Input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="border-white/10 bg-white/5 text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">Categoria</Label>
              <button onClick={() => setShowNewCat(v => !v)} className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                <Tag className="h-3 w-3" /> Nova categoria
              </button>
            </div>
            {showNewCat && (
              <div className="flex gap-2">
                <Input placeholder="Nome da categoria" value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
                <Button size="sm" onClick={handleAddCategory} className="bg-orange-500 hover:bg-orange-600 text-white">Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewCat(false)} className="text-white/40"><X className="h-4 w-4" /></Button>
              </div>
            )}
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.type === "payable" && (
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Fornecedor</Label>
              <Select value={form.supplierId} onValueChange={v => setForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.type === "receivable" && (
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs flex items-center gap-1"><User className="h-3.5 w-3.5" /> Cliente</Label>
              <Select value={form.clientName} onValueChange={v => setForm(f => ({ ...f, clientName: v }))}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Ou digite o nome manualmente" value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20 mt-1" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs flex items-center gap-2">
              <Paperclip className="h-3.5 w-3.5" /> Comprovante / Boleto
            </Label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {form.attachmentUrl ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-white/5">
                <Paperclip className="h-4 w-4 text-orange-400 shrink-0" />
                <span className="text-xs text-white/50 flex-1 truncate">Arquivo anexado</span>
                <button onClick={() => setForm(f => ({ ...f, attachmentUrl: "" }))} className="text-white/30 hover:text-red-400">
                  <X className="h-4 w-4" />
                </button>
                {form.attachmentUrl.startsWith("data:image") && (
                  <a href={form.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:underline">Ver</a>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2 border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                onClick={() => fileRef.current?.click()} disabled={uploadingFile}>
                <Paperclip className="h-4 w-4" />
                {uploadingFile ? "Processando..." : "Anexar arquivo (foto ou PDF)"}
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Observações</Label>
            <Textarea placeholder="Informações adicionais..." value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white/60">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Lista de Contas ───────────────────────────────────────
function FinancialList({ accounts, isLoading, onMarkPaid, onEdit, onDelete }: {
  accounts: Account[] | undefined;
  isLoading: boolean;
  onMarkPaid: (id: number) => void;
  onEdit: (acc: Account) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "hsl(220,25%,11%)" }}>
      <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b border-white/5 text-xs text-white/40">
        <div className="col-span-3">Descrição</div>
        <div className="col-span-2">Categoria</div>
        <div className="col-span-2">Fornecedor / Cliente</div>
        <div className="col-span-1">Vencimento</div>
        <div className="col-span-1 text-right">Valor</div>
        <div className="col-span-1 text-center">Anexo</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-center">Ações</div>
      </div>
      {isLoading ? (
        Array(5).fill(0).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-5 w-full" /></div>)
      ) : accounts && accounts.length > 0 ? (
        accounts.map((acc) => (
          <div key={acc.id} className="grid grid-cols-12 gap-2 p-4 items-center text-sm border-b border-white/5 hover:bg-white/3 transition-colors group">
            <div className="col-span-3 text-white font-medium truncate">
              {acc.description}
              {acc.notes && <p className="text-xs text-white/30 truncate">{acc.notes}</p>}
            </div>
            <div className="col-span-2 text-white/40 text-xs">{acc.category || '-'}</div>
            <div className="col-span-2 text-xs text-white/40">{acc.supplierName || acc.clientName || '-'}</div>
            <div className="col-span-1 text-xs text-white/40">
              {acc.dueDate ? new Date(acc.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
            </div>
            <div className="col-span-1 text-right font-medium text-white text-sm">{formatCurrency(acc.amount)}</div>
            <div className="col-span-1 flex justify-center">
              {acc.attachmentUrl ? (
                <a href={acc.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">
                  <Paperclip className="h-4 w-4" />
                </a>
              ) : <span className="text-white/20">-</span>}
            </div>
            <div className="col-span-1 flex justify-center">
              <Badge variant="outline" className={`text-xs ${getStatusColor(acc.status)}`}>
                {getStatusLabel(acc.status)}
              </Badge>
            </div>
            <div className="col-span-1 flex justify-center gap-1">
              {acc.status !== 'paid' && acc.status !== 'cancelled' && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  onClick={() => onMarkPaid(acc.id)} title="Marcar como pago">
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white"
                onClick={() => onEdit(acc)} title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-red-400"
                onClick={() => onDelete(acc.id)} title="Excluir">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-white/30">Nenhum registro encontrado.</div>
      )}
    </div>
  );
}

// ── Dashboard Descontos ───────────────────────────────────
function DiscountDashboard() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/financial/supplier-discounts`, { credentials: "include" })
      .then(r => r.json()).then(setDiscounts).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMonth = discounts.reduce((s, d) => s + d.totalMonth, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl p-4 border border-green-500/20" style={{ background: "hsl(152,60%,9%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-green-400" />
            <span className="text-xs text-white/50">Total gasto no mês</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(totalMonth)}</div>
        </div>
        <div className="rounded-xl p-4 border border-orange-500/20" style={{ background: "hsl(25,60%,9%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-white/50">Fornecedores ativos</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{discounts.length}</div>
        </div>
        <div className="rounded-xl p-4 border border-white/5" style={{ background: "hsl(220,25%,11%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Maior fornecedor</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{discounts[0]?.supplierName ?? '-'}</div>
          <div className="text-xs text-white/40">{discounts[0] ? formatCurrency(discounts[0].totalMonth) : '-'}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "hsl(220,25%,11%)" }}>
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white">Gastos por Fornecedor — Mês Atual</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/30">Carregando...</div>
        ) : discounts.length === 0 ? (
          <div className="p-8 text-center text-white/30">Nenhum gasto registrado neste mês.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {discounts.map(d => (
              <div key={d.supplierId} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{d.supplierName}</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(d.totalMonth)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min((d.totalMonth / totalMonth) * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-white/30">{d.transactionCount} transação(ões)</span>
                    <span className="text-xs text-green-400">Pago: {formatCurrency(d.totalPaid)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────
export function Financeiro() {
  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState<"payable"|"receivable">("payable");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState("payable");
  const [customCategories, setCustomCategories] = useState<{ expense: string[]; income: string[] }>({ expense: [], income: [] });
  const [exportType, setExportType] = useState("");

  const queryClient = useQueryClient();
  const { data: payable, isLoading: isLoadingPayable } = useListFinancialAccounts(
    { type: "payable" }, { query: { queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) } });
  const { data: receivable, isLoading: isLoadingReceivable } = useListFinancialAccounts(
    { type: "receivable" }, { query: { queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) } });
  const { data: suppliers } = useListSuppliers({}, {});
  const { mutate: updateAccount } = useUpdateFinancialAccount();

  const totalPayable = payable?.filter((a: any) => a.status !== 'paid').reduce((s: number, a: any) => s + a.amount, 0) ?? 0;
  const totalReceivable = receivable?.filter((a: any) => a.status !== 'paid').reduce((s: number, a: any) => s + a.amount, 0) ?? 0;
  const balance = totalReceivable - totalPayable;

  const categories = {
    expense: [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories.expense],
    income: [...DEFAULT_INCOME_CATEGORIES, ...customCategories.income],
  };

  function handleAddCategory(name: string, type: string) {
    if (type === "payable") setCustomCategories(c => ({ ...c, expense: [...c.expense, name] }));
    else setCustomCategories(c => ({ ...c, income: [...c.income, name] }));
    apiCall("/categories", { method: "POST", body: JSON.stringify({ name, type }) }).catch(() => {});
  }

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) });
    queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) });
  }

  function handleMarkPaid(id: number) {
    updateAccount({ id, data: { status: "paid", paidAt: new Date().toISOString() } }, { onSuccess: refreshAll });
  }

  async function handleDelete(id: number) {
    try {
      await apiCall(`/accounts/${id}`, { method: "DELETE" });
      toast.success("Conta excluída.");
      refreshAll();
    } catch { toast.error("Erro ao excluir."); }
  }

  function handleEdit(acc: Account) {
    setEditingAccount(acc);
    setShowModal(true);
  }

  function openModal(type: "payable"|"receivable") {
    setDefaultType(type);
    setEditingAccount(null);
    setShowModal(true);
  }

  function exportCSV(type: string) {
    window.open(`${API}/api/financial/export-csv?type=${type}`, "_blank");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Financeiro</h2>
          <p className="text-white/50 text-sm">Controle de contas a pagar, receber e fluxo de caixa.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={exportType} onValueChange={v => { setExportType(""); exportCSV(v); }}>
            <SelectTrigger className="w-40 border-white/10 text-white/60 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
              <SelectItem value="all">Tudo</SelectItem>
              <SelectItem value="payable">A Pagar</SelectItem>
              <SelectItem value="receivable">A Receber</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => openModal("receivable")}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10">
            <ArrowUpRight className="mr-2 h-4 w-4" /> A Receber
          </Button>
          <Button onClick={() => openModal("payable")} className="bg-orange-500 hover:bg-orange-600 text-white">
            <ArrowDownRight className="mr-2 h-4 w-4" /> A Pagar
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative rounded-xl p-4 border border-white/5 overflow-hidden" style={{ background: "hsl(220,25%,11%)" }}>
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: balance >= 0 ? '#22c55e' : '#ef4444' }} />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/50">Saldo Projetado</span>
            <Wallet className="h-4 w-4 text-white/30" />
          </div>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(balance)}</div>
          <p className="text-xs text-white/30 mt-1">Receber - Pagar em aberto</p>
        </div>
        <div className="relative rounded-xl p-4 border border-red-500/20 overflow-hidden" style={{ background: "hsl(0,50%,9%)" }}>
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/50">Total a Pagar</span>
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(totalPayable)}</div>
          <p className="text-xs text-white/30 mt-1">{payable?.filter((a: any) => a.status !== 'paid').length ?? 0} contas em aberto</p>
        </div>
        <div className="relative rounded-xl p-4 border border-green-500/20 overflow-hidden" style={{ background: "hsl(152,50%,9%)" }}>
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/50">Total a Receber</span>
            <ArrowUpRight className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(totalReceivable)}</div>
          <p className="text-xs text-white/30 mt-1">{receivable?.filter((a: any) => a.status !== 'paid').length ?? 0} contas em aberto</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border border-white/10 bg-transparent">
          <TabsTrigger value="payable" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-white/50">A Pagar</TabsTrigger>
          <TabsTrigger value="receivable" className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-white/50">A Receber</TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Fornecedores
          </TabsTrigger>
        </TabsList>
        <TabsContent value="payable" className="mt-6">
          <FinancialList accounts={payable as Account[]} isLoading={isLoadingPayable} onMarkPaid={handleMarkPaid} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="receivable" className="mt-6">
          <FinancialList accounts={receivable as Account[]} isLoading={isLoadingReceivable} onMarkPaid={handleMarkPaid} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="discounts" className="mt-6">
          <DiscountDashboard />
        </TabsContent>
      </Tabs>

      {showModal && (
        <AccountModal
          editing={editingAccount}
          defaultType={defaultType}
          onClose={() => { setShowModal(false); setEditingAccount(null); }}
          onSaved={refreshAll}
          suppliers={suppliers ?? []}
          categories={categories}
          onAddCategory={handleAddCategory}
        />
      )}
    </div>
  );
}
