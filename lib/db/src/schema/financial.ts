/app # cat /app/artifacts/vena/src/pages/crm.tsx | head -50
import { useState, useEffect, useRef } from "react";
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

  // Drag-to-scroll do board (arrastar com o mouse em vez de usar a scrollbar)
  const boardRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, scrollLeft: 0 });
  const movedWhilePanning = useRef(false);

  function handleBoardMouseDown(e: React.MouseEvent) {
    // Não inicia o pan se o clique começou em um card (que tem seu próprio drag) ou em um botão/input
    const target = e.target as HTMLElement;
    if (target.closest('[draggable="true"], button, input, select, textarea')) return;
/app # 
