import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Phone, Mail, FileText, Clock, User, Trash2, Edit, GripVertical, Check, X } from "lucide-react";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.VITE_API_URL ?? "");

type Column = { id: number; name: string; color: string; position: number };
type Client = {
  id: number; name: string; phone?: string; celular?: string; email?: string;
  cpf_cnpj?: string; address?: string; origin?: string; notes?: string;
  column_id: number; position: number; column_name?: string; column_color?: string;
  // campos extras importados
  rg?: string; orgao_expedidor?: string; data_nascimento?: string; uc?: string;
  nacionalidade?: string; cnh?: string; estado_civil?: string; nome_mae?: string;
  razao_social?: string; nome_fantasia?: string; enquadramento?: string;
  inscricao_municipal?: string; inscricao_estadual?: string;
  data_abertura_empresa?: string; cnae?: string; faturamento_12m?: string;
  tipo_projeto?: string;
};
type HistoryEntry = { id: number; type: string; description: string; created_at: string; user_name?: string };

const API = import.meta.env.VITE_API_URL ?? "";

// Remove qualquer trecho "Anexo: ..." que tenha vindo de importações antigas,
// para que anexos nunca apareçam na UI, mesmo que ainda existam no texto salvo.
function stripAnexos(notes?: string | null) {
  if (!notes) return "";
  return notes
    .split("|")
    .map(s => s.trim())
    .filter(s => s && !/^anexo:/i.test(s))
    .join(" ");
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}/api/crm${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function InfoRow({ icon, label, value, span }: { icon: React.ReactNode; label: string; value: string; span?: boolean }) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg border border-white/5 bg-white/5 ${span ? "col-span-2" : ""}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-white/30">{label}</p>
        <p className="text-xs text-white/70 break-words">{value}</p>
      </div>
    </div>
  );
}

