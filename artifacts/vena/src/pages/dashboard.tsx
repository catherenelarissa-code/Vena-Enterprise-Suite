import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardCashFlow, getGetDashboardCashFlowQueryKey, useGetDashboardProjectsOverview, getGetDashboardProjectsOverviewQueryKey, useGetDashboardAlerts, getGetDashboardAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DollarSign, AlertTriangle, Briefcase, PackageOpen, ArrowDownRight, TrendingUp, TrendingDown, CheckCircle2, Zap, Bell, Calendar, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Torre elétrica SVG
function TowerIllustration() {
  return (
    <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-20">
      <line x1="100" y1="10" x2="60" y2="290" stroke="#F97316" strokeWidth="2"/>
      <line x1="100" y1="10" x2="140" y2="290" stroke="#F97316" strokeWidth="2"/>
      <line x1="60" y1="290" x2="140" y2="290" stroke="#F97316" strokeWidth="2"/>
      <line x1="55" y1="80" x2="145" y2="80" stroke="#F97316" strokeWidth="3"/>
      <line x1="65" y1="130" x2="135" y2="130" stroke="#F97316" strokeWidth="2.5"/>
      <line x1="72" y1="175" x2="128" y2="175" stroke="#F97316" strokeWidth="2"/>
      <line x1="78" y1="215" x2="122" y2="215" stroke="#F97316" strokeWidth="1.5"/>
      <line x1="55" y1="80" x2="80" y2="130" stroke="#F97316" strokeWidth="1"/>
      <line x1="145" y1="80" x2="120" y2="130" stroke="#F97316" strokeWidth="1"/>
      <line x1="65" y1="130" x2="82" y2="175" stroke="#F97316" strokeWidth="1"/>
      <line x1="135" y1="130" x2="118" y2="175" stroke="#F97316" strokeWidth="1"/>
      <line x1="80" y1="130" x2="65" y2="130" stroke="#F97316" strokeWidth="1"/>
      <line x1="120" y1="130" x2="135" y2="130" stroke="#F97316" strokeWidth="1"/>
      <circle cx="55" cy="80" r="3" fill="#F97316"/>
      <circle cx="145" cy="80" r="3" fill="#F97316"/>
      <circle cx="65" cy="130" r="2.5" fill="#F97316"/>
      <circle cx="135" cy="130" r="2.5" fill="#F97316"/>
      <path d="M30 80 Q55 85 55 80" stroke="#F97316" strokeWidth="1" fill="none" strokeDasharray="3,3"/>
      <path d="M145 80 Q170 85 195 80" stroke="#F97316" strokeWidth="1" fill="none" strokeDasharray="3,3"/>
      <path d="M20 130 Q65 138 65 130" stroke="#F97316" strokeWidth="1" fill="none" strokeDasharray="3,3"/>
      <path d="M135 130 Q180 138 195 130" stroke="#F97316" strokeWidth="1" fill="none" strokeDasharray="3,3"/>
    </svg>
  );
}

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: cashFlow, isLoading: isLoadingCashFlow } = useGetDashboardCashFlow({ query: { queryKey: getGetDashboardCashFlowQueryKey() } });
  const { data: projects, isLoading: isLoadingProjects } = useGetDashboardProjectsOverview({ query: { queryKey: getGetDashboardProjectsOverviewQueryKey() } });
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts({ query: { queryKey: getGetDashboardAlertsQueryKey() } });

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Hero banner com torre */}
      <div className="relative rounded-2xl overflow-hidden border border-white/5" style={{
        background: "linear-gradient(135deg, hsl(152,60%,8%) 0%, hsl(152,50%,12%) 50%, hsl(220,30%,10%) 100%)",
        minHeight: "140px"
      }}>
        {/* Torre no canto direito */}
        <div className="absolute right-0 top-0 h-full w-48 opacity-30">
          <TowerIllustration />
        </div>
        {/* Glow laranja */}
        <div className="absolute top-0 right-32 w-40 h-40 rounded-full opacity-10" style={{
          background: "radial-gradient(circle, #F97316 0%, transparent 70%)"
        }}/>
        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Vena Engenharia</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Olá, Administrador! 👋</h2>
            <p className="text-white/50 text-sm mt-1 capitalize">{dateStr}</p>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-xs text-white/70">Sistema online</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
              <Bell className="h-3 w-3 text-orange-400"/>
              <span className="text-xs text-white/70">{alerts?.length || 0} alertas ativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : summary ? (
          <>
            <div className="relative rounded-xl p-4 border border-green-500/20 overflow-hidden" style={{
              background: "linear-gradient(135deg, hsl(152,60%,9%) 0%, hsl(152,50%,12%) 100%)"
            }}>
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl"/>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50 font-medium">Saldo Projetado</span>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <DollarSign className="h-4 w-4 text-green-400"/>
                </div>
              </div>
              <div className={`text-2xl font-bold ${summary.cashBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(summary.cashBalance)}
              </div>
              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3 text-red-400"/>
                A pagar: {formatCurrency(summary.payableThisWeek)}
              </p>
            </div>

            <div className="relative rounded-xl p-4 border border-orange-500/20 overflow-hidden" style={{
              background: "linear-gradient(135deg, hsl(25,80%,9%) 0%, hsl(25,70%,12%) 100%)"
            }}>
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-xl"/>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50 font-medium">Compras Pendentes</span>
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <PackageOpen className="h-4 w-4 text-orange-400"/>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{summary.pendingPurchases}</div>
              <p className="text-xs text-white/40 mt-1">Solicitações aguardando ação</p>
            </div>

            <div className="relative rounded-xl p-4 border border-green-400/20 overflow-hidden" style={{
              background: "linear-gradient(135deg, hsl(152,60%,9%) 0%, hsl(152,50%,12%) 100%)"
            }}>
              <div className="absolute top-0 left-0 w-1 h-full bg-green-400 rounded-l-xl"/>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50 font-medium">Obras Ativas</span>
                <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center border border-green-400/20">
                  <Briefcase className="h-4 w-4 text-green-300"/>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{summary.activeProjects}</div>
              <p className="text-xs text-white/40 mt-1">Em execução no momento</p>
            </div>

            <div className="relative rounded-xl p-4 border border-red-500/20 overflow-hidden" style={{
              background: "linear-gradient(135deg, hsl(0,60%,9%) 0%, hsl(0,50%,12%) 100%)"
            }}>
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl"/>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50 font-medium">Estoque Crítico</span>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400"/>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-400">{summary.lowStockItems}</div>
              <p className="text-xs text-white/40 mt-1">Materiais abaixo do mínimo</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Fluxo de caixa + Alertas */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-white/5" style={{background: "hsl(220,25%,10%)"}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-green-400"/>
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCashFlow ? (
              <Skeleton className="h-[300px] w-full"/>
            ) : cashFlow ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "30 dias", value: cashFlow.days30 },
                    { label: "60 dias", value: cashFlow.days60 },
                    { label: "90 dias", value: cashFlow.days90 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg p-3 text-center border border-white/5" style={{background: "hsl(220,25%,13%)"}}>
                      <p className="text-xs text-white/40">{item.label}</p>
                      <p className={`text-base font-bold mt-1 ${item.value >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cashFlow.monthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => v.substring(0, 3)}/>
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}/>
                    <RechartsTooltip formatter={(v: any) => formatCurrency(v)} cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'hsl(220,25%,13%)' }}/>
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}/>
                    <Bar dataKey="income" name="Receitas" fill="#F97316" radius={[4,4,0,0]}/>
                    <Bar dataKey="expenses" name="Despesas" fill="#22c55e" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-white/30">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-white/5" style={{background: "hsl(220,25%,10%)"}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-orange-400"/>
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAlerts ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 6).map((alert: any) => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.severity === 'urgent' ? 'bg-red-500/5 border-red-500/20' :
                    alert.severity === 'warning' ? 'bg-orange-500/5 border-orange-500/20' :
                    'bg-white/5 border-white/10'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                      alert.severity === 'urgent' ? 'text-red-400' :
                      alert.severity === 'warning' ? 'text-orange-400' : 'text-green-400'
                    }`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${
                          alert.severity === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          alert.severity === 'warning' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''
                        }`}>
                          {alert.severity === 'urgent' ? 'Urgente' : alert.severity === 'warning' ? 'Atenção' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <div className="w-14 h-14 rounded-full border-2 border-orange-500/30 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-orange-400"/>
                </div>
                <p className="font-medium text-white/60">Tudo em ordem!</p>
                <p className="text-xs mt-1">Nenhum alerta ativo.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Obras em andamento */}
      <Card className="border-white/5" style={{background: "hsl(220,25%,10%)"}}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Briefcase className="h-5 w-5 text-green-400"/>
            Obras em Andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <Skeleton className="h-48 w-full"/>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project: any) => (
                <div key={project.id} className="p-4 border border-white/5 rounded-lg space-y-3 hover:border-orange-500/30 transition-colors" style={{background: "hsl(220,25%,13%)"}}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-white">{project.name}</h4>
                    <Badge variant="outline" className={`text-xs ${
                      project.percentUsed > 90 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      project.percentUsed > 75 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {project.percentUsed}% usado
                    </Badge>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      project.percentUsed > 90 ? 'bg-red-500' :
                      project.percentUsed > 75 ? 'bg-orange-500' : 'bg-green-500'
                    }`} style={{ width: `${Math.min(project.percentUsed, 100)}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3"/> Gasto: {formatCurrency(project.spent)}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3"/> Orçado: {formatCurrency(project.budgeted)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/30 py-8">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30"/>
              <p>Nenhuma obra ativa no momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
