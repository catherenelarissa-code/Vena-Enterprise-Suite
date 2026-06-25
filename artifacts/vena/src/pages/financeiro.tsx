import { useState } from "react";
import { useListFinancialAccounts, getListFinancialAccountsQueryKey, useCreateFinancialAccount, useUpdateFinancialAccount, useListSuppliers, useGetMonthlySummary } from "@workspace/api-client-react";
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
import { Plus, ArrowDownRight, ArrowUpRight, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORIES_EXPENSE = ["Compra de materiais","Mão de obra","Equipamentos","Despesas administrativas","Combustível","EPI e segurança","Outros"];
const CATEGORIES_INCOME = ["Receita de obra","Adiantamento de cliente","Outros"];

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

export function Financeiro() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("payable");
  const [type, setType] = useState<"payable"|"receivable">("payable");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const queryClient = useQueryClient();
  const { data: payable, isLoading: isLoadingPayable } = useListFinancialAccounts({ type: "payable" }, { query: { queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) } });
  const { data: receivable, isLoading: isLoadingReceivable } = useListFinancialAccounts({ type: "receivable" }, { query: { queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) } });
  const { data: suppliers } = useListSuppliers({}, {});
  const { data: monthlySummary } = useGetMonthlySummary({});
  const { mutate: createAccount, isPending } = useCreateFinancialAccount();
  const { mutate: updateAccount } = useUpdateFinancialAccount();

  const totalPayable = payable?.filter(a => a.status !== 'paid').reduce((s, a) => s + a.amount, 0) ?? 0;
  const totalReceivable = receivable?.filter(a => a.status !== 'paid').reduce((s, a) => s + a.amount, 0) ?? 0;
  const balance = totalReceivable - totalPayable;

  function handleSubmit() {
    if (!description || !amount || !dueDate) return;
    createAccount({
      data: { type, description, amount: parseFloat(amount), dueDate, category, supplierId: supplierId ? parseInt(supplierId) : undefined }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) });
        queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) });
        setShowModal(false);
        setDescription(""); setAmount(""); setDueDate(""); setCategory(""); setSupplierId(""); setNotes("");
      }
    });
  }

  function handleMarkPaid(id: number) {
    updateAccount({ id, data: { status: "paid", paidAt: new Date().toISOString() } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "payable" }) });
        queryClient.invalidateQueries({ queryKey: getListFinancialAccountsQueryKey({ type: "receivable" }) });
      }
    });
  }

  function openModal(t: "payable"|"receivable") {
    setType(t);
    setShowModal(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-muted-foreground">Controle de contas a pagar, receber e fluxo de caixa.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openModal("receivable")}>
            <ArrowUpRight className="mr-2 h-4 w-4 text-secondary" /> A Receber
          </Button>
          <Button onClick={() => openModal("payable")} className="bg-primary text-primary-foreground">
            <ArrowDownRight className="mr-2 h-4 w-4" /> A Pagar
          </Button>
        </div>
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">{payable?.filter(a => a.status !== 'paid').length ?? 0} contas em aberto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(totalReceivable)}</div>
            <p className="text-xs text-muted-foreground mt-1">{receivable?.filter(a => a.status !== 'paid').length ?? 0} contas em aberto</p>
          </CardContent>
        </Card>
      </div>

      {monthlySummary && monthlySummary.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Fluxo de Caixa Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlySummary}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
        </TabsList>

        <TabsContent value="payable" className="mt-6">
          <FinancialList accounts={payable} isLoading={isLoadingPayable} onMarkPaid={handleMarkPaid} />
        </TabsContent>
        <TabsContent value="receivable" className="mt-6">
          <FinancialList accounts={receivable} isLoading={isLoadingReceivable} onMarkPaid={handleMarkPaid} />
        </TabsContent>
      </Tabs>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{type === 'payable' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input placeholder="Ex: Compra de cabos elétricos" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(type === 'payable' ? CATEGORIES_EXPENSE : CATEGORIES_INCOME).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === 'payable' && (
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Informações adicionais..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FinancialList({ accounts, isLoading, onMarkPaid }: { accounts: any[] | undefined; isLoading: boolean; onMarkPaid: (id: number) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border divide-y">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-muted/50 text-sm text-muted-foreground">
            <div className="col-span-4">Descrição</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2">Vencimento</div>
            <div className="col-span-2 text-right">Valor</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Ação</div>
          </div>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4"><Skeleton className="h-5 w-full" /></div>
            ))
          ) : accounts && accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                <div className="col-span-4 font-medium">
                  {acc.description}
                  {acc.supplierName && <p className="text-xs text-muted-foreground">{acc.supplierName}</p>}
                </div>
                <div className="col-span-2 text-muted-foreground">{acc.category || '-'}</div>
                <div className="col-span-2 text-muted-foreground">
                  {acc.dueDate ? new Date(acc.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                </div>
                <div className="col-span-2 text-right font-medium">{formatCurrency(acc.amount)}</div>
                <div className="col-span-1 flex justify-center">
                  <Badge variant="outline" className={getStatusColor(acc.status)}>
                    {getStatusLabel(acc.status)}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-center">
                  {acc.status !== 'paid' && acc.status !== 'cancelled' && (
                    <Button variant="ghost" size="icon" onClick={() => onMarkPaid(acc.id)} title="Marcar como pago">
                      <CheckCircle className="h-4 w-4 text-secondary" />
                    </Button>
                  )}
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
