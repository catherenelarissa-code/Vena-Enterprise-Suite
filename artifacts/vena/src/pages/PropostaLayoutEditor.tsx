import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload, X, Image as ImageIcon, GripVertical, Check,
  Loader2, Save, LayoutTemplate,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────────
// Este é o "contrato" salvo no banco. Mantenha estável — qualquer campo novo
// deve ter um valor default em DEFAULT_LAYOUT para não quebrar propostas antigas.

export type SecaoProposta = {
  id: string;
  label: string;
  enabled: boolean;
};

export type LayoutConfig = {
  identidade: {
    logo: string | null;
    banner: string | null;
    rodape: string | null;
    marcaDagua: string | null;
  };
  cores: {
    principal: string;
    secundaria: string;
    titulos: string;
    textos: string;
    botoes: string;
    cards: string;
    tabelas: string;
  };
  fontes: {
    titulos: string;
    texto: string;
    valores: string;
  };
  opcoes: {
    cabecalhoGrande: boolean;
    mostrarSlogan: boolean;
    mostrarQRCode: boolean;
    mostrarAssinatura: boolean;
    mostrarNumeroProposta: boolean;
    mostrarValidade: boolean;
    mostrarCapa: boolean;
    mostrarIndice: boolean;
  };
  capa: {
    estilo: "moderna" | "minimalista" | "corporativa" | "comercial" | "personalizada";
  };
  secoes: SecaoProposta[];
  componentes: {
    tabela: "simples" | "zebra" | "moderna";
    cards: "quadrado" | "arredondado" | "elevado";
  };
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  identidade: { logo: null, banner: null, rodape: null, marcaDagua: null },
  cores: {
    principal: "#F97316",
    secundaria: "#0F172A",
    titulos: "#111827",
    textos: "#374151",
    botoes: "#F97316",
    cards: "#FFFFFF",
    tabelas: "#F8FAFC",
  },
  fontes: {
    titulos: "Montserrat",
    texto: "Open Sans",
    valores: "Montserrat",
  },
  opcoes: {
    cabecalhoGrande: true,
    mostrarSlogan: true,
    mostrarQRCode: false,
    mostrarAssinatura: true,
    mostrarNumeroProposta: true,
    mostrarValidade: true,
    mostrarCapa: true,
    mostrarIndice: false,
  },
  capa: { estilo: "moderna" },
  secoes: [
    { id: "capa", label: "Capa", enabled: true },
    { id: "cliente", label: "Cliente", enabled: true },
    { id: "projeto", label: "Projeto", enabled: true },
    { id: "equipamentos", label: "Equipamentos", enabled: true },
    { id: "economia", label: "Economia", enabled: true },
    { id: "investimento", label: "Investimento", enabled: true },
    { id: "assinatura", label: "Assinatura", enabled: true },
  ],
  componentes: { tabela: "zebra", cards: "arredondado" },
};

const FONTES_DISPONIVEIS = [
  "Montserrat", "Open Sans", "Roboto", "Inter", "Poppins",
  "Lato", "Nunito", "Raleway", "Playfair Display", "Oswald",
];

const CAPA_OPCOES: { value: LayoutConfig["capa"]["estilo"]; label: string; desc: string }[] = [
  { value: "moderna", label: "Moderna", desc: "Gradiente + tipografia grande" },
  { value: "minimalista", label: "Minimalista", desc: "Espaço em branco, poucos elementos" },
  { value: "corporativa", label: "Corporativa", desc: "Sóbria, foco em confiança" },
  { value: "comercial", label: "Comercial", desc: "Destaque para números e economia" },
  { value: "personalizada", label: "Personalizada", desc: "Usa seu banner como fundo" },
];

// ── Helper API ───────────────────────────────────────────────────────────────

async function uploadAsset(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/automation/upload-asset", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao enviar arquivo" }));
    throw new Error(err.error ?? "Erro ao enviar arquivo");
  }
  const data = await res.json();
  return data.url as string; // backend deve retornar { url: "https://..." }
}

