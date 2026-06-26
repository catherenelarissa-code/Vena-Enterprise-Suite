import { useState, useRef } from "react";
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
  MessageSquare, FileText, X, ChevronRight,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Template = {
  id: number;
  name: string;
  description?: string;
  template: string;
  createdAt: string;
};

type ExtractedFields = Record<string, string | null>;

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
  });
  const [isPending, setIsPending] = useState(false);

  const variables = extractVariables(form.template);

  async function handleSave() {
    if (!form.name || !form.template) {
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

  function insertVariable(v: string) {
    setForm((f) => ({ ...f, template: f.template + `{${v}}` }));
  }

  const SUGGESTED_VARS = [
    "NOME_CLIENTE", "VALOR", "DATA", "POTENCIA", "PAGAMENTO",
    "ENDERECO", "CPF_CNPJ", "UNIDADE", "NUMERO_PEDIDO",
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Modelo" : "Novo Modelo de Mensagem"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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

          <div className="space-y-1.5">
            <Label>Variáveis disponíveis</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_VARS.map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariable(v)}
                  className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Clique para inserir no modelo. Você pode criar variáveis customizadas digitando {`{MINHA_VAR}`} diretamente.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Modelo da mensagem *</Label>
            <Textarea
              placeholder={`Olá {NOME_CLIENTE}, tudo bem?\n\nSegue sua proposta:\nPotência: {POTENCIA}\nValor: {VALOR}\nPagamento: {PAGAMENTO}`}
              value={form.template}
              onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
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
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          templateFields: variables,
        }),
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-lg">{template.name}</h2>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">

            {/* Coluna Esquerda: Upload + Campos */}
            <div className="p-5 space-y-5">
              {/* Upload de imagem */}
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

              {/* Campos variáveis */}
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

            {/* Coluna Direita: Preview */}
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
              <Button
                onClick={handleCopy}
                size="lg"
                className="w-full gap-2"
                disabled={!preview}
              >
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

  useState(() => { loadTemplates(); });

  async function handleDelete(id: number) {
    try {
      await apiCall(`/templates/${id}`, { method: "DELETE" });
      toast.success("Modelo excluído.");
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

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

      {/* Cards de modelos */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-20 text-center border rounded-xl bg-card">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-medium text-muted-foreground">Nenhum modelo criado ainda.</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Crie modelos de mensagem com campos variáveis que serão preenchidos automaticamente por IA.
          </p>
          <Button onClick={() => setModalForm({ open: true, editing: null })}>
            <Plus className="mr-2 h-4 w-4" /> Criar primeiro modelo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const vars = extractVariables(t.template);
            return (
              <Card key={t.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{t.name}</CardTitle>
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
                  <Button
                    className="w-full gap-2 mt-auto"
                    onClick={() => setActiveTemplate(t)}
                  >
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
