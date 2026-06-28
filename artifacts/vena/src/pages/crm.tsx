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
    <div
