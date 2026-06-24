import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardCashFlow, getGetDashboardCashFlowQueryKey, useGetDashboardProjectsOverview, getGetDashboardProjectsOverviewQueryKey, useGetDashboardAlerts, getGetDashboardAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DollarSign, AlertTriangle, Briefcase, PackageOpen, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: cashFlow, isLoading: isLoadingCashFlow } = useGetDashboardCashFlow({ query: { queryKey: getGetDashboardCashFlowQueryKey() } });
  const { data: projects, isLoading: isLoadingProjects } = useGetDashboardProjectsOverview({ query: { queryKey: getGetDashboardProjectsOverviewQueryKey() } });
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts({ query: { queryKey: getGetDashboardAlertsQueryKey() } });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral e indicadores em tempo real.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : summary ? (
          <>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(summary.cashBalance)}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <ArrowDownRight className="h-3 w-3 mr-1 text-destructive" />
                    A pagar na semana: {formatCurrency(summary.payableThisWeek)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compras Pendentes</CardTitle>
                  <PackageOpen className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.pendingPurchases}</div>
                  <p className="text-xs text-muted-foreground mt-1">Solicitações aguardando ação</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
                  <Briefcase className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.activeProjects}</div>
                  <p className="text-xs text-muted-foreground mt-1">Em execução no momento</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Economia no Mês</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{formatCurrency(summary.totalSavedThisMonth)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Gerado através de cotações</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={itemVariants} className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCashFlow ? (
                <Skeleton className="h-[300px] w-full" />
              ) : cashFlow ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlow.monthly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0, 3)} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `R$ \${(val / 1000)}k`} />
                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), ""]}
                        cursor={{fill: "hsl(var(--muted))"}}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Receitas" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados disponíveis</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Alertas Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-start space-x-4 p-3 rounded-lg border bg-card">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 \${
                        alert.severity === 'urgent' ? 'text-destructive' : 
                        alert.severity === 'warning' ? 'text-accent' : 'text-primary'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">{alert.title}</p>
                          <Badge variant="outline" className={`text-[10px] \${
                            alert.severity === 'urgent' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                            alert.severity === 'warning' ? 'bg-accent/10 text-accent border-accent/20' : ''
                          }`}>
                            {alert.severity === 'urgent' ? 'Urgente' : alert.severity === 'warning' ? 'Atenção' : 'Info'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                  <Activity className="h-12 w-12 text-muted mb-4" />
                  <p>Nenhum alerta ativo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Obras em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
               <Skeleton className="h-64 w-full" />
            ) : projects && projects.length > 0 ? (
              <div className="space-y-6">
                {projects.map(project => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-sm font-medium text-muted-foreground">{project.percentUsed.toFixed(1)}% utilizado</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full \${project.percentUsed > 90 ? 'bg-destructive' : project.percentUsed > 75 ? 'bg-accent' : 'bg-primary'}`} 
                        style={{ width: `\${Math.min(project.percentUsed, 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Gasto: {formatCurrency(project.spent)}</span>
                      <span>Orçado: {formatCurrency(project.budgeted)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">Nenhuma obra ativa no momento.</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
