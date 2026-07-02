import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Upload, Plus, X, Paperclip, Trash2, Pencil, Check } from "lucide-react";
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

type ExpenseItem = { name: string; quantity: string; value: string };

type ExpenseForm = {
  expenseType: string;
  supplierName: string;
  paymentMethod: string;
  attachmentFile: File | null;
  ocrRawText: string;
  items: ExpenseItem[];
};

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "boleto", label: "Boleto" },
];

const emptyItem: ExpenseItem = { name: "", quantity: "1", value: "" };

const emptyForm: ExpenseForm = {
  expenseType: "", supplierName: "", paymentMethod: "",
  attachmentFile: null, ocrRawText: "",
  items: [{ ...emptyItem }],
};

// ── Item Row ──────────────────────────────────────────────────────────────────

function ItemRow({ item, index, canRemove, onUpdate, onRemove }: {
  item: ExpenseItem; index: number; canRemove: boolean;
  onUpdate: (i: number, f: keyof ExpenseItem, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [editing, setEditing] = useState(true);
  return (
    <div className={`grid grid-cols-12 gap-2 items-center p-3 border rounded-lg transition-colors ${editing ? "border-orange-500/30 bg-orange-500/5" : "border-white/10 bg-white/3"}`}>
      {editing ? (
        <>
          <div className="col-span-5">
            <Input
              placeholder="Nome do item *"
              value={item.name}
              onChange={e => onUpdate(index, "name", e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
              autoFocus={index > 0}
            />
          </div>
          <div className="col-span-2">
            <Input
              placeholder="Qtd"
              type="number"
              min="0"
              step="any"
              value={item.quantity}
              onChange={e => onUpdate(index, "quantity", e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
            />
          </div>
          <div className="col-span-3">
            <Input
              placeholder="Valor (R$)"
              type="number"
              min="0"
              step="0.01"
              value={item.value}
              onChange={e => onUpdate(index, "value", e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20"
            />
          </div>
          <div className="col-span-2 flex justify-end gap-1">
            <button type="button" onClick={() => setEditing(false)}
              className="text-orange-400 hover:text-orange-300 p-1 rounded">
              <Check className="h-4 w-4" />
            </button>
            {canRemove && (
              <button type="button" onClick={() => onRemove(index)}
                className="text-white/30 hover:text-red-400 p-1 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="col-span-5 text-sm font-medium text-white truncate">
            {item.name || <span className="text-white/30 italic">sem nome</span>}
          </div>
          <div className="col-span-2 text-sm text-white/50">
            {item.quantity}x
          </div>
          <div className="col-span-3 text-sm text-white font-medium">
            {item.value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(item.value)) : "—"}
          </div>
          <div className="col-span-2 flex justify-end gap-1">
            <button type="button" onClick={() => setEditing(true)}
              className="text-white/30 hover:text-white p-1 rounded">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {canRemove && (
              <button type="button" onClick={() => onRemove(index)}
                className="text-white/30 hover:text-red-400 p-1 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Upload OCR ────────────────────────────────────────────────────────────────

function OcrExpenseUpload({ onExtracted, onAttach }: {
  onExtracted: (data: { items?: ExpenseItem[]; supplierName?: string; paymentMethod?: string; ocrRawText?: string }) => void;
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
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro OCR");
      const data = await res.json();

      // Converte items do OCR para o formato do formulário
      const items: ExpenseItem[] = Array.isArray(data.items) && data.items.length > 0
        ? data.items.map((i: any) => ({
            name: i.name ?? i.materialName ?? "",
            quantity: String(i.quantity ?? "1"),
            value: String(i.value ?? i.unitPrice ?? ""),
          }))
        : data.description
          ? [{ name: data.description, quantity: "1", value: String(data.amount ?? "") }]
          : [{ ...emptyItem }];

      onExtracted({
        items,
        supplierName: data.supplierName ?? "",
        paymentMethod: data.paymentMethod ?? "",
        ocrRawText: data.rawText ?? "",
      });
      toast.success("Comprovante lido! Revise os dados preenchidos.");
    } catch {
      toast.error("Não foi possível ler o comprovante. Preencha manualmente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-white/60 text-xs">Anexar comprovante (cupom, nota fiscal ou romaneio)</Label>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      {loading ? (
        <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center text-white/50">
          Lendo comprovante com IA...
        </div>
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

// ── Página Principal ──────────────────────────────────────────────────────────

export function DespesasOperacionais() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterTag, setFilterTag] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["operational-expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/financial/expenses`, { credentials: "include" });
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["expense-tags"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/financial/expense-tags`, { credentials: "include" });
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const filteredExpenses = filterTag === "all"
    ? (expenses ?? [])
    : (expenses ?? []).filter((e: any) => e.expenseType === filterTag);

  function handleClose() {
    setShowModal(false);
    setForm({ ...emptyForm, items: [{ ...emptyItem }] });
    setAttachPreview(null);
  }

  function handleAttach(file: File, previewUrl: string) {
    setForm(f => ({ ...f, attachmentFile: file }));
    setAttachPreview(previewUrl || null);
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  }

  function removeItem(index: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  function updateItem(index: number, field: keyof ExpenseItem, value: string) {
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
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
    if (!form.expenseType) { toast.error("Selecione o tipo de despesa."); return; }
    if (form.items.some(i => !i.name)) { toast.error("Preencha o nome de todos os itens."); return; }
    if (!form.paymentMethod) { toast.error("Selecione o método de pagamento."); return; }

    const totalAmount = form.items.reduce((s, i) => s + (parseFloat(i.value || "0") * parseFloat(i.quantity || "1")), 0);
    if (totalAmount <= 0) { toast.error("Informe o valor de pelo menos um item."); return; }

    setIsSaving(true);
    try {
      let attachmentUrl: string | null = null;
      if (form.attachmentFile) attachmentUrl = await fileToBase64(form.attachmentFile);

      const description = form.items.map(i => `${i.quantity}x ${i.name}${i.value ? ` (R$ ${parseFloat(i.value).toFixed(2)})` : ""}`).join(", ");

      const res = await fetch(`${API}/api/financial/expenses`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseType: form.expenseType,
          description,
          supplierName: form.supplierName || null,
          amount: totalAmount,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">Registre despesas operacionais com comprovante anexado.</p>
        <Button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

      {/* Filtro por tag */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-white/40">Filtrar:</span>
        <Badge
          variant={filterTag === "all" ? "default" : "outline"}
          className={filterTag === "all" ? "cursor-pointer bg-orange-500 text-white" : "cursor-pointer border-white/10 text-white/50"}
          onClick={() => setFilterTag("all")}
        >
          Todas
        </Badge>
        {tags?.map((t: any) => (
          <Badge
            key={t.id}
            variant={filterTag === t.name ? "default" : "outline"}
            className={filterTag === t.name ? "cursor-pointer bg-orange-500 text-white" : "cursor-pointer border-white/10 text-white/50"}
            onClick={() => setFilterTag(prev => prev === t.name ? "all" : t.name)}
          >
            {t.name}
          </Badge>
        ))}
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "hsl(220,25%,11%)" }}>
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-8 w-full" /></div>)
        ) : filteredExpenses.length > 0 ? (
          filteredExpenses.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {e.attachmentUrl && (
                  <a href={e.attachmentUrl} target="_blank" rel="noopener noreferrer" title="Ver comprovante">
                    <Paperclip className="h-4 w-4 text-orange-400 shrink-0" />
                  </a>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-white/10 text-white/60 text-xs shrink-0">{e.expenseType}</Badge>
                    <span className="text-sm text-white truncate">{e.description}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {e.supplierName ? `${e.supplierName} • ` : ""}
                    {PAYMENT_METHODS.find(p => p.value === e.paymentMethod)?.label ?? e.paymentMethod}
                    {" • "}
                    {new Date(e.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-white shrink-0">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(e.amount)}
              </span>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-white/30">
            {filterTag !== "all" ? `Nenhuma despesa com a tag "${filterTag}".` : "Nenhuma despesa operacional registrada."}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={open => !open && handleClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader><DialogTitle className="text-white">Nova Despesa Operacional</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">

            {/* OCR */}
            <OcrExpenseUpload
              onExtracted={data => setForm(f => ({
                ...f,
                ...(data.supplierName !== undefined && { supplierName: data.supplierName }),
                ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
                ...(data.ocrRawText !== undefined && { ocrRawText: data.ocrRawText }),
                ...(data.items?.length && { items: data.items }),
              }))}
              onAttach={handleAttach}
            />

            {/* Preview do anexo */}
            {attachPreview && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                <img src={attachPreview} className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setAttachPreview(null); setForm(f => ({ ...f, attachmentFile: null })); }}
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

            {/* Tipo de despesa */}
            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Tipo de despesa *</Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((t: any) => (
                  <Badge key={t.id}
                    variant={form.expenseType === t.name ? "default" : "outline"}
                    className={form.expenseType === t.name ? "cursor-pointer bg-orange-500 text-white" : "cursor-pointer border-white/10 text-white/60"}
                    onClick={() => setForm(f => ({ ...f, expenseType: t.name }))}>
                    {t.name}
                  </Badge>
                ))}
                {showTagInput ? (
                  <div className="flex items-center gap-1">
                    <Input className="h-7 w-32 text-xs border-white/10 bg-white/5 text-white"
                      placeholder="Nova tag" value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateTag()}
                      autoFocus />
                    <button type="button" onClick={handleCreateTag} className="text-orange-400 text-xs font-medium">OK</button>
                    <button type="button" onClick={() => setShowTagInput(false)} className="text-white/30"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <Badge variant="outline" className="cursor-pointer border-white/10 text-white/60"
                    onClick={() => setShowTagInput(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Nova tag
                  </Badge>
                )}
              </div>
            </div>

            {/* Itens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-xs">Itens * <span className="text-white/30 font-normal">({form.items.length})</span></Label>
                <Button type="button" variant="outline" size="sm"
                  className="border-white/10 text-white/60 hover:text-white h-7 text-xs"
                  onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar item
                </Button>
              </div>
              <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs text-white/30">
                <div className="col-span-5">Item</div>
                <div className="col-span-2">Qtd</div>
                <div className="col-span-3">Valor unit.</div>
                <div className="col-span-2" />
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <ItemRow key={index} item={item} index={index}
                    canRemove={form.items.length > 1}
                    onUpdate={updateItem} onRemove={removeItem} />
                ))}
              </div>
              {form.items.length > 0 && form.items.some(i => i.value) && (
                <div className="flex justify-end pt-1">
                  <span className="text-xs text-white/40">
                    Total:{" "}
                    <span className="text-white font-semibold">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        form.items.reduce((s, i) => s + (parseFloat(i.value || "0") * parseFloat(i.quantity || "1")), 0)
                      )}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Fornecedor e Método */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">Fornecedor</Label>
                <Input value={form.supplierName}
                  onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">Método de pagamento *</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent style={{ background: "hsl(220,25%,13%)" }}>
                    {PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
