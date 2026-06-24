import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListFinancialAccounts, getListFinancialAccountsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Financeiro() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-muted-foreground">Controle de contas a pagar, receber e fluxo de caixa.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary?.cashBalance || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar (Semana)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-destructive">{formatCurrency(summary?.payableThisWeek || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber (Semana)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-secondary">{formatCurrency(summary?.receivableThisWeek || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payable" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
        </TabsList>
        <TabsContent value="payable" className="mt-6">
          <FinancialList type="payable" />
        </TabsContent>
        <TabsContent value="receivable" className="mt-6">
          <FinancialList type="receivable" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinancialList({ type }: { type: 'payable' | 'receivable' }) {
  const { data: accounts, isLoading } = useListFinancialAccounts(
    { type }, 
    { query: { queryKey: getListFinancialAccountsQueryKey({ type }) } }
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm text-muted-foreground">
            <div className="col-span-4">Descrição</div>
            <div className="col-span-3">Fornecedor / Cliente</div>
            <div className="col-span-2">Vencimento</div>
            <div className="col-span-2 text-right">Valor</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          <div className="divide-y">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-12"><Skeleton className="h-5 w-full" /></div>
                </div>
              ))
            ) : accounts && accounts.length > 0 ? (
              accounts.map((acc) => (
                <div key={acc.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                  <div className="col-span-4 font-medium">{acc.description}</div>
                  <div className="col-span-3 text-muted-foreground">{acc.supplierName || '-'}</div>
                  <div className="col-span-2 text-muted-foreground">{new Date(acc.dueDate).toLocaleDateString('pt-BR')}</div>
                  <div className={`col-span-2 text-right font-medium \${type === 'payable' ? 'text-foreground' : 'text-secondary'}`}>
                    {formatCurrency(acc.amount)}
                  </div>
                  <div className="col-span-1 text-right flex justify-end">
                    <Badge variant="outline" className={`
                      \${acc.status === 'paid' ? 'bg-secondary/10 text-secondary border-secondary/20' : ''}
                      \${acc.status === 'pending' ? 'bg-accent/10 text-accent border-accent/20' : ''}
                      \${acc.status === 'overdue' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                    `}>
                      {acc.status === 'paid' ? 'Pago' : acc.status === 'pending' ? 'Pendente' : acc.status === 'overdue' ? 'Vencido' : acc.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum registro encontrado.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
