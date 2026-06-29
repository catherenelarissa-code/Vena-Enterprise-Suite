import { useState, useRef } from "react";
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
  Trash2, Pencil, Download, Paperclip, Tag, User, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// ── Constantes ───────────────────────────────────────────────────────────────

const DEFAULT_EXPENSE_CATEGORIES = [
  "Compra de materiais","Mão de obra","Equipamentos",
  "Despesas administrativas","Combustível","EPI e segurança","Outros"
];
const DEFAULT_INCOME_CATEGORIES = ["Receita de obra","Adiantamento de cliente","Serviços prestados","Outros"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: string) {
  switch (status) {
    case 'paid': return 'bg-secondary/10 text-secondary border-secondary/20';
    case 'pending': return 'bg-accent/10 text-accent border-accent/20';
    case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', cancelled: 'Cancelado' };
  return map[status] || status;
}

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`/api/financial${path}`, {
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

// ── Modal: Nova/Editar Conta ─────────────────────────────────────────────────

type Account = {
  id: number; type: string; description: string; amount: number;
  dueDate: string; status: string; category?: string;
  supplierId?: number; supplierName?: string;
  clientName?: string; attachmentUrl?: string; notes?: string;
  projectId?: number; projectName?: string; paidAt?: string;
};

function AccountModal({
  editing, defaultType, onClose, onSaved, suppliers, categories,
  onAddCategory,
}: {
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

  const isPending = isCreating || isUpdating;
  const cats = form.type === "receivable" ? categories.income : categories.expense;

  async function handleFile(file: File) {
    setUploadingFile(true);
    try {
      const base64 = await fileToBase64(file);
      setForm(f => ({ ...f, attachmentUrl: base64 }));
      toast.success("Arquivo anexado!");
    } catch {
      toast.error("Erro ao processar arquivo.");
    } finally {
      setUploadingFile(false);
    }
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
        supplierId: form.supplierId ? parseInt(form.supplierId) : undefined,
        clientName: form.clientName || null,
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
    } catch (err: any) {
      toast.error(err.message);
    }
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Conta" : form.type === "payable" ? "Nova Conta a Pagar" : "Nova Conta a Receber"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!editing && (
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={form.type === "payable" ? "default" : "outline"} onClick={() => setForm(f => ({ ...f, type: "payable" }))}>
                  <ArrowDownRight className="mr-2 h-4 w-4" /> A Pagar
                </Button>
                <Button variant={form.type === "receivable" ? "default" : "outline"} onClick={() => setForm(f => ({ ...f, type: "receivable" }))}>
                  <ArrowUpRight className="mr-2 h-4 w-4" /> A Receber
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input placeholder="Ex: Compra de cabos elétricos" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento *</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Categoria</Label>
              <button onClick={() => setShowNewCat(v => !v)} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Tag className="h-3 w-3" /> Nova categoria
              </button>
            </div>
            {showNewCat && (
              <div className="flex gap-2">
                <Input placeholder="Nome da categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddCategory()} />
                <Button size="sm" onClick={handleAddCategory}>Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewCat(false)}><X className="h-4 w-4" /></Button>
              </div>
            )}
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.type === "payable" && (
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Select value={form.supplierId} onValueChange={v => setForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.type === "receivable" && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Cliente</Label>
              <Input placeholder="Nome do cliente" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-3.5 w-3.5" /> Comprovante / Boleto
            </Label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {form.attachmentUrl ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                <Paperclip className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground flex-1 truncate">Arquivo anexado</span>
                <button onClick={() => setForm(f => ({ ...f, attachmentUrl: "" }))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
                {form.attachmentUrl.startsWith("data:image") && (
                  <a href={form.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Ver</a>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploadingFile}>
                <Paperclip className="h-4 w-4" />
                {uploadingFile ? "Processando..." : "Anexar arquivo (foto ou PDF)"}
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea placeholder="Informações adicionais..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Lista de Contas ───────────────────────────────────────────────────────────

function FinancialList({
  accounts, isLoading, onMarkPaid, onEdit, onDelete,
}: {
  accounts: Account[] | undefined;
  isLoading: boolean;
  onMarkPaid: (id: number) => void;
  onEdit: (acc: Account) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border divide-y">
          <div className="grid grid-cols-12 gap-2 p-4 font-medium bg-muted/50 text-sm text-muted-foreground">
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
              <div key={acc.id} className="grid grid-cols-12 gap-2 p-4 items-center text-sm hover:bg-muted/30 transition-colors group">
                <div className="col-span-3 font-medium truncate">
                  {acc.description}
                  {acc.notes && <p className="text-xs text-muted-foreground truncate">{acc.notes}</p>}
                </div>
                <div className="col-span-2 text-muted-foreground text-xs">{acc.category || '-'}</div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {acc.supplierName || acc.clientName || '-'}
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">
                  {acc.dueDate ? new Date(acc.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                </div>
                <div className="col-span-1 text-right font-medium text-sm">{formatCurrency(acc.amount)}</div>
                <div className="col-span-1 flex justify-center">
                  {acc.attachmentUrl ? (
                    <a href={acc.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" title="Ver comprovante">
                      <Paperclip className="h-4 w-4" />
                    </a>
                  ) : <span className="text-muted-foreground/30">-</span>}
                </div>
                <div className="col-span-1 flex justify-center">
                  <Badge variant="outline" className={`text-xs ${getStatusColor(acc.status)}`}>
                    {getStatusLabel(acc.status)}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-center gap-1">
                  {acc.status !== 'paid' && acc.status !== 'cancelled' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkPaid(acc.id)} title="Marcar como pago">
                      <CheckCircle className="h-3.5 w-3.5 text-secondary" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(acc)} title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => onDelete(acc.id)} title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">Nenhum registro encontrado.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────

export function Financeiro() {
  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState<"payable"|"receivable">("payable");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState("payable");
  const [customCategories, setCustomCategories] = useState<{ expense: string[]; income: string[] }>({ expense: [], income: [] });

  const queryClient = useQueryClient();
  const { data: payable, isLoading: isLoadingPayable } = useListFinancialAccounts({ type: "payable" }, { query: { queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) } });
  const { data: receivable, isLoading: isLoadingReceivable } = useListFinancialAccounts({ type: "receivable" }, { query: { queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) } });
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
    if (type === "payable") {
      setCustomCategories(c => ({ ...c, expense: [...c.expense, name] }));
    } else {
      setCustomCategories(c => ({ ...c, income: [...c.income, name] }));
    }
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
    } catch {
      toast.error("Erro ao excluir.");
    }
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

  function exportCSV(type: "payable"|"receivable"|"all") {
    window.open(`/api/financial/export-csv?type=${type}`, "_blank");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-muted-foreground">Controle de contas a pagar, receber e fluxo de caixa.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select onValueChange={(v) => exportCSV(v as any)}>
            <SelectTrigger className="w-40 gap-2">
              <Download className="h-4 w-4" />
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tudo</SelectItem>
              <SelectItem value="payable">A Pagar</SelectItem>
              <SelectItem value="receivable">A Receber</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => openModal("receivable")}>
            <ArrowUpRight className="mr-2 h-4 w-4 text-secondary" /> A Receber
          </Button>
          <Button onClick={() => openModal("payable")} className="bg-primary text-primary-foreground">
            <ArrowDownRight className="mr-2 h-4 w-4" /> A Pagar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receber - Pagar em aberto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">{payable?.filter((a: any) => a.status !== 'paid').length ?? 0} contas em aberto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(totalReceivable)}</div>
            <p className="text-xs text-muted-foreground mt-1">{receivable?.filter((a: any) => a.status !== 'paid').length ?? 0} contas em aberto</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
        </TabsList>
        <TabsContent value="payable" className="mt-6">
          <FinancialList accounts={payable as Account[]} isLoading={isLoadingPayable} onMarkPaid={handleMarkPaid} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="receivable" className="mt-6">
          <FinancialList accounts={receivable as Account[]} isLoading={isLoadingReceivable} onMarkPaid={handleMarkPaid} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>

      {/* Modal */}
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
