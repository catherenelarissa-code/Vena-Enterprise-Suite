import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Copy, Check, Upload, Sparkles,
  MessageSquare, FileText, X, ChevronRight, Tag, PenLine,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Template = {
  id: number;
  name: string;
  description?: string;
  template: string;
  label?: string;       // ← etiqueta/categoria
  createdAt: string;
};

type ExtractedFields = Record<string, string | null>;

// ── Etiquetas disponíveis ─────────────────────────────────────────────────────

const LABEL_OPTIONS = [
  { value: "procuracao", label: "Procurações", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "whatsapp", label: "WhatsApp", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "proposta", label: "Propostas", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "contrato", label: "Contratos", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "cobranca", label: "Cobranças", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "outro", label: "Outro", color: "bg-gray-100 text-gray-600 border-gray-300" },
];

function getLabelInfo(value?: string) {
  return LABEL_OPTIONS.find((l) => l.value === value) ?? null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractVariables(template: string): string[] {
  const matches = template.match(/\{([A-Z_]+)\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

function applyFields(template: string, fields: ExtractedFields): string {
  let result = template;
  for (const [key, value] of Object.entries(fields)) {
    if (value) result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`/api/automation${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? "Erro na requisição");
  }
  return res.status === 204 ? null : res.json();
}

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Caixinha de Variáveis com scroll, adicionar e editar ──────────────────────

function VariablesBox({
  onInsert,
}: {
  onInsert: (v: string) => void;
}) {
  const DEFAULT_VARS = [
    "NOME_CLIENTE", "VALOR", "DATA", "POTENCIA", "PAGAMENTO",
    "ENDERECO", "CPF_CNPJ", "UNIDADE", "NUMERO_PEDIDO",
  ];

  const [vars, setVars] = useState<string[]>(DEFAULT_VARS);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newVar, setNewVar] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(vars[idx]);
  }

  function confirmEdit(idx: number) {
    const cleaned = editValue.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!cleaned) { setEditingIdx(null); return; }
    const updated = [...vars];
    updated[idx] = cleaned;
    setVars(updated);
    setEditingIdx(null);
  }

  function addVar() {
    const cleaned = newVar.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!cleaned || vars.includes(cleaned)) {
      toast.error("Nome inválido ou já existe.");
      return;
    }
    setVars([...vars, cleaned]);
    setNewVar("");
    setShowAdd(false);
  }

  function removeVar(idx: number) {
    setVars(vars.filter((_, i) => i !== idx));
  }

  return (
    <div className="border rounded-lg bg-muted/30">
      {/* header da caixinha */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40 rounded-t-lg">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Variáveis disponíveis
        </span>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs flex items-center gap-1 text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>

      {/* campo para nova variável */}
      {showAdd && (
        <div className="flex gap-2 px-3 py-2 border-b bg-background">
          <Input
            className="h-7 text-xs font-mono"
            placeholder="NOVA_VAR"
            value={newVar}
            onChange={(e) => setNewVar(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addVar()}
            autoFocus
          />
          <Button size="sm" className="h-7 px-2 text-xs" onClick={addVar}>OK</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setShowAdd(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* lista com scroll */}
      <div className="max-h-44 overflow-y-auto divide-y">
        {vars.map((v, idx) => (
          <div
            key={v}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 group"
          >
            {editingIdx === idx ? (
              <>
                <Input
                  className="h-6 text-xs font-mono flex-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit(idx)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => confirmEdit(idx)}
                  className="text-primary hover:text-primary/80"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIdx(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onInsert(v)}
                  className="flex-1 text-left text-xs font-mono text-primary hover:underline"
                >
                  {`{${v}}`}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(idx)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                >
                  <PenLine className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeVar(idx)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-1.5 border-t">
        <p className="text-xs text-muted-foreground">
          Clique para inserir no modelo. Você também pode digitar <span className="font-mono">{"{MINHA_VAR}"}</span> diretamente.
        </p>
      </div>
    </div>
  );
}

// ── Modal: Criar/Editar Template ─────────────────────────────────────────────

function TemplateModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Template | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    template: editing?.template ?? "",
    label: editing?.label ?? "",
  });
  const [isPending, setIsPending] = useState(false);

  const variables = extractVariables(form.template);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insere variável na posição do cursor
  function insertVariable(v: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const inserted = `{${v}}`;
      const newVal = form.template.slice(0, start) + inserted + form.template.slice(end);
      setForm((f) => ({ ...f, template: newVal }));
      // Reposiciona cursor após inserção
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + inserted.length, start + inserted.length);
      }, 0);
    } else {
      setForm((f) => ({ ...f, template: f.template + `{${v}}` }));
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.template.trim()) {
      toast.error("Nome e modelo são obrigatórios.");
      return;
    }
    setIsPending(true);
    try {
      if (editing) {
        await apiCall(`/templates/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Modelo atualizado!");
      } else {
        await apiCall("/templates", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Modelo criado!");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Modelo" : "Novo Modelo de Mensagem"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome + Descrição */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome do modelo *</Label>
              <Input
                placeholder="Ex: Proposta Solar"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Envio de proposta para cliente"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Etiqueta */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Etiqueta / Categoria
            </Label>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, label: f.label === opt.value ? "" : opt.value }))
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    form.label === opt.value
                      ? opt.color + " ring-2 ring-offset-1 ring-current"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variáveis — caixinha com scroll */}
          <div className="space-y-1.5">
            <Label>Variáveis disponíveis</Label>
            <VariablesBox onInsert={insertVariable} />
          </div>

          {/* Modelo da mensagem */}
          <div className="space-y-1.5">
            <Label>Modelo da mensagem *</Label>
            <Textarea
              ref={textareaRef}
              placeholder={`Olá {NOME_CLIENTE}, tudo bem?\n\nSegue sua proposta:\nPotência: {POTENCIA}\nValor: {VALOR}\nPagamento: {PAGAMENTO}`}
              value={form.template}
              onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* Variáveis detectadas */}
          {variables.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Variáveis detectadas neste modelo:</p>
              <div className="flex flex-wrap gap-1.5">
                {variables.map((v) => (
                  <Badge key={v} variant="outline" className="font-mono text-xs">{`{${v}}`}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Painel de Uso: OCR + Preenchimento ───────────────────────────────────────

function UseTemplatePanel({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<ExtractedFields>(() => {
    const vars = extractVariables(template.template);
    return Object.fromEntries(vars.map((v) => [v, ""]));
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOcr, setIsOcr] = useState(false);
  const [ocrSummary, setOcrSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const variables = extractVariables(template.template);
  const preview = applyFields(template.template, fields);
  const hasUnfilled = variables.some((v) => !fields[v]);
  const labelInfo = getLabelInfo(template.label);

  async function handleImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor envie uma imagem (JPG, PNG, etc).");
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setIsOcr(true);
    setOcrSummary(null);

    try {
      const { base64, mediaType } = await fileToBase64(file);
      const result = await apiCall("/ocr", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64, mediaType, templateFields: variables }),
      });

      const extracted: ExtractedFields = {};
      for (const v of variables) {
        extracted[v] = result.campos?.[v] ?? result.campos?.OUTROS?.[v] ?? "";
      }
      setFields((prev) => ({ ...prev, ...extracted }));
      setOcrSummary(result.resumo ?? null);
      toast.success("Dados extraídos com sucesso!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao processar imagem.");
    } finally {
      setIsOcr(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{template.name}</h2>
                {labelInfo && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${labelInfo.color}`}>
                    {labelInfo.label}
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
            <div className="p-5 space-y-5">
              <div>
                <Label className="mb-2 block">Documento / Imagem para OCR</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                  />
                  {isOcr ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                      <p className="text-sm font-medium">Analisando imagem com IA...</p>
                    </div>
                  ) : imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded object-contain" />
                      <p className="text-xs text-muted-foreground">Clique para trocar a imagem</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Arraste ou clique para enviar</p>
                      <p className="text-xs text-muted-foreground">Proposta, ficha, orçamento, documento...</p>
                    </div>
                  )}
                </div>
                {ocrSummary && (
                  <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex gap-2 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{ocrSummary}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Preencha os campos</Label>
                {variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs font-mono text-muted-foreground">{`{${v}}`}</Label>
                    <Input
                      placeholder={`Valor para ${v}`}
                      value={fields[v] ?? ""}
                      onChange={(e) => setFields((f) => ({ ...f, [v]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <Label>Prévia da mensagem</Label>
                {hasUnfilled && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                    Campos não preenchidos
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-h-[200px] p-4 rounded-lg bg-muted/40 border font-mono text-sm whitespace-pre-wrap leading-relaxed overflow-y-auto">
                {preview || <span className="text-muted-foreground italic">A mensagem aparecerá aqui...</span>}
              </div>
              <Button onClick={handleCopy} size="lg" className="w-full gap-2" disabled={!preview}>
                {copied ? (
                  <><Check className="h-4 w-4" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copiar para WhatsApp</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────

export function Automacao() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalForm, setModalForm] = useState<{ open: boolean; editing: Template | null }>({
    open: false,
    editing: null,
  });
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>("");   // ← filtro por etiqueta

  // ✅ CORREÇÃO: useEffect no lugar de useState para carregar templates
  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await apiCall("/templates");
      setTemplates(data);
    } catch {
      toast.error("Erro ao carregar modelos.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiCall(`/templates/${id}`, { method: "DELETE" });
      toast.success("Modelo excluído.");
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const filtered = filterLabel
    ? templates.filter((t) => t.label === filterLabel)
    : templates;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automação de Mensagens</h2>
          <p className="text-muted-foreground">
            Modelos inteligentes com leitura automática de documentos por IA.
          </p>
        </div>
        <Button
          onClick={() => setModalForm({ open: true, editing: null })}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      {/* Filtro por etiqueta */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" /> Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setFilterLabel("")}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
              filterLabel === ""
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            Todos
          </button>
          {LABEL_OPTIONS.map((opt) => {
            const count = templates.filter((t) => t.label === opt.value).length;
            if (count === 0) return null;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterLabel(opt.value)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                  filterLabel === opt.value
                    ? opt.color + " ring-2 ring-offset-1 ring-current"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {opt.label} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border rounded-xl bg-card">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-medium text-muted-foreground">
            {filterLabel ? "Nenhum modelo com essa etiqueta." : "Nenhum modelo criado ainda."}
          </p>
          {!filterLabel && (
            <>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Crie modelos de mensagem com campos variáveis que serão preenchidos automaticamente por IA.
              </p>
              <Button onClick={() => setModalForm({ open: true, editing: null })}>
                <Plus className="mr-2 h-4 w-4" /> Criar primeiro modelo
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const vars = extractVariables(t.template);
            const labelInfo = getLabelInfo(t.label);
            return (
              <Card key={t.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base truncate">{t.name}</CardTitle>
                        {labelInfo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${labelInfo.color}`}>
                            {labelInfo.label}
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setModalForm({ open: true, editing: t })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="p-3 rounded-md bg-muted/40 text-xs font-mono text-muted-foreground line-clamp-3 leading-relaxed">
                    {t.template}
                  </div>
                  {vars.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {vars.slice(0, 4).map((v) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono px-1.5">
                          {`{${v}}`}
                        </Badge>
                      ))}
                      {vars.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{vars.length - 4}</Badge>
                      )}
                    </div>
                  )}
                  <Button className="w-full gap-2 mt-auto" onClick={() => setActiveTemplate(t)}>
                    <FileText className="h-4 w-4" />
                    Usar modelo
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modais */}
      {modalForm.open && (
        <TemplateModal
          editing={modalForm.editing}
          onClose={() => setModalForm({ open: false, editing: null })}
          onSaved={loadTemplates}
        />
      )}
      {activeTemplate && (
        <UseTemplatePanel
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  );
}
