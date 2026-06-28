import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Phone, Mail, FileText, Clock, User, Trash2, Edit, GripVertical, X } from "lucide-react";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.VITE_API_URL ?? "");

type Column = { id: number; name: string; color: string; position: number };
type Client = {
  id: number; name: string; phone?: string; email?: string;
  cpf_cnpj?: string; address?: string; origin?: string; notes?: string;
  column_id: number; position: number; column_name?: string; column_color?: string;
};
type HistoryEntry = { id: number; type: string; description: string; created_at: string; user_name?: string };

const API = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}/api/crm${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function CRM() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Modais
  const [openNewClient, setOpenNewClient] = useState(false);
  const [openNewColumn, setOpenNewColumn] = useState(false);
  const [openEditColumn, setOpenEditColumn] = useState<Column | null>(null);
  const [openClientDetail, setOpenClientDetail] = useState<number | null>(null);
  const [clientDetail, setClientDetail] = useState<Client & { history?: HistoryEntry[] } | null>(null);
  const [newNote, setNewNote] = useState("");

  // Forms
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "", cpf_cnpj: "", address: "", origin: "", notes: "", column_id: 0 });
  const [columnForm, setColumnForm] = useState({ name: "", color: "#F97316" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cols, cls] = await Promise.all([apiFetch("/columns"), apiFetch("/clients")]);
      setColumns(cols);
      setClients(cls);
      if (cols.length > 0 && clientForm.column_id === 0) {
        setClientForm(f => ({ ...f, column_id: cols[0].id }));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadClientDetail(id: number) {
    const data = await apiFetch(`/clients/${id}`);
    setClientDetail(data);
  }

  async function createClient() {
    await apiFetch("/clients", { method: "POST", body: JSON.stringify(clientForm) });
    setOpenNewClient(false);
    setClientForm({ name: "", phone: "", email: "", cpf_cnpj: "", address: "", origin: "", notes: "", column_id: columns[0]?.id ?? 0 });
    loadData();
  }

  async function createColumn() {
    await apiFetch("/columns", { method: "POST", body: JSON.stringify(columnForm) });
    setOpenNewColumn(false);
    setColumnForm({ name: "", color: "#F97316" });
    loadData();
  }

  async function updateColumn() {
    if (!openEditColumn) return;
    await apiFetch(`/columns/${openEditColumn.id}`, { method: "PATCH", body: JSON.stringify(columnForm) });
    setOpenEditColumn(null);
    loadData();
  }

  async function deleteColumn(id: number) {
    await apiFetch(`/columns/${id}`, { method: "DELETE" });
    loadData();
  }

  async function moveClient(clientId: number, newColumnId: number) {
    await apiFetch(`/clients/${clientId}`, { method: "PATCH", body: JSON.stringify({ column_id: newColumnId }) });
    loadData();
  }

  async function addNote() {
    if (!clientDetail || !newNote.trim()) return;
    await apiFetch(`/clients/${clientDetail.id}/history`, {
      method: "POST",
      body: JSON.stringify({ type: "anotacao", description: newNote }),
    });
    setNewNote("");
    loadClientDetail(clientDetail.id);
  }

  async function deleteClient(id: number) {
    await apiFetch(`/clients/${id}`, { method: "DELETE" });
    setOpenClientDetail(null);
    setClientDetail(null);
    loadData();
  }

  // Drag and drop
  function handleDragStart(clientId: number) { setDragging(clientId); }
  function handleDragOver(e: React.DragEvent, columnId: number) { e.preventDefault(); setDragOver(columnId); }
  function handleDrop(columnId: number) {
    if (dragging !== null) moveClient(dragging, columnId);
    setDragging(null);
    setDragOver(null);
  }

  const typeIcon: Record<string, string> = {
    criacao: "🆕", movimentacao: "🔄", anotacao: "📝", compra: "🛒", obra: "🏗️"
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">CRM de Clientes</h2>
          <p className="text-white/50 text-sm mt-1">Gerencie seus clientes e negociações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenNewColumn(true)} className="border-white/10 text-white/70 hover:text-white hover:bg-white/5">
            <Settings className="h-4 w-4 mr-2" /> Gerenciar Colunas
          </Button>
          <Button onClick={() => setOpenNewClient(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="text-white/30 text-center py-20">Carregando...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const colClients = clients.filter(c => c.column_id === col.id);
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-72 rounded-xl border transition-all ${dragOver === col.id ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5'}`}
                style={{ background: "hsl(220,25%,11%)" }}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Header da coluna */}
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-medium text-white">{col.name}</span>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 px-1.5">{colClients.length}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white" onClick={() => { setOpenEditColumn(col); setColumnForm({ name: col.name, color: col.color }); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400" onClick={() => deleteColumn(col.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-32">
                  {colClients.map(client => (
                    <div
                      key={client.id}
                      draggable
                      onDragStart={() => handleDragStart(client.id)}
                      onClick={() => { setOpenClientDetail(client.id); loadClientDetail(client.id); }}
                      className="rounded-lg p-3 border border-white/5 cursor-pointer hover:border-orange-500/30 transition-all group"
                      style={{ background: "hsl(220,25%,14%)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-white/20 group-hover:text-white/40 shrink-0" />
                          <span className="text-sm font-medium text-white">{client.name}</span>
                        </div>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1.5 mt-2 ml-5">
                          <Phone className="h-3 w-3 text-white/30" />
                          <span className="text-xs text-white/40">{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1.5 mt-1 ml-5">
                          <Mail className="h-3 w-3 text-white/30" />
                          <span className="text-xs text-white/40 truncate">{client.email}</span>
                        </div>
                      )}
                      {client.origin && (
                        <div className="mt-2 ml-5">
                          <Badge variant="outline" className="text-[10px] border-white/10 text-white/30">{client.origin}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                  {colClients.length === 0 && (
                    <div className="text-center text-white/20 text-xs py-6">Arraste um cliente aqui</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Botão nova coluna */}
          <div className="flex-shrink-0 w-72">
            <Button variant="outline" onClick={() => setOpenNewColumn(true)}
              className="w-full h-12 border-dashed border-white/10 text-white/30 hover:text-white hover:border-white/20 hover:bg-white/5">
              <Plus className="h-4 w-4 mr-2" /> Nova Coluna
            </Button>
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      <Dialog open={openNewClient} onOpenChange={setOpenNewClient}>
        <DialogContent className="max-w-md border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader><DialogTitle className="text-white">Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: "Nome *", key: "name", placeholder: "Nome do cliente" },
              { label: "Telefone", key: "phone", placeholder: "(00) 00000-0000" },
              { label: "E-mail", key: "email", placeholder: "email@exemplo.com" },
              { label: "CPF/CNPJ", key: "cpf_cnpj", placeholder: "000.000.000-00" },
              { label: "Endereço", key: "address", placeholder: "Rua, número, cidade" },
              { label: "Origem", key: "origin", placeholder: "Ex: Indicação, Instagram..." },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-white/60 text-xs">{f.label}</Label>
                <Input placeholder={f.placeholder} value={(clientForm as any)[f.key]}
                  onChange={e => setClientForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Coluna</Label>
              <select value={clientForm.column_id} onChange={e => setClientForm(cf => ({ ...cf, column_id: Number(e.target.value) }))}
                className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm">
                {columns.map(c => <option key={c.id} value={c.id} style={{ background: "#1a2332" }}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Observações</Label>
              <Textarea placeholder="Anotações iniciais..." value={clientForm.notes}
                onChange={e => setClientForm(cf => ({ ...cf, notes: e.target.value }))}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewClient(false)} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={createClient} disabled={!clientForm.name} className="bg-orange-500 hover:bg-orange-600 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova/Editar Coluna */}
      <Dialog open={openNewColumn || !!openEditColumn} onOpenChange={(o) => { if (!o) { setOpenNewColumn(false); setOpenEditColumn(null); } }}>
        <DialogContent className="max-w-sm border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader><DialogTitle className="text-white">{openEditColumn ? "Editar Coluna" : "Nova Coluna"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Nome</Label>
              <Input value={columnForm.name} onChange={e => setColumnForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Em negociação" className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Cor</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={columnForm.color} onChange={e => setColumnForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-white/40 text-sm">{columnForm.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenNewColumn(false); setOpenEditColumn(null); }} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={openEditColumn ? updateColumn : createColumn} disabled={!columnForm.name} className="bg-orange-500 hover:bg-orange-600 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhe Cliente */}
      <Dialog open={!!openClientDetail} onOpenChange={(o) => { if (!o) { setOpenClientDetail(null); setClientDetail(null); } }}>
        <DialogContent className="max-w-lg border-white/10 max-h-[85vh] overflow-y-auto" style={{ background: "hsl(220,25%,11%)" }}>
          {clientDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-white">{clientDetail.name}</DialogTitle>
                  <Button variant="ghost" size="icon" onClick={() => deleteClient(clientDetail.id)} className="text-white/30 hover:text-red-400 h-7 w-7">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Informações */}
                <div className="grid grid-cols-2 gap-3">
                  {clientDetail.phone && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/5">
                      <Phone className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span className="text-xs text-white/70">{clientDetail.phone}</span>
                    </div>
                  )}
                  {clientDetail.email && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/5">
                      <Mail className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span className="text-xs text-white/70 truncate">{clientDetail.email}</span>
                    </div>
                  )}
                  {clientDetail.cpf_cnpj && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/5">
                      <FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span className="text-xs text-white/70">{clientDetail.cpf_cnpj}</span>
                    </div>
                  )}
                  {clientDetail.origin && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/5">
                      <User className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span className="text-xs text-white/70">{clientDetail.origin}</span>
                    </div>
                  )}
                </div>
                {clientDetail.address && (
                  <p className="text-xs text-white/50 px-1">📍 {clientDetail.address}</p>
                )}
                {clientDetail.notes && (
                  <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                    <p className="text-xs text-white/50 mb-1">Observações</p>
                    <p className="text-sm text-white/70">{clientDetail.notes}</p>
                  </div>
                )}

                {/* Nova anotação */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Adicionar anotação</Label>
                  <Textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="Digite uma atualização ou anotação..."
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none" rows={2} />
                  <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
                    Adicionar
                  </Button>
                </div>

                {/* Histórico */}
                {clientDetail.history && clientDetail.history.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Histórico
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {clientDetail.history.map(h => (
                        <div key={h.id} className="flex gap-3 p-2 rounded-lg border border-white/5 bg-white/5">
                          <span className="text-base">{typeIcon[h.type] ?? "📌"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/70">{h.description}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">
                              {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              {h.user_name ? ` · ${h.user_name}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