export function CRM() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Drag-to-scroll do board (arrastar com o mouse em vez de usar a scrollbar)
  const boardRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, scrollLeft: 0 });
  const movedWhilePanning = useRef(false);

  function handleBoardMouseDown(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('[draggable="true"], button, input, select, textarea')) return;
    if (!boardRef.current) return;
    isPanning.current = true;
    movedWhilePanning.current = false;
    panStart.current = { x: e.clientX, scrollLeft: boardRef.current.scrollLeft };
  }

  function handleBoardMouseMove(e: React.MouseEvent) {
    if (!isPanning.current || !boardRef.current) return;
    const dx = e.clientX - panStart.current.x;
    if (Math.abs(dx) > 3) movedWhilePanning.current = true;
    boardRef.current.scrollLeft = panStart.current.scrollLeft - dx;
  }

  function endBoardPan() {
    isPanning.current = false;
  }

  function handleBoardClickCapture(e: React.MouseEvent) {
    if (movedWhilePanning.current) {
      e.stopPropagation();
      movedWhilePanning.current = false;
    }
  }

  // Modais
  const [openNewClient, setOpenNewClient] = useState(false);
  const [openNewColumn, setOpenNewColumn] = useState(false);
  const [openEditColumn, setOpenEditColumn] = useState<Column | null>(null);
  const [openClientDetail, setOpenClientDetail] = useState<number | null>(null);
  const [clientDetail, setClientDetail] = useState<Client & { history?: HistoryEntry[] } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [editingClient, setEditingClient] = useState(false);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);

  // Forms
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "", cpf_cnpj: "", address: "", origin: "", notes: "", column_id: 0 });
  const [editForm, setEditForm] = useState({
    name: "", phone: "", celular: "", email: "", cpf_cnpj: "", address: "", origin: "", notes: "",
    rg: "", orgao_expedidor: "", data_nascimento: "", uc: "", nacionalidade: "",
    cnh: "", estado_civil: "", nome_mae: "", razao_social: "", nome_fantasia: "",
    enquadramento: "", inscricao_municipal: "", inscricao_estadual: "",
    data_abertura_empresa: "", cnae: "", faturamento_12m: "", tipo_projeto: "",
  });
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
    setEditForm({
      name: data.name ?? "",
      phone: data.phone ?? "",
      celular: data.celular ?? "",
      email: data.email ?? "",
      cpf_cnpj: data.cpf_cnpj ?? "",
      address: data.address ?? "",
      origin: data.origin ?? "",
      notes: stripAnexos(data.notes),
      rg: data.rg ?? "",
      orgao_expedidor: data.orgao_expedidor ?? "",
      data_nascimento: data.data_nascimento ?? "",
      uc: data.uc ?? "",
      nacionalidade: data.nacionalidade ?? "",
      cnh: data.cnh ?? "",
      estado_civil: data.estado_civil ?? "",
      nome_mae: data.nome_mae ?? "",
      razao_social: data.razao_social ?? "",
      nome_fantasia: data.nome_fantasia ?? "",
      enquadramento: data.enquadramento ?? "",
      inscricao_municipal: data.inscricao_municipal ?? "",
      inscricao_estadual: data.inscricao_estadual ?? "",
      data_abertura_empresa: data.data_abertura_empresa ?? "",
      cnae: data.cnae ?? "",
      faturamento_12m: data.faturamento_12m ?? "",
      tipo_projeto: data.tipo_projeto ?? "",
    });
    setEditingClient(false);
    setConfirmDeleteClient(false);
  }

  async function createClient() {
    await apiFetch("/clients", { method: "POST", body: JSON.stringify(clientForm) });
    setOpenNewClient(false);
    setClientForm({ name: "", phone: "", email: "", cpf_cnpj: "", address: "", origin: "", notes: "", column_id: columns[0]?.id ?? 0 });
    loadData();
  }

  async function saveClientEdit() {
    if (!clientDetail) return;
    await apiFetch(`/clients/${clientDetail.id}`, { method: "PATCH", body: JSON.stringify(editForm) });
    setEditingClient(false);
    await loadClientDetail(clientDetail.id);
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
    setConfirmDeleteClient(false);
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

  const editFields: { label: string; key: keyof typeof editForm; placeholder: string; section?: string }[] = [
    { label: "Nome", key: "name", placeholder: "Nome do cliente", section: "Dados Pessoais" },
    { label: "Telefone", key: "phone", placeholder: "(00) 00000-0000" },
    { label: "Celular", key: "celular", placeholder: "(00) 00000-0000" },
    { label: "E-mail", key: "email", placeholder: "email@exemplo.com" },
    { label: "CPF", key: "cpf_cnpj", placeholder: "000.000.000-00" },
    { label: "RG", key: "rg", placeholder: "00.000.000-0" },
    { label: "Órgão Expedidor", key: "orgao_expedidor", placeholder: "SSP/GO" },
    { label: "Data de Nascimento", key: "data_nascimento", placeholder: "DD/MM/AAAA" },
    { label: "Nacionalidade", key: "nacionalidade", placeholder: "Brasileiro(a)" },
    { label: "Estado Civil", key: "estado_civil", placeholder: "Solteiro(a), Casado(a)..." },
    { label: "Nome da Mãe", key: "nome_mae", placeholder: "Nome completo da mãe" },
    { label: "CNH", key: "cnh", placeholder: "Número da CNH" },
    { label: "Endereço", key: "address", placeholder: "Rua, número, cidade" },
    { label: "UC (Unidade Consumidora)", key: "uc", placeholder: "Número da UC" },
    { label: "Origem", key: "origin", placeholder: "Ex: Indicação, Instagram...", section: "Comercial" },
    { label: "Tipo de Projeto", key: "tipo_projeto", placeholder: "Ex: Residencial, Comercial..." },
    { label: "Razão Social", key: "razao_social", placeholder: "Razão social da empresa", section: "Empresa" },
    { label: "Nome Fantasia", key: "nome_fantasia", placeholder: "Nome fantasia" },
    { label: "CNPJ", key: "cpf_cnpj", placeholder: "00.000.000/0000-00" },
    { label: "Enquadramento", key: "enquadramento", placeholder: "MEI, ME, EPP..." },
    { label: "Inscrição Municipal", key: "inscricao_municipal", placeholder: "Número" },
    { label: "Inscrição Estadual", key: "inscricao_estadual", placeholder: "Número" },
    { label: "Data de Abertura", key: "data_abertura_empresa", placeholder: "DD/MM/AAAA" },
    { label: "CNAE", key: "cnae", placeholder: "Código CNAE" },
    { label: "Faturamento 12m", key: "faturamento_12m", placeholder: "R$ 0,00" },
  ];

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
        <div
          ref={boardRef}
          onMouseDown={handleBoardMouseDown}
          onMouseMove={handleBoardMouseMove}
          onMouseUp={endBoardPan}
          onMouseLeave={endBoardPan}
          onClickCapture={handleBoardClickCapture}
          className="flex gap-4 overflow-x-auto pb-4 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ cursor: "grab" }}
        >
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
                      className="group relative rounded-lg p-3 border border-white/5 cursor-pointer hover:border-orange-500/30 transition-all"
                      style={{ background: "hsl(220,25%,14%)" }}
                    >
                      {/* Ações rápidas, aparecem só no hover */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenClientDetail(client.id); loadClientDetail(client.id).then(() => setEditingClient(true)); }}
                          className="h-5 w-5 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir o cliente "${client.name}"? Essa ação não pode ser desfeita.`)) {
                              deleteClient(client.id);
                            }
                          }}
                          className="h-5 w-5 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-white/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pr-10">
                        <GripVertical className="h-3 w-3 text-white/20 group-hover:text-white/40 shrink-0" />
                        <span className="text-sm font-medium text-white truncate">{client.name}</span>
                      </div>

                      {(client.phone || client.email) && (
                        <div className="mt-2 ml-5 space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-white/30 shrink-0" />
                              <span className="text-xs text-white/40">{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-white/30 shrink-0" />
                              <span className="text-xs text-white/40 truncate">{client.email}</span>
                            </div>
                          )}
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

      {/* Modal Detalhe / Edição Cliente */}
      <Dialog open={!!openClientDetail} onOpenChange={(o) => { if (!o) { setOpenClientDetail(null); setClientDetail(null); setEditingClient(false); setConfirmDeleteClient(false); } }}>
        <DialogContent className="max-w-lg border-white/10 max-h-[85vh] overflow-y-auto" style={{ background: "hsl(220,25%,11%)" }}>
          {clientDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  {editingClient ? (
                    <Input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="border-white/10 bg-white/5 text-white text-base font-semibold h-8"
                    />
                  ) : (
                    <DialogTitle className="text-white">{clientDetail.name}</DialogTitle>
                  )}
                  <div className="flex gap-1 shrink-0">
                    {editingClient ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={saveClientEdit} disabled={!editForm.name.trim()} className="text-green-400 hover:text-green-300 h-7 w-7">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingClient(false); loadClientDetail(clientDetail.id); }} className="text-white/30 hover:text-white h-7 w-7">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => setEditingClient(true)} className="text-white/30 hover:text-white h-7 w-7">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteClient(true)} className="text-white/30 hover:text-red-400 h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Confirmação de exclusão */}
              {confirmDeleteClient && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-between gap-3">
                  <p className="text-xs text-red-200">Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.</p>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDeleteClient(false)} className="border-white/10 text-white/60 h-7">Cancelar</Button>
                    <Button size="sm" onClick={() => deleteClient(clientDetail.id)} className="bg-red-500 hover:bg-red-600 text-white h-7">Excluir</Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 py-2">
                {editingClient ? (
                  /* ---- Modo edição ---- */
                  <div className="space-y-4">
                    {(() => {
                      const fieldsToRender = editFields.filter(f => f.key !== "name");
                      const seen = new Set<string>();
                      return fieldsToRender.map((f, i) => {
                        const isDupe = seen.has(f.key);
                        seen.add(f.key);
                        if (isDupe) return null;
                        return (
                          <div key={`${f.key}-${i}`}>
                            {f.section && (
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 mt-2 border-b border-white/5 pb-1">
                                {f.section}
                              </p>
                            )}
                            <div className="space-y-1">
                              <Label className="text-white/60 text-xs">{f.label}</Label>
                              <Input
                                placeholder={f.placeholder}
                                value={editForm[f.key]}
                                onChange={e => setEditForm(ef => ({ ...ef, [f.key]: e.target.value }))}
                                className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div className="space-y-1">
                      <Label className="text-white/60 text-xs">Observações</Label>
                      <Textarea
                        value={editForm.notes}
                        onChange={e => setEditForm(ef => ({ ...ef, notes: e.target.value }))}
                        className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  /* ---- Modo leitura ---- */
                  <>
                    {/* Contato */}
                    {(clientDetail.phone || clientDetail.celular || clientDetail.email) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">Contato</p>
                        <div className="grid grid-cols-2 gap-2">
                          {clientDetail.phone && <InfoRow icon={<Phone className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Telefone" value={clientDetail.phone} />}
                          {clientDetail.celular && <InfoRow icon={<Phone className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Celular" value={clientDetail.celular} />}
                          {clientDetail.email && <InfoRow icon={<Mail className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="E-mail" value={clientDetail.email} span />}
                        </div>
                      </div>
                    )}

                    {/* Dados Pessoais */}
                    {(clientDetail.cpf_cnpj || clientDetail.rg || clientDetail.data_nascimento || clientDetail.nacionalidade || clientDetail.estado_civil || clientDetail.nome_mae || clientDetail.cnh || clientDetail.uc) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">Dados Pessoais</p>
                        <div className="grid grid-cols-2 gap-2">
                          {clientDetail.cpf_cnpj && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="CPF" value={clientDetail.cpf_cnpj} />}
                          {clientDetail.rg && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="RG" value={`${clientDetail.rg}${clientDetail.orgao_expedidor ? ' / ' + clientDetail.orgao_expedidor : ''}`} />}
                          {clientDetail.data_nascimento && <InfoRow icon={<Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Nascimento" value={clientDetail.data_nascimento} />}
                          {clientDetail.nacionalidade && <InfoRow icon={<User className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Nacionalidade" value={clientDetail.nacionalidade} />}
                          {clientDetail.estado_civil && <InfoRow icon={<User className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Estado Civil" value={clientDetail.estado_civil} />}
                          {clientDetail.nome_mae && <InfoRow icon={<User className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Nome da Mãe" value={clientDetail.nome_mae} span />}
                          {clientDetail.cnh && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="CNH" value={clientDetail.cnh} />}
                          {clientDetail.uc && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="UC" value={clientDetail.uc} />}
                        </div>
                      </div>
                    )}

                    {/* Endereço */}
                    {clientDetail.address && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">Endereço</p>
                        <p className="text-xs text-white/60 px-1">📍 {clientDetail.address}</p>
                      </div>
                    )}

                    {/* Comercial */}
                    {(clientDetail.origin || clientDetail.tipo_projeto) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">Comercial</p>
                        <div className="grid grid-cols-2 gap-2">
                          {clientDetail.origin && <InfoRow icon={<User className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Origem" value={clientDetail.origin} />}
                          {clientDetail.tipo_projeto && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Tipo de Projeto" value={clientDetail.tipo_projeto} />}
                        </div>
                      </div>
                    )}

                    {/* Empresa */}
                    {(clientDetail.razao_social || clientDetail.nome_fantasia || clientDetail.enquadramento || clientDetail.cnae || clientDetail.inscricao_municipal || clientDetail.inscricao_estadual || clientDetail.data_abertura_empresa || clientDetail.faturamento_12m) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">Empresa</p>
                        <div className="grid grid-cols-2 gap-2">
                          {clientDetail.razao_social && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Razão Social" value={clientDetail.razao_social} span />}
                          {clientDetail.nome_fantasia && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Nome Fantasia" value={clientDetail.nome_fantasia} span />}
                          {clientDetail.enquadramento && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Enquadramento" value={clientDetail.enquadramento} />}
                          {clientDetail.cnae && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="CNAE" value={clientDetail.cnae} />}
                          {clientDetail.inscricao_municipal && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Insc. Municipal" value={clientDetail.inscricao_municipal} />}
                          {clientDetail.inscricao_estadual && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Insc. Estadual" value={clientDetail.inscricao_estadual} />}
                          {clientDetail.data_abertura_empresa && <InfoRow icon={<Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Abertura" value={clientDetail.data_abertura_empresa} />}
                          {clientDetail.faturamento_12m && <InfoRow icon={<FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />} label="Faturamento 12m" value={clientDetail.faturamento_12m} />}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    {stripAnexos(clientDetail.notes) && (
                      <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                        <p className="text-xs text-white/50 mb-1">Observações</p>
                        <p className="text-sm text-white/70 whitespace-pre-wrap">{stripAnexos(clientDetail.notes)}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Nova anotação */}
                {!editingClient && (
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Adicionar anotação</Label>
                    <Textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                      placeholder="Digite uma atualização ou anotação..."
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/20 resize-none" rows={2} />
                    <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
                      Adicionar
                    </Button>
                  </div>
                )}

                {/* Histórico */}
                {!editingClient && clientDetail.history && clientDetail.history.length > 0 && (
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
