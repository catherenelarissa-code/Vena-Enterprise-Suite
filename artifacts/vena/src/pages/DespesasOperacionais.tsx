import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Upload, Plus, X, Paperclip } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressAndEncode(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function convertPdfToImage(file: File) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = viewport.width; canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { base64: canvas.toDataURL("image/jpeg", 0.85).split(",")[1], mediaType: "image/jpeg" };
}

type ExpenseForm = {
  expenseType: string;
  description: string;
  supplierName: string;
  amount: string;
  paymentMethod: string;
  attachmentFile: File | null;
  ocrRawText: string;
};

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "boleto", label: "Boleto" },
];

const emptyForm: ExpenseForm = {
  expenseType: "", description: "", supplierName: "", amount: "",
  paymentMethod: "", attachmentFile: null, ocrRawText: "",
};

// ── Upload OCR de comprovante ────────────────────────────────────────────────

function OcrExpenseUpload({
  onExtracted,
  onAttach,
}: {
  onExtracted: (data: Partial<ExpenseForm>) => void;
  onAttach: (file: File, previewUrl: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) { toast.error("Envie imagem ou PDF."); return; }

    const previewUrl = isImage ? URL.createObjectURL(file) : "";
    onAttach(file, previewUrl);

    setLoading(true);
    try {
      const payload = isPdf ? await convertPdfToImage(file) : await compressAndEncode(file);
      const res = await fetch(`${API}/api/automation/ocr-expense`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro OCR");
      const data = await res.json();
      onExtracted({
        description: data.description ?? "",
        supplierName: data.supplierName ?? "",
        amount: data.amount ? String(data.amount) : "",
        paymentMethod: data.paymentMethod ?? "",
        ocrRawText: data.rawText ?? "",
      });
      toast.success("Comprovante lido! Revise os dados preenchidos.");
    } catch {
      toast.error("Não foi possível ler o comprovante automaticamente. Preencha manualmente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-white/60 text-xs">Anexar comprovante (cupom, nota fiscal ou romaneio)</Label>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {loading ? (
        <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center text-white/50">Lendo comprovante...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors flex flex-col items-center gap-2 text-white/60">
            <Camera className="h-6 w-6" /><p className="text-sm">Tirar foto</p>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors flex flex-col items-center gap-2 text-white/60">
            <Upload className="h-6 w-6" /><p className="text-sm">Enviar imagem ou PDF</p>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Página / Aba ──────────────────────────────────────────────────────────────

export function DespesasOperacionais() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["operational-expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/financial/expenses`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar despesas");
      return res.json();
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["expense-tags"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/financial/expense-tags`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar tags");
      return res.json();
    },
  });

  function handleClose() {
    setShowModal(false);
    setForm(emptyForm);
    setAttachPreview(null);
  }

  function handleAttach(file: File, previewUrl: string) {
    setForm(f => ({ ...f, attachmentFile: file }));
    setAttachPreview(previewUrl || null);
  }

  async function handleCreateTag() {
    if (!newTag.trim()) return;
    const res = await fetch(`${API}/api/financial/expense-tags`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTag.trim() }),
    });
    if (res.ok) {
      const tag = await res.json();
      queryClient.invalidateQueries({ queryKey: ["expense-tags"] });
      setForm(f => ({ ...f, expenseType: tag.name }));
      setNewTag(""); setShowTagInput(false);
    }
  }

  async function handleSubmit() {
    if (!form.expenseType || !form.description || !form.amount || !form.paymentMethod) {
      toast.error("Preencha tipo, descrição, valor e método de pagamento.");
      return;
    }
    setIsSaving(true);
    try {
      let attachmentUrl: string | null = null;
      if (form.attachmentFile) {
        attachmentUrl = await fileToBase64(form.attachmentFile);
      }
      const res = await fetch(`${API}/api/financial/expenses`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseType: form.expenseType,
          description: form.description,
          supplierName: form.supplierName || null,
          amount: parseFloat(form.amount.replace(",", ".")),
          paymentMethod: form.paymentMethod,
          attachmentUrl,
          ocrRawText: form.ocrRawText || null,
        }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["operational-expenses"] });
      toast.success("Despesa registrada!");
      handleClose();
    } catch {
      toast.error("Erro ao salvar despesa.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">Registre despesas operacionais com comprovante anexado.</p>
        <Button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "hsl(220,25%,11%)" }}>
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-8 w-full" /></div>)
        ) : expenses?.length ? (
          expenses.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between gap-4 p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                {e.attachmentUrl && <Paperclip className="h-4 w-4 text-orange-400" />}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/10 text-white/60 text-xs">{e.expenseType}</Badge>
                    <span className="font-medium text-sm text-white">{e.description}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {e.supplierName ? `${e.supplierName} • ` : ""}
                    {PAYMENT_METHODS.find(p => p.value === e.paymentMethod)?.label ?? e.paymentMethod}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-white">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(e.amount)}
              </span>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-white/30">Nenhuma despesa operacional registrada.</div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader><DialogTitle className="text-white">Nova Despesa Operacional</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <OcrExpenseUpload
              onExtracted={(data) => setForm(f => ({ ...f, ...data }))}
              onAttach={handleAttach}
            />

            {attachPreview && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                <img src={attachPreview} className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setAttachPreview(null); setForm(f => ({ ...f, attachmentFile: null })); }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-white/30">ou preencha manualmente</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Tipo de despesa *</Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((t: any) => (
                  <Badge
                    key={t.id}
                    variant={form.expenseType === t.name ? "default" : "outline"}
                    className={form.expenseType === t.name ? "cursor-pointer bg-orange-500 text-white" : "cursor-pointer border-white/10 text-white/60"}
                    onClick={() => setForm(f => ({ ...f, expenseType: t.name }))}
                  >
                    {t.name}
                  </Badge>
                ))}
                {showTagInput ? (
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-7 w-32 text-xs border-white/10 bg-white/5 text-white"
                      placeholder="Nova tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                      autoFocus
                    />
                    <button type="button" onClick={handleCreateTag} className="text-orange-400 text-xs">OK</button>
                  </div>
                ) : (
                  <Badge variant="outline" className="cursor-pointer border-white/10 text-white/60" onClick={() => setShowTagInput(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Nova tag
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Descrição *</Label>
              <Textarea
                placeholder="Itens comprados..."
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">Fornecedor</Label>
                <Input
                  value={form.supplierName}
                  onChange={(e) => setForm(f => ({ ...f, supplierName: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">Valor *</Label>
                <Input
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Método de pagamento *</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm(f => ({ ...f, paymentMethod: v }))}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                  {PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} className="border-white/10 text-white/60">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isSaving ? "Salvando..." : "Salvar Despesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
