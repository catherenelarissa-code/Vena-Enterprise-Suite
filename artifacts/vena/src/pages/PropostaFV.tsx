import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Download, Eye } from "lucide-react";
import { gerarHTMLProposta } from "./propostaTemplate";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PagamentoLinha = { forma: string; qtd: string; valor: string };

type FormData = {
  // mala direta
  nomeCliente: string; cpfCnpj: string; cidade: string; estado: string; data: string;
  // tabela técnica
  kwp: string; areaM2: string; kwhMes: string;
  quantidadePaineis: string; moduloW: string;
  baseInstalacao: string; inversor: string;
  // financeiro
  valorAVista: string; valorExtenso: string;
};

const FORM_INICIAL: FormData = {
  nomeCliente: "", cpfCnpj: "", cidade: "", estado: "", data: "",
  kwp: "", areaM2: "", kwhMes: "",
  quantidadePaineis: "", moduloW: "",
  baseInstalacao: "", inversor: "",
  valorAVista: "", valorExtenso: "",
};

// ── Helper API ────────────────────────────────────────────────────────────────

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

function formatarData(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const meses = ["janeiro","fevereiro","março","abril","maio","junho",
                  "julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PropostaFV() {
  const [form, setForm]         = useState<FormData>(FORM_INICIAL);
  const [pagamento, setPagamento] = useState<PagamentoLinha[]>([
    { forma: "À Vista", qtd: "1", valor: "" },
  ]);
  const [formas, setFormas]     = useState({ avista: true, financiamento: false, parcelado: false });
  const [preview, setPreview]   = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba]           = useState<"form" | "preview">("form");

  // ── Campo genérico ──────────────────────────────────────────────────────────

  function campo(id: keyof FormData, label: string, placeholder = "") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
        <Input
          placeholder={placeholder}
          value={form[id]}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
        />
      </div>
    );
  }

  // ── Linhas de pagamento ─────────────────────────────────────────────────────

  function addLinha(forma: string) {
    setPagamento((p) => [...p, { forma, qtd: "", valor: "" }]);
  }

  function updateLinha(idx: number, key: keyof PagamentoLinha, val: string) {
    setPagamento((p) => p.map((l, i) => i === idx ? { ...l, [key]: val } : l));
  }

  function removeLinha(idx: number) {
    setPagamento((p) => p.filter((_, i) => i !== idx));
  }

  // ── Gerar proposta ──────────────────────────────────────────────────────────

  const gerar = useCallback(() => {
    if (!form.nomeCliente) {
      toast.error("Preencha o nome do cliente.");
      return null;
    }
    const linhasFiltradas = pagamento.filter((l) => {
      if (!formas.avista && l.forma === "À Vista") return false;
      if (!formas.financiamento && l.forma.toLowerCase().includes("financ")) return false;
      if (!formas.parcelado && l.forma.toLowerCase().includes("parcel")) return false;
      return true;
    });
    const html = gerarHTMLProposta({
      ...form,
      data: formatarData(form.data),
      pagamento: linhasFiltradas,
    });
    setPreview(html);
    return html;
  }, [form, pagamento, formas]);

  // ── Salvar no banco ─────────────────────────────────────────────────────────

  async function salvar() {
    if (!form.nomeCliente) { toast.error("Nome do cliente é obrigatório."); return; }
    setSalvando(true);
    try {
      await apiCall("/propostas", {
        method: "POST",
        body: JSON.stringify({ ...form, pagamento }),
      });
      toast.success("Proposta salva com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────

  function abrirPDF() {
    const html = gerar();
    if (!html) return;
    const printCss = `<style>@media print{@page{margin:0;size:A4}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>`;
    const blob = new Blob([html.replace("</head>", printCss + "</head>")], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Proposta Fotovoltaica</h2>
          <p className="text-muted-foreground">Preencha os dados e gere a proposta personalizada.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { gerar(); setAba("preview"); }}>
            <Eye className="mr-2 h-4 w-4" /> Pré-visualizar
          </Button>
          <Button variant="outline" onClick={abrirPDF}>
            <Download className="mr-2 h-4 w-4" /> Gerar PDF
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            <FileText className="mr-2 h-4 w-4" />
            {salvando ? "Salvando..." : "Salvar Proposta"}
          </Button>
        </div>
      </div>

      {/* Abas internas */}
      <div className="flex gap-1 border-b">
        {(["form", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { if (t === "preview") gerar(); setAba(t); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              aba === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "form" ? "📋 Dados" : "👁 Preview"}
          </button>
        ))}
      </div>

      {/* ── ABA FORM ── */}
      {aba === "form" && (
        <div className="space-y-4">

          {/* Mala direta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Dados do Cliente
                <Badge variant="outline" className="text-xs font-mono text-orange-600 border-orange-300">mala direta</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {campo("nomeCliente", "Nome do Cliente *", "Ex: Wanda Vellasco Sócrates")}
              {campo("cpfCnpj", "CPF / CNPJ", "000.000.000-00")}
              {campo("cidade", "Cidade", "Ex: Palmeiras de Goiás")}
              {campo("estado", "Estado (UF)", "GO")}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Data da Proposta</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Tabela técnica */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Especificações Técnicas
                <Badge variant="outline" className="text-xs font-mono text-green-700 border-green-400">tabela</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {campo("kwp", "Potência (kWp)", "16,12")}
              {campo("areaM2", "Área (m²)", "104")}
              {campo("kwhMes", "Geração mensal (kWh)", "2.000")}
              {campo("quantidadePaineis", "Qtd. Painéis", "27")}
              {campo("moduloW", "Módulo (W)", "620")}
              {campo("baseInstalacao", "Base de Instalação", "Estrutura de Telhado")}
              <div className="col-span-3">
                {campo("inversor", "Inversor", "01x Inversor Solis Mono 10kW")}
              </div>
            </CardContent>
          </Card>

          {/* Valor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Valor do Investimento
                <Badge variant="outline" className="text-xs font-mono text-green-700 border-green-400">tabela</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {campo("valorAVista", "Valor à Vista", "R$ 37.000,00")}
              {campo("valorExtenso", "Valor por Extenso", "Trinta e sete mil reais")}
            </CardContent>
          </Card>

          {/* Condições de pagamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Checkboxes formas */}
              <div className="flex flex-wrap gap-3">
                {([
                  { key: "avista",        label: "💵 À Vista" },
                  { key: "financiamento", label: "🏦 Financiamento" },
                  { key: "parcelado",     label: "💳 Parcelado" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    formas[key] ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}>
                    <input
                      type="checkbox"
                      checked={formas[key]}
                      onChange={(e) => setFormas((f) => ({ ...f, [key]: e.target.checked }))}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* Tabela de linhas */}
              {pagamento.length > 0 && (
                <div className="rounded-lg overflow-hidden border">
                  <div className="grid grid-cols-[1fr_120px_160px_40px] gap-0 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Forma de Pagamento</span>
                    <span>Nº Parcelas</span>
                    <span>Valor da Parcela</span>
                    <span />
                  </div>
                  {pagamento.map((linha, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_120px_160px_40px] gap-0 px-3 py-2 border-t items-center">
                      <Input
                        className="h-7 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
                        placeholder="Ex: Sicredi 60x"
                        value={linha.forma}
                        onChange={(e) => updateLinha(idx, "forma", e.target.value)}
                      />
                      <Input
                        className="h-7 border-0 shadow-none focus-visible:ring-0 px-1 text-sm"
                        placeholder="Ex: 60"
                        value={linha.qtd}
                        onChange={(e) => updateLinha(idx, "qtd", e.target.value)}
                      />
                      <Input
                        className="h-7 border-0 shadow-none focus-visible:ring-0 px-1 text-sm"
                        placeholder="Ex: R$ 850,00"
                        value={linha.valor}
                        onChange={(e) => updateLinha(idx, "valor", e.target.value)}
                      />
                      <button onClick={() => removeLinha(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botões adicionar linha */}
              <div className="flex gap-2 flex-wrap">
                {formas.avista        && <Button size="sm" variant="outline" onClick={() => addLinha("À Vista")}><Plus className="h-3 w-3 mr-1" />À Vista</Button>}
                {formas.financiamento && <Button size="sm" variant="outline" onClick={() => addLinha("Financiamento")}><Plus className="h-3 w-3 mr-1" />Financiamento</Button>}
                {formas.parcelado     && <Button size="sm" variant="outline" onClick={() => addLinha("Parcelado")}><Plus className="h-3 w-3 mr-1" />Parcelado</Button>}
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ABA PREVIEW ── */}
      {aba === "preview" && (
        <div className="rounded-xl border overflow-hidden">
          {preview ? (
            <iframe
              srcDoc={preview}
              className="w-full border-0"
              style={{ height: "800px" }}
              title="Preview da proposta"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Preencha os dados e clique em Pré-visualizar.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
