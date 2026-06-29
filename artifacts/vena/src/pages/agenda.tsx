import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, CheckCircle2, Circle, AlertTriangle, Trash2, ChevronLeft, ChevronRight, ListTodo, User } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}/api/agenda${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function authFetch(path: string) {
  const res = await fetch(`${API}/api/auth${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Task = {
  id: number; title: string; description?: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  status: "pendente" | "em_andamento" | "concluida" | "cancelada";
  due_date?: string; assigned_to?: number; assigned_name?: string; client_name?: string;
};

type Appointment = {
  id: number; title: string; description?: string;
  start_time: string; end_time?: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  type: string; assigned_to?: number; assigned_name?: string; client_name?: string; project_name?: string;
};

type UserOption = { id: number; name: string };

const PRIORITY_CONFIG = {
  urgente: { label: "Urgente", color: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
  alta:    { label: "Alta",    color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  media:   { label: "Média",   color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  baixa:   { label: "Baixa",   color: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" },
};

const STATUS_CONFIG = {
  pendente:     { label: "Pendente",     color: "text-white/50" },
  em_andamento: { label: "Em andamento", color: "text-blue-400" },
  concluida:    { label: "Concluída",    color: "text-green-400" },
  cancelada:    { label: "Cancelada",    color: "text-red-400" },
};

const APPOINTMENT_TYPES = ["reuniao", "visita", "ligacao", "entrega", "vistoria", "outro"];

const UNASSIGNED = "none";

export function Agenda() {
  const [view, setView] = useState<"calendario" | "timeline" | "tarefas">("tarefas");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filtro: "all" = todo mundo, ou o id do usuário cuja agenda queremos ver
  const [agendaFilter, setAgendaFilter] = useState<string>("all");

  const [openNewTask, setOpenNewTask] = useState(false);
  const [openNewAppointment, setOpenNewAppointment] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "media", due_date: "", assigned_to: UNASSIGNED });
  const [appointmentForm, setAppointmentForm] = useState({ title: "", description: "", start_time: "", end_time: "", priority: "media", type: "reuniao", assigned_to: UNASSIGNED });

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { loadData(); }, [agendaFilter]);

  async function loadUsers() {
    try {
      const u = await authFetch("/users");
      setUsers(u.map((x: any) => ({ id: x.id, name: x.name })));
    } catch (e) { console.error(e); }
  }

  async function loadData() {
    setLoading(true);
    try {
      const suffix = agendaFilter !== "all" ? `?assigned_to=${agendaFilter}` : "";
      const [t, a] = await Promise.all([apiFetch(`/tasks${suffix}`), apiFetch(`/appointments${suffix}`)]);
      setTasks(t);
      setAppointments(a);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function toApiAssignedTo(value: string) {
    return value === UNASSIGNED ? null : Number(value);
  }

  async function createTask() {
    await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ ...taskForm, assigned_to: toApiAssignedTo(taskForm.assigned_to) }),
    });
    setOpenNewTask(false);
    setTaskForm({ title: "", description: "", priority: "media", due_date: "", assigned_to: UNASSIGNED });
    loadData();
  }

  async function createAppointment() {
    await apiFetch("/appointments", {
      method: "POST",
      body: JSON.stringify({ ...appointmentForm, assigned_to: toApiAssignedTo(appointmentForm.assigned_to) }),
    });
    setOpenNewAppointment(false);
    setAppointmentForm({ title: "", description: "", start_time: "", end_time: "", priority: "media", type: "reuniao", assigned_to: UNASSIGNED });
    loadData();
  }

  async function updateTaskStatus(id: number, status: string) {
    await apiFetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    loadData();
  }

  async function deleteTask(id: number) {
    await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    loadData();
  }

  async function deleteAppointment(id: number) {
    await apiFetch(`/appointments/${id}`, { method: "DELETE" });
    loadData();
  }

  // Calendário
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  }

  function getAppointmentsForDay(day: number) {
    return appointments.filter(a => {
      const d = new Date(a.start_time);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const urgentTasks = tasks.filter(t => t.priority === 'urgente' && t.status !== 'concluida' && t.status !== 'cancelada');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Agenda</h2>
          <p className="text-white/50 text-sm mt-1">Tarefas, compromissos e linha do tempo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro: de quem é a agenda */}
          <Select value={agendaFilter} onValueChange={setAgendaFilter}>
            <SelectTrigger className="w-44 border-white/10 bg-white/5 text-white">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-white/40" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
              <SelectItem value="all">Todos</SelectItem>
              {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Toggle de visão */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {[
              { key: "tarefas", label: "Tarefas", icon: ListTodo },
              { key: "calendario", label: "Calendário", icon: Calendar },
              { key: "timeline", label: "Linha do Tempo", icon: Clock },
            ].map(v => (
              <button key={v.key} onClick={() => setView(v.key as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${view === v.key ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <v.icon className="h-3.5 w-3.5" />{v.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setOpenNewTask(true)} variant="outline" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5">
            <Plus className="h-4 w-4 mr-1" /> Tarefa
          </Button>
          <Button onClick={() => setOpenNewAppointment(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-1" /> Compromisso
          </Button>
        </div>
      </div>

      {/* Alertas urgentes */}
      {urgentTasks.length > 0 && (
        <div className="rounded-xl border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.05)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">{urgentTasks.length} tarefa(s) urgente(s)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {urgentTasks.map(t => (
              <Badge key={t.id} variant="outline" className="bg-red-500/10 text-red-300 border-red-500/20 text-xs">
                🔴 {t.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* View: Tarefas */}
      {view === "tarefas" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-white/30 text-center py-20">Carregando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma tarefa cadastrada.</p>
            </div>
          ) : (
            ["urgente", "alta", "media", "baixa"].map(priority => {
              const grouped = tasks.filter(t => t.priority === priority);
              if (grouped.length === 0) return null;
              const cfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{cfg.label}</span>
                    <span className="text-xs text-white/20">({grouped.length})</span>
                  </div>
                  <div className="space-y-2">
                    {grouped.map(task => (
                      <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${task.status === 'concluida' ? 'opacity-50 border-white/5' : 'border-white/5 hover:border-orange-500/20'}`}
                        style={{ background: "hsl(220,25%,11%)" }}>
                        <button onClick={() => updateTaskStatus(task.id, task.status === 'concluida' ? 'pendente' : 'concluida')}
                          className="shrink-0 text-white/30 hover:text-green-400 transition-colors">
                          {task.status === 'concluida' ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Circle className="h-5 w-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === 'concluida' ? 'line-through text-white/30' : 'text-white'}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {task.due_date && (
                              <span className="text-xs text-white/30 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {task.client_name && <span className="text-xs text-white/30">👤 {task.client_name}</span>}
                            {task.assigned_name && (
                              <span className="text-xs text-blue-400/70 flex items-center gap-1">
                                <User className="h-3 w-3" /> {task.assigned_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                          <Badge variant="outline" className={`text-[10px] border-white/10 ${STATUS_CONFIG[task.status].color}`}>
                            {STATUS_CONFIG[task.status].label}
                          </Badge>
                          <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View: Calendário */}
      {view === "calendario" && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "hsl(220,25%,11%)" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-medium text-white capitalize">{monthName}</h3>
            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="p-2 text-center text-xs font-medium text-white/30">{d}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7">
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r border-white/5" />
            ))}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dayAppts = getAppointmentsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              return (
                <div key={day} className={`h-24 border-b border-r border-white/5 p-1.5 transition-all hover:bg-white/3 ${isToday ? 'bg-orange-500/5' : ''}`}>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white' : 'text-white/50'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 2).map(a => {
                      const cfg = PRIORITY_CONFIG[a.priority];
                      return (
                        <div key={a.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${cfg.color}`}>
                          {a.title}
                        </div>
                      );
                    })}
                    {dayAppts.length > 2 && <div className="text-[10px] text-white/30 px-1">+{dayAppts.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: Linha do Tempo */}
      {view === "timeline" && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-white/30 text-center py-20">Carregando...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum compromisso cadastrado.</p>
            </div>
          ) : (
            appointments.map(appt => {
              const cfg = PRIORITY_CONFIG[appt.priority];
              const date = new Date(appt.start_time);
              return (
                <div key={appt.id} className="flex gap-4 group">
                  {/* Data */}
                  <div className="flex flex-col items-center w-16 shrink-0">
                    <div className="text-2xl font-bold text-white">{date.getDate().toString().padStart(2, '0')}</div>
                    <div className="text-xs text-white/30 capitalize">{date.toLocaleDateString('pt-BR', { month: 'short' })}</div>
                    <div className="flex-1 w-px bg-white/5 mt-2" />
                  </div>
                  {/* Card */}
                  <div className={`flex-1 mb-4 p-4 rounded-xl border transition-all ${cfg.color.includes('red') ? 'border-red-500/20' : cfg.color.includes('orange') ? 'border-orange-500/20' : cfg.color.includes('yellow') ? 'border-yellow-500/20' : 'border-green-500/20'}`}
                    style={{ background: "hsl(220,25%,11%)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{appt.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {appt.end_time && ` → ${new Date(appt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                          {appt.client_name && <span className="text-xs text-white/30">👤 {appt.client_name}</span>}
                          {appt.project_name && <span className="text-xs text-white/30">🏗️ {appt.project_name}</span>}
                          {appt.assigned_name && (
                            <span className="text-xs text-blue-400/70 flex items-center gap-1">
                              <User className="h-3 w-3" /> {appt.assigned_name}
                            </span>
                          )}
                        </div>
                        {appt.description && <p className="text-xs text-white/40 mt-2">{appt.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                        <button onClick={() => deleteAppointment(appt.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Nova Tarefa */}
      <Dialog open={openNewTask} onOpenChange={setOpenNewTask}>
        <DialogContent className="max-w-md border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader><DialogTitle className="text-white">Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Título *</Label>
              <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Descrição da tarefa" className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Descrição</Label>
              <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes..." className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white/60 text-xs">Prioridade</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-white/60 text-xs">Prazo</Label>
                <Input type="datetime-local" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Atribuir a</Label>
              <Select value={taskForm.assigned_to} onValueChange={v => setTaskForm(f => ({ ...f, assigned_to: v }))}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                  <SelectItem value={UNASSIGNED}>Ninguém</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewTask(false)} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={createTask} disabled={!taskForm.title} className="bg-orange-500 hover:bg-orange-600 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Compromisso */}
      <Dialog open={openNewAppointment} onOpenChange={setOpenNewAppointment}>
        <DialogContent className="max-w-md border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader><DialogTitle className="text-white">Novo Compromisso</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Título *</Label>
              <Input value={appointmentForm.title} onChange={e => setAppointmentForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Reunião com cliente" className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Descrição</Label>
              <Textarea value={appointmentForm.description} onChange={e => setAppointmentForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes..." className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white/60 text-xs">Início *</Label>
                <Input type="datetime-local" value={appointmentForm.start_time} onChange={e => setAppointmentForm(f => ({ ...f, start_time: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-white/60 text-xs">Fim</Label>
                <Input type="datetime-local" value={appointmentForm.end_time} onChange={e => setAppointmentForm(f => ({ ...f, end_time: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white/60 text-xs">Prioridade</Label>
                <Select value={appointmentForm.priority} onValueChange={v => setAppointmentForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-white/60 text-xs">Tipo</Label>
                <Select value={appointmentForm.type} onValueChange={v => setAppointmentForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                    {APPOINTMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Atribuir a</Label>
              <Select value={appointmentForm.assigned_to} onValueChange={v => setAppointmentForm(f => ({ ...f, assigned_to: v }))}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                  <SelectItem value={UNASSIGNED}>Ninguém</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewAppointment(false)} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={createAppointment} disabled={!appointmentForm.title || !appointmentForm.start_time} className="bg-orange-500 hover:bg-orange-600 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