// ── Subcomponente: Upload de imagem ───────────────────────────────────────────

function ImageUploadSlot({
  label, value, onChange, aspect = "video",
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: "video" | "square" | "wide";
}) {
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-[4/1]" : "aspect-video";

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB).");
      return;
    }
    setEnviando(true);
    try {
      const url = await uploadAsset(file);
      onChange(url);
      toast.success(`${label} atualizado.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div
        className={`relative rounded-lg border-2 border-dashed ${aspectClass} flex items-center justify-center overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer group`}
        onClick={() => !enviando && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {enviando ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/90 border opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Enviar imagem</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subcomponente: Seletor de cor ─────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="flex items-center gap-2">
        <label
          className="h-9 w-9 rounded-md border shrink-0 cursor-pointer overflow-hidden relative"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <Input
          className="font-mono text-xs uppercase"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ── Subcomponente: Toggle de opção ────────────────────────────────────────────

function OptionToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
      checked ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
    }`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
      {label}
    </label>
  );
}

// ── Subcomponente: Seções (drag & drop) ───────────────────────────────────────

function SecoesEditor({ secoes, onChange }: { secoes: SecaoProposta[]; onChange: (s: SecaoProposta[]) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...secoes];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    onChange(updated);
    setDragIdx(null);
  }

  function toggle(idx: number) {
    const updated = secoes.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s);
    onChange(updated);
  }

  return (
    <div className="rounded-lg border divide-y overflow-hidden">
      {secoes.map((secao, idx) => (
        <div
          key={secao.id}
          draggable
          onDragStart={() => setDragIdx(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(idx)}
          className={`flex items-center gap-3 px-3 py-2.5 bg-background hover:bg-muted/40 transition-colors ${
            dragIdx === idx ? "opacity-40" : ""
          }`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
          <span className={`flex-1 text-sm font-medium ${secao.enabled ? "" : "text-muted-foreground line-through"}`}>
            {secao.label}
          </span>
          <button
            type="button"
            onClick={() => toggle(idx)}
            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
              secao.enabled ? "bg-primary border-primary text-primary-foreground" : "border-border"
            }`}
          >
            {secao.enabled && <Check className="h-3 w-3" />}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Subcomponente: Cards de escolha (capa / tabela / cards) ──────────────────

function ChoiceCard({ selected, title, subtitle, onClick }: { selected: boolean; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-primary" : "border-muted-foreground"
        }`}>
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 ml-5">{subtitle}</p>}
    </button>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function PropostaLayoutEditor({
  value,
  onChange,
  onSave,
  salvando = false,
}: {
  value: LayoutConfig;
  onChange: (layout: LayoutConfig) => void;
  onSave: () => void;
  salvando?: boolean;
}) {
  function set<K extends keyof LayoutConfig>(key: K, patch: Partial<LayoutConfig[K]>) {
    onChange({ ...value, [key]: { ...(value[key] as any), ...patch } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutTemplate className="h-4 w-4" />
          Personalize a identidade visual da proposta. As mudanças aparecem na aba Preview.
        </div>
        <Button onClick={onSave} disabled={salvando} size="sm">
          {salvando ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
          {salvando ? "Salvando..." : "Salvar Layout"}
        </Button>
      </div>

      {/* Identidade Visual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Identidade Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ImageUploadSlot label="Logo" aspect="square" value={value.identidade.logo} onChange={(v) => set("identidade", { logo: v })} />
          <ImageUploadSlot label="Banner" aspect="wide" value={value.identidade.banner} onChange={(v) => set("identidade", { banner: v })} />
          <ImageUploadSlot label="Rodapé" aspect="wide" value={value.identidade.rodape} onChange={(v) => set("identidade", { rodape: v })} />
          <ImageUploadSlot label="Marca d'água" aspect="square" value={value.identidade.marcaDagua} onChange={(v) => set("identidade", { marcaDagua: v })} />
        </CardContent>
      </Card>

      {/* Cores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ColorField label="Principal" value={value.cores.principal} onChange={(v) => set("cores", { principal: v })} />
          <ColorField label="Secundária" value={value.cores.secundaria} onChange={(v) => set("cores", { secundaria: v })} />
          <ColorField label="Títulos" value={value.cores.titulos} onChange={(v) => set("cores", { titulos: v })} />
          <ColorField label="Textos" value={value.cores.textos} onChange={(v) => set("cores", { textos: v })} />
          <ColorField label="Botões" value={value.cores.botoes} onChange={(v) => set("cores", { botoes: v })} />
          <ColorField label="Cards" value={value.cores.cards} onChange={(v) => set("cores", { cards: v })} />
          <ColorField label="Tabelas" value={value.cores.tabelas} onChange={(v) => set("cores", { tabelas: v })} />
        </CardContent>
      </Card>

      {/* Fontes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Fontes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { key: "titulos", label: "Fonte dos títulos" },
            { key: "texto", label: "Fonte do texto" },
            { key: "valores", label: "Fonte dos valores" },
          ] as const).map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={value.fontes[key]}
                onChange={(e) => set("fontes", { [key]: e.target.value } as any)}
                style={{ fontFamily: value.fontes[key] }}
              >
                {FONTES_DISPONIVEIS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Opções de layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Layout</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <OptionToggle label="Cabeçalho grande" checked={value.opcoes.cabecalhoGrande} onChange={(v) => set("opcoes", { cabecalhoGrande: v })} />
          <OptionToggle label="Mostrar slogan" checked={value.opcoes.mostrarSlogan} onChange={(v) => set("opcoes", { mostrarSlogan: v })} />
          <OptionToggle label="Mostrar QR Code" checked={value.opcoes.mostrarQRCode} onChange={(v) => set("opcoes", { mostrarQRCode: v })} />
          <OptionToggle label="Mostrar assinatura" checked={value.opcoes.mostrarAssinatura} onChange={(v) => set("opcoes", { mostrarAssinatura: v })} />
          <OptionToggle label="Mostrar número da proposta" checked={value.opcoes.mostrarNumeroProposta} onChange={(v) => set("opcoes", { mostrarNumeroProposta: v })} />
          <OptionToggle label="Mostrar validade" checked={value.opcoes.mostrarValidade} onChange={(v) => set("opcoes", { mostrarValidade: v })} />
          <OptionToggle label="Mostrar capa" checked={value.opcoes.mostrarCapa} onChange={(v) => set("opcoes", { mostrarCapa: v })} />
          <OptionToggle label="Mostrar índice" checked={value.opcoes.mostrarIndice} onChange={(v) => set("opcoes", { mostrarIndice: v })} />
        </CardContent>
      </Card>

      {/* Capa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Modelo de Capa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CAPA_OPCOES.map((opt) => (
            <ChoiceCard
              key={opt.value}
              title={opt.label}
              subtitle={opt.desc}
              selected={value.capa.estilo === opt.value}
              onClick={() => set("capa", { estilo: opt.value })}
            />
          ))}
        </CardContent>
      </Card>

      {/* Seções */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Seções</CardTitle>
        </CardHeader>
        <CardContent>
          <SecoesEditor secoes={value.secoes} onChange={(s) => onChange({ ...value, secoes: s })} />
          <p className="text-xs text-muted-foreground mt-2">Arraste para reordenar. Clique no check para mostrar/ocultar.</p>
        </CardContent>
      </Card>

      {/* Componentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Componentes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Tabela</Label>
            <div className="flex flex-wrap gap-2">
              {(["simples", "zebra", "moderna"] as const).map((v) => (
                <ChoiceCard key={v} title={v[0].toUpperCase() + v.slice(1)} selected={value.componentes.tabela === v} onClick={() => set("componentes", { tabela: v })} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Cards</Label>
            <div className="flex flex-wrap gap-2">
              {(["quadrado", "arredondado", "elevado"] as const).map((v) => (
                <ChoiceCard key={v} title={v[0].toUpperCase() + v.slice(1)} selected={value.componentes.cards === v} onClick={() => set("componentes", { cards: v })} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
