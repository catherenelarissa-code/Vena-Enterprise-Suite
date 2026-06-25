import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardCashFlow, getGetDashboardCashFlowQueryKey, useGetDashboardProjectsOverview, getGetDashboardProjectsOverviewQueryKey, useGetDashboardAlerts, getGetDashboardAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DollarSign, AlertTriangle, Briefcase, PackageOpen, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: cashFlow, isLoading: isLoadingCashFlow } = useGetDashboardCashFlow({ query: { queryKey: getGetDashboardCashFlowQueryKey() } });
  const { data: projects, isLoading: isLoadingProjects } = useGetDashboardProjectsOverview({ query: { queryKey: getGetDashboardProjectsOverviewQueryKey() } });
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts({ query: { queryKey: getGetDashboardAlertsQueryKey() } });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral e indicadores em tempo real.</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : summary ? (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.cashBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(summary.cashBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                  A pagar esta semana: {formatCurrency(summary.payableThisWeek)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compras Pendentes</CardTitle>
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <PackageOpen className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.pendingPurchases}</div>
                <p className="text-xs text-muted-foreground mt-1">Solicitações aguardando ação</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">Em execução no momento</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
                <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.lowStockItems}</div>
                <p className="text-xs text-muted-foreground mt-1">Materiais abaixo do mínimo</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Fluxo de caixa + Alertas */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCashFlow ? (
              <Skeleton className="h-[300px] w-full" />
            ) : cashFlow ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">30 dias</p>
                    <p className={`text-lg font-bold ${cashFlow.days30 >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                      {formatCurrency(cashFlow.days30)}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">60 dias</p>
                    <p className={`text-lg font-bold ${cashFlow.days60 >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                      {formatCurrency(cashFlow.days60)}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">90 dias</p>
                    <p className={`text-lg font-bold ${cashFlow.days90 >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                      {formatCurrency(cashFlow.days90)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cashFlow.monthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => v.substring(0, 3)} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(v: any) => formatCurrency(v)} cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="income" name="Receitas" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                    <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAlerts ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 6).map((alert: any) => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.severity === 'urgent' ? 'bg-destructive/5 border-destructive/20' :
                    alert.severity === 'warning' ? 'bg-accent/5 border-accent/20' :
                    'bg-muted/30 border-border'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                      alert.severity === 'urgent' ? 'text-destructive' :
                      alert.severity === 'warning' ? 'text-accent' : 'text-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{alert.title}</p>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${
                          alert.severity === 'urgent' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          alert.severity === 'warning' ? 'bg-accent/10 text-accent border-accent/20' : ''
                        }`}>
                          {alert.severity === 'urgent' ? 'Urgente' : alert.severity === 'warning' ? 'Atenção' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-secondary mb-3" />
                <p className="font-medium">Tudo em ordem!</p>
                <p className="text-xs mt-1">Nenhum alerta ativo.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Obras em andamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Obras em Andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <Skeleton className="h-48 w-full" />
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project: any) => (
                <div key={project.id} className="p-4 border rounded-lg space-y-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{project.name}</h4>
                    <Badge variant="outline" className={`text-xs ${
                      project.percentUsed > 90 ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      project.percentUsed > 75 ? 'bg-accent/10 text-accent border-accent/20' :
                      'bg-secondary/10 text-secondary border-secondary/20'
                    }`}>
                      {project.percentUsed}% usado
                    </Badge>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      project.percentUsed > 90 ? 'bg-destructive' :
                      project.percentUsed > 75 ? 'bg-accent' : 'bg-primary'
                    }`} style={{ width: `${Math.min(project.percentUsed, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Gasto: {formatCurrency(project.spent)}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Orçado: {formatCurrency(project.budgeted)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted" />
              <p>Nenhuma obra ativa no momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
