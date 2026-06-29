import { useState, useEffect } from "react";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardCashFlow, getGetDashboardCashFlowQueryKey, useGetDashboardProjectsOverview, getGetDashboardProjectsOverviewQueryKey, useGetDashboardAlerts, getGetDashboardAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DollarSign, AlertTriangle, Briefcase, PackageOpen, ArrowDownRight, TrendingUp, TrendingDown, CheckCircle2, Zap, Bell, Calendar, Clock, ListTodo, CalendarClock, AlarmClock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL ?? "";

async function agendaFetch(path: string) {
  const res = await fetch(`${API}/api/agenda${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function financialFetch(path: string) {
  const res = await fetch(`${API}/api/financial${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function suppliersFetch(path: string) {
  const res = await fetch(`${API}/api/suppliers${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type FinancialAccount = {
  id: number; type: "payable" | "receivable"; description: string;
  amount: number; dueDate: string; status: "pending" | "paid" | "overdue" | "cancelled";
  category?: string; clientName?: string; supplierName?: string; projectName?: string;
};

type MonthlySummary = { month: string; income: number; expenses: number; balance: number };

type MonthlyDiscount = { month: string; savedAmount: number };

type Task = {
  id: number; title: string; description?: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  status: "pendente" | "em_andamento" | "concluida" | "cancelada";
  due_date?: string; assigned_name?: string; client_name?: string;
};

type Appointment = {
  id: number; title: string; description?: string;
  start_time: string; end_time?: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  type: string; client_name?: string; project_name?: string;
};

const PRIORITY_DOT: Record<string, string> = {
  urgente: "bg-red-400",
  alta: "bg-orange-400",
  media: "bg-yellow-400",
  baixa: "bg-green-400",
};

function isSameOrBeforeToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d.getTime() < today.getTime() - 24 * 60 * 60 * 1000 + 1; // estritamente antes de hoje (vencida)
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due.getTime() < startOfToday.getTime();
}

function isTodayOrTomorrow(dateStr: string) {
  const d = new Date(dateStr);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date(startOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
  return d.getTime() >= startOfToday.getTime() && d.getTime() < endOfTomorrow.getTime();
}

function isUpcomingDeadline(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const in3Days = new Date(startOfToday);
  in3Days.setDate(in3Days.getDate() + 3);
  return due.getTime() >= startOfToday.getTime() && due.getTime() < in3Days.getTime();
}

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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(true);

  const [upcomingAccounts, setUpcomingAccounts] = useState<FinancialAccount[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(true);

  const [monthlyDiscounts, setMonthlyDiscounts] = useState<MonthlyDiscount[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoadingAgenda(true);
    Promise.all([agendaFetch("/tasks"), agendaFetch("/appointments")])
      .then(([t, a]) => {
        if (!active) return;
        setTasks(t);
        setAppointments(a);
      })
      .catch((e) => console.error(e))
      .finally(() => { if (active) setIsLoadingAgenda(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingFinancial(true);
    Promise.all([
      financialFetch("/accounts?status=pending&due_in_days=7"),
      financialFetch("/monthly-summary"),
    ])
      .then(([accounts, summary]) => {
        if (!active) return;
        setUpcomingAccounts(accounts);
        setMonthlySummary(summary);
      })
      .catch((e) => console.error(e))
      .finally(() => { if (active) setIsLoadingFinancial(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingDiscounts(true);
    suppliersFetch("/monthly-discounts")
      .then((data) => { if (active) setMonthlyDiscounts(data); })
      .catch((e) => console.error(e))
      .finally(() => { if (active) setIsLoadingDiscounts(false); });
    return () => { active = false; };
  }, []);

  const pendingTasks = tasks.filter(t => t.status !== "concluida" && t.status !== "cancelada");

  const importantTasks = pendingTasks
    .filter(t => t.priority === "urgente" || t.priority === "alta" || isUpcomingDeadline(t.due_date))
    .sort((a, b) => {
      const order: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 6);

  const overdueTasks = pendingTasks.filter(t => isOverdue(t.due_date));

  const upcomingAppointments = appointments
    .filter(a => isTodayOrTomorrow(a.start_time))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 6);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthSummary = monthlySummary.find(m => m.month === currentMonthKey);
  const monthPayable = currentMonthSummary?.expenses ?? 0;
  const monthReceivable = currentMonthSummary?.income ?? 0;

  const sortedUpcomingAccounts = [...upcomingAccounts].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const discountChartData = monthlyDiscounts.map(d => {
    const [year, month] = d.month.split('-');
    const label = new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'short' });
    return { month: label, savedAmount: d.savedAmount };
  });
  const totalSaved = monthlyDiscounts.reduce((sum, d) => sum + d.savedAmount, 0);

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

      {/* Agenda: Tarefas Importantes | Próximos Compromissos | Atrasadas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tarefas Importantes */}
        <Card className="border-white/5" style={{ background: "hsl(220,25%,10%)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <ListTodo className="h-4.5 w-4.5 text-orange-400" />
              Tarefas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAgenda ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : importantTasks.length > 0 ? (
              <div className="space-y-2">
                {importantTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-white/5" style={{ background: "hsl(220,25%,13%)" }}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/30">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Nenhuma tarefa importante</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Compromissos */}
        <Card className="border-white/5" style={{ background: "hsl(220,25%,10%)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <CalendarClock className="h-4.5 w-4.5 text-blue-400" />
              Próximos Compromissos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAgenda ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                {upcomingAppointments.map(appt => {
                  const d = new Date(appt.start_time);
                  return (
                    <div key={appt.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-white/5" style={{ background: "hsl(220,25%,13%)" }}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[appt.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{appt.title}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/30">
                <Calendar className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Nada agendado para hoje/amanhã</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atrasadas */}
        <Card className="border-white/5" style={{ background: "hsl(220,25%,10%)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <AlarmClock className="h-4.5 w-4.5 text-red-400" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAgenda ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : overdueTasks.length > 0 ? (
              <div className="space-y-2">
                {overdueTasks.slice(0, 6).map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-red-500/20" style={{ background: "rgba(239,68,68,0.05)" }}>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-[11px] text-red-400/70 mt-0.5">
                          Venceu em {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {overdueTasks.length > 6 && (
                  <p className="text-[11px] text-white/30 text-center pt-1">+{overdueTasks.length - 6} outras tarefas atrasadas</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/30">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Nenhuma tarefa atrasada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financeiro: comparativo do mês + próximos vencimentos */}
      <Card className="border-white/5" style={{ background: "hsl(220,25%,10%)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <DollarSign className="h-4.5 w-4.5 text-yellow-400" />
            Financeiro — Resumo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFinancial ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Comparativo a pagar vs a receber */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3 border border-red-500/20" style={{ background: "rgba(239,68,68,0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs text-white/50">A Pagar (mês)</span>
                  </div>
                  <p className="text-lg font-bold text-red-400">{formatCurrency(monthPayable)}</p>
                </div>
                <div className="rounded-lg p-3 border border-green-500/20" style={{ background: "rgba(34,197,94,0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs text-white/50">A Receber (mês)</span>
                  </div>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(monthReceivable)}</p>
                </div>
              </div>

              {/* Próximos vencimentos */}
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Próximos Vencimentos (7 dias)</p>
                {sortedUpcomingAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {sortedUpcomingAccounts.slice(0, 6).map(acc => (
                      <div key={acc.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-white/5" style={{ background: "hsl(220,25%,13%)" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${acc.type === 'payable' ? 'bg-red-400' : 'bg-green-400'}`} />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{acc.description}</p>
                            <p className="text-[11px] text-white/40">
                              {new Date(acc.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              {acc.supplierName ? ` · ${acc.supplierName}` : acc.clientName ? ` · ${acc.clientName}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium shrink-0 ${acc.type === 'payable' ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCurrency(acc.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-white/30">
                    <CheckCircle2 className="h-7 w-7 mb-2 opacity-40" />
                    <p className="text-xs">Nenhum vencimento nos próximos 7 dias</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descontos conseguidos com fornecedores */}
      <Card className="border-white/5" style={{ background: "hsl(220,25%,10%)" }}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <TrendingDown className="h-4.5 w-4.5 text-green-400" />
              Descontos com Fornecedores
            </CardTitle>
            {!isLoadingDiscounts && totalSaved > 0 && (
              <span className="text-sm font-bold text-green-400">{formatCurrency(totalSaved)} economizados</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDiscounts ? (
            <Skeleton className="h-[220px] w-full" />
          ) : discountChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={discountChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                <RechartsTooltip formatter={(v: any) => formatCurrency(v)} cursor={{ stroke: "rgba(255,255,255,0.1)" }} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'hsl(220,25%,13%)' }} />
                <Line type="monotone" dataKey="savedAmount" name="Economizado" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-white/30">
              <TrendingDown className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma cotação aprovada com desconto ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
