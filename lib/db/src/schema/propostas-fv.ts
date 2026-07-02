import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const prostasFVTable = pgTable("propostas_fv", {
  id: serial("id").primaryKey(),
  // Mala direta
  nomeCliente: text("nome_cliente").notNull(),
  cpfCnpj:     text("cpf_cnpj"),
  cidade:      text("cidade"),
  estado:      text("estado"),
  data:        text("data"),
  // Tabela técnica
  kwp:               text("kwp"),
  areaM2:            text("area_m2"),
  kwhMes:            text("kwh_mes"),
  quantidadePaineis: text("quantidade_paineis"),
  moduloW:           text("modulo_w"),
  baseInstalacao:    text("base_instalacao"),
  inversor:          text("inversor"),
  // Financeiro
  valorAVista:    text("valor_a_vista"),
  valorExtenso:   text("valor_extenso"),
  // Condições de pagamento — array de linhas
  pagamento: jsonb("pagamento").$type<PagamentoLinha[]>().default([]),
  // Meta
  status:    text("status").default("rascunho"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PropostaFV         = typeof prostasFVTable.$inferSelect;
export type InsertPropostaFV   = typeof prostasFVTable.$inferInsert;

// ── Tipos base ───────────────────────────────────────────────────────────────

export type PagamentoLinha = {
  forma: string;
  qtd: string;
  valor: string;
};

export type DadosProposta = {
  // mala direta
  nomeCliente: string;
  cpfCnpj?: string;
  cidade?: string;
  estado?: string;
  data?: string;
  // tabela técnica
  kwp?: string;
  areaM2?: string;
  kwhMes?: string;
  quantidadePaineis?: string;
  moduloW?: string;
  baseInstalacao?: string;
  inversor?: string;
  // financeiro
  valorAVista?: string;
  valorExtenso?: string;
  pagamento?: PagamentoLinha[];
  // layout/branding
  layout?: LayoutConfig;
};

// ── Tipos de configuração de layout ─────────────────────────────────────────

export type CoresConfig = {
  verde01: string;
  verde02: string;
  verde03: string;
  laranja01: string;
  laranja02: string;
  amarelo01: string;
  branco: string;
};

export type FontesConfig = {
  /** Nome da família como aparece no Google Fonts, ex: "Archivo Narrow" */
  familia: string;
  /** Pesos a importar, ex: "400;500;600;700" */
  pesos: string;
  /** Sobrescreve a URL completa do @import, se precisar de algo fora do padrão Google Fonts */
  googleFontUrlOverride?: string;
};

export type IdentidadeConfig = {
  nomeEmpresa: string;
  cnpj: string;
  /** base64 (sem prefixo data:) — se omitido, usa o LOGO_B64 embutido */
  logoBase64?: string;
};

export type CapaConfig = {
  eyebrow: string;
  tituloPrefixo: string;   // ex: "Sistema"
  tituloDestaque: string;  // ex: "Fotovoltaico" — vira <span>
  tituloSufixo: string;    // ex: "Conectado à Rede"
  validadeTexto: string;   // ex: "Válida por 10 dias"
  /** base64 (sem prefixo data:) — se omitido, usa o HERO_B64 embutido */
  imagemFundoBase64?: string;
};

export type SecaoId =
  | "empresa-intro"
  | "vmv"
  | "portfolio"
  | "processo"
  | "specs"
  | "garantias"
  | "investimento"
  | "vantagens"
  | "sobre"
  | "assinaturas";

export type SecoesConfig = {
  ordem: SecaoId[];
  visiveis: Record<SecaoId, boolean>;
};

export type LayoutConfig = {
  identidade: IdentidadeConfig;
  cores: CoresConfig;
  fontes: FontesConfig;
  capa: CapaConfig;
  secoes: SecoesConfig;
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  identidade: {
    nomeEmpresa: "Vena Engenharia",
    cnpj: "54.544.330/0001-77",
  },
  cores: {
    verde01: "#21362D",
    verde02: "#146446",
    verde03: "#CBFF2E",
    laranja01: "#FF8200",
    laranja02: "#FFAA00",
    amarelo01: "#FFE664",
    branco: "#FFFFFF",
  },
  fontes: {
    familia: "Archivo Narrow",
    pesos: "400;500;600;700",
  },
  capa: {
    eyebrow: "Proposta de Serviço",
    tituloPrefixo: "Sistema",
    tituloDestaque: "Fotovoltaico",
    tituloSufixo: "Conectado à Rede",
    validadeTexto: "Válida por 10 dias",
  },
  secoes: {
    ordem: [
      "empresa-intro",
      "vmv",
      "portfolio",
      "processo",
      "specs",
      "garantias",
      "investimento",
      "vantagens",
      "sobre",
      "assinaturas",
    ],
    visiveis: {
      "empresa-intro": true,
      vmv: true,
      portfolio: true,
      processo: true,
      specs: true,
      garantias: true,
      investimento: true,
      vantagens: true,
      sobre: true,
      assinaturas: true,
    },
  },
};

function mergeLayout(partial?: Partial<LayoutConfig>): LayoutConfig {
  if (!partial) return DEFAULT_LAYOUT;
  return {
    ...DEFAULT_LAYOUT,
    ...partial,
    identidade: { ...DEFAULT_LAYOUT.identidade, ...partial.identidade },
    cores: { ...DEFAULT_LAYOUT.cores, ...partial.cores },
    fontes: { ...DEFAULT_LAYOUT.fontes, ...partial.fontes },
    capa: { ...DEFAULT_LAYOUT.capa, ...partial.capa },
    secoes: {
      ordem: partial.secoes?.ordem ?? DEFAULT_LAYOUT.secoes.ordem,
      visiveis: { ...DEFAULT_LAYOUT.secoes.visiveis, ...partial.secoes?.visiveis },
    },
  };
}

// ── Helper: linhas da tabela de pagamento ───────────────────────────────────

function linhasPagamentoHTML(pagamento: PagamentoLinha[] = []): string {
  if (pagamento.length === 0) {
    return `<tr><td colspan="3" style="text-align:center;color:rgba(255,255,255,0.35);">Nenhuma forma de pagamento selecionada</td></tr>`;
  }
  return pagamento
    .map(
      (l) => `<tr>
        <td>${l.forma || "—"}</td>
        <td>${l.qtd || "—"}</td>
        <td>${l.valor || "—"}</td>
      </tr>`
    )
    .join("");
}

// ── CSS estático (usa var(--...) — cores/fontes injetadas separadamente) ────

const BASE_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:var(--fonte-principal),Arial,sans-serif; background:var(--verde-01); color:var(--branco); font-size:15px; line-height:1.55; }
  .capa { min-height:100vh; position:relative; display:flex; flex-direction:column; justify-content:space-between; padding:56px 64px; overflow:hidden; }
  .capa-bg { position:absolute; inset:0; background-size:cover; background-position:center 30%; filter:brightness(0.38) saturate(0.8); }
  .capa-overlay { position:absolute; inset:0; background:linear-gradient(160deg,rgba(20,100,70,0.55) 0%,rgba(33,54,45,0.90) 60%,#0d1f16 100%); }
  .capa > * { position:relative; z-index:2; }
  .capa-line { position:absolute; top:0; right:240px; width:1px; height:100%; background:linear-gradient(to bottom,transparent 0%,var(--verde-03) 25%,var(--verde-03) 75%,transparent 100%); opacity:0.18; z-index:1; }
  .logo-mark img { height:140px; width:auto; }
  .capa-body { flex:1; display:flex; flex-direction:column; justify-content:center; padding:60px 0 40px; }
  .capa-eyebrow { display:flex; align-items:center; gap:14px; margin-bottom:28px; }
  .capa-eyebrow-line { width:36px; height:2px; background:var(--laranja-01); }
  .capa-eyebrow-text { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--laranja-01); font-weight:700; }
  .capa-titulo { font-size:52px; font-weight:700; color:var(--branco); line-height:1.08; max-width:600px; margin-bottom:10px; }
  .capa-titulo span { color:var(--verde-03); }
  .capa-subtitulo { font-size:20px; color:rgba(255,255,255,0.55); margin-bottom:52px; }
  .capa-cliente { border-left:3px solid var(--laranja-01); padding-left:22px; }
  .capa-cliente .label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--laranja-02); font-weight:700; margin-bottom:5px; }
  .capa-cliente .nome { font-size:24px; font-weight:700; color:var(--branco); }
  .capa-cliente .cpf { font-size:13px; color:rgba(255,255,255,0.5); margin-top:3px; }
  .capa-footer { display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(203,255,46,0.15); padding-top:20px; }
  .capa-footer .local { font-size:12px; color:rgba(255,255,255,0.45); }
  .capa-footer .validade { font-size:11px; color:var(--amarelo-01); font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .empresa-intro { background:var(--verde-02); padding:72px 64px; position:relative; overflow:hidden; }
  .empresa-intro::before { content:''; position:absolute; top:-100px; right:-100px; width:400px; height:400px; background:radial-gradient(circle,rgba(203,255,46,0.09) 0%,transparent 70%); }
  .empresa-intro-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
  .empresa-intro-img { border-radius:16px; overflow:hidden; height:360px; }
  .empresa-intro-img img { width:100%; height:100%; object-fit:cover; }
  .section-label { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--laranja-01); font-weight:700; margin-bottom:8px; }
  .section-title { font-size:34px; font-weight:700; color:var(--branco); line-height:1.15; margin-bottom:24px; }
  .section-title span { color:var(--verde-03); }
  .empresa-desc { font-size:15px; color:rgba(255,255,255,0.70); line-height:1.75; margin-bottom:16px; }
  .empresa-tagline { font-size:18px; font-weight:700; color:var(--verde-03); border-left:3px solid var(--laranja-01); padding-left:16px; line-height:1.4; margin-top:24px; }
  .empresa-exp { display:inline-flex; align-items:center; gap:10px; background:rgba(0,0,0,0.25); border-radius:8px; padding:12px 20px; margin-top:24px; }
  .empresa-exp .num { font-size:28px; font-weight:700; color:var(--laranja-01); line-height:1; }
  .empresa-exp .txt { font-size:13px; color:rgba(255,255,255,0.6); line-height:1.3; }
  .vmv { padding:72px 64px; background:var(--verde-01); }
  .vmv-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:40px; }
  .vmv-card { background:rgba(255,255,255,0.04); border:1px solid rgba(203,255,46,0.10); border-radius:14px; padding:32px 26px; position:relative; overflow:hidden; }
  .vmv-card::after { content:''; position:absolute; bottom:0; left:0; width:100%; height:3px; background:var(--laranja-01); }
  .vmv-card.missao::after { background:var(--verde-03); }
  .vmv-card.valores::after { background:var(--amarelo-01); }
  .vmv-badge { display:inline-block; font-size:9px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; padding:4px 10px; border-radius:4px; margin-bottom:18px; background:rgba(255,130,0,0.15); color:var(--laranja-01); }
  .vmv-card.missao .vmv-badge { background:rgba(203,255,46,0.12); color:var(--verde-03); }
  .vmv-card.valores .vmv-badge { background:rgba(255,230,100,0.12); color:var(--amarelo-01); }
  .vmv-title { font-size:18px; font-weight:700; color:var(--branco); margin-bottom:12px; line-height:1.3; }
  .vmv-text { font-size:13.5px; color:rgba(255,255,255,0.60); line-height:1.65; }
  .portfolio { padding:72px 64px; background:linear-gradient(160deg,#0f2318 0%,var(--verde-01) 100%); }
  .portfolio-grid { display:grid; grid-template-columns:2fr 1fr; grid-template-rows:260px 200px; gap:12px; margin-top:36px; }
  .portfolio-item { border-radius:12px; overflow:hidden; }
  .portfolio-item img { width:100%; height:100%; object-fit:cover; }
  .portfolio-item.tall { grid-row:span 2; }
  .processo { background:var(--verde-01); padding:72px 64px; }
  .processo-intro { font-size:14px; color:rgba(255,255,255,0.48); margin-top:-16px; margin-bottom:36px; line-height:1.65; max-width:680px; }
  .processo-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .passo { background:rgba(255,255,255,0.04); border:1px solid rgba(203,255,46,0.08); border-radius:12px; padding:28px 28px 24px; position:relative; overflow:hidden; }
  .passo::before { content:''; position:absolute; top:0; left:0; width:3px; height:100%; background:var(--laranja-01); border-radius:12px 0 0 12px; }
  .passo-num { font-size:10px; font-weight:700; letter-spacing:2px; color:var(--laranja-01); text-transform:uppercase; margin-bottom:10px; }
  .passo-titulo-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(203,255,46,0.6); margin-bottom:2px; }
  .passo-titulo { font-size:20px; font-weight:700; color:var(--branco); margin-bottom:10px; }
  .passo-desc { font-size:13px; color:rgba(255,255,255,0.62); line-height:1.6; }
  .specs { background:linear-gradient(160deg,#0f2318 0%,var(--verde-02) 100%); padding:72px 64px; }
  .specs-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
  .spec-card { background:rgba(0,0,0,0.25); border-radius:12px; padding:28px 22px; text-align:center; border:1px solid rgba(255,255,255,0.07); position:relative; overflow:hidden; }
  .spec-card::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:40%; height:2px; background:var(--laranja-01); border-radius:2px; }
  .spec-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.40); margin-bottom:12px; }
  .spec-value { font-size:30px; font-weight:700; color:var(--verde-03); line-height:1; margin-bottom:4px; }
  .spec-unit { font-size:13px; color:rgba(255,255,255,0.45); }
  .inversor-card { background:rgba(255,130,0,0.10); border:1px solid rgba(255,130,0,0.28); border-radius:12px; padding:24px 28px; display:flex; align-items:center; gap:20px; margin-bottom:24px; }
  .inversor-icon { width:52px; height:52px; background:var(--laranja-01); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
  .inversor-info .label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--laranja-02); margin-bottom:4px; }
  .inversor-info .value { font-size:20px; font-weight:700; color:var(--branco); }
  .inversor-info .sub { font-size:12px; color:rgba(255,255,255,0.45); margin-top:2px; }
  .capacidade-note { background:rgba(203,255,46,0.07); border-left:3px solid var(--verde-03); border-radius:0 8px 8px 0; padding:14px 20px; font-size:13px; color:rgba(255,255,255,0.70); }
  .capacidade-note strong { color:var(--verde-03); }
  .garantias { background:var(--verde-01); padding:72px 64px; }
  .garantias-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .garantia-item { background:rgba(255,255,255,0.04); border-radius:10px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.06); }
  .garantia-nome { font-size:14px; color:rgba(255,255,255,0.80); }
  .garantia-nome small { display:block; font-size:11px; color:rgba(255,255,255,0.35); margin-top:2px; }
  .garantia-badge { background:var(--laranja-01); color:var(--branco); font-size:13px; font-weight:700; padding:5px 14px; border-radius:20px; white-space:nowrap; }
  .investimento { background:linear-gradient(135deg,#0a1f14 0%,var(--verde-01) 100%); padding:72px 64px; }
  .preco-hero { text-align:center; padding:48px 32px; background:rgba(255,255,255,0.03); border-radius:20px; border:1px solid rgba(203,255,46,0.12); position:relative; overflow:hidden; margin-bottom:36px; }
  .preco-hero .tag { display:inline-block; background:rgba(203,255,46,0.12); color:var(--verde-03); font-size:10px; letter-spacing:2px; text-transform:uppercase; padding:5px 14px; border-radius:20px; margin-bottom:20px; font-weight:700; }
  .preco-hero .valor { font-size:56px; font-weight:700; color:var(--laranja-01); line-height:1; margin-bottom:8px; }
  .preco-hero .extenso { font-size:15px; color:rgba(255,255,255,0.45); letter-spacing:1px; }
  .preco-hero .modalidade { display:inline-block; margin-top:16px; background:var(--laranja-01); color:var(--branco); font-size:12px; font-weight:700; padding:6px 22px; border-radius:20px; letter-spacing:1px; text-transform:uppercase; }
  .servicos-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:40px; }
  .servico-box { background:rgba(255,255,255,0.04); border-radius:12px; padding:24px; border:1px solid rgba(255,255,255,0.07); }
  .servico-box .box-title { font-size:10px; letter-spacing:2px; text-transform:uppercase; font-weight:700; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.07); }
  .servico-box.inclusos .box-title { color:var(--verde-03); }
  .servico-box.exclusos .box-title { color:rgba(255,100,80,0.9); }
  .servico-box ul { list-style:none; }
  .servico-box ul li { font-size:13.5px; color:rgba(255,255,255,0.72); padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); display:flex; align-items:flex-start; gap:10px; line-height:1.4; }
  .servico-box ul li:last-child { border-bottom:none; }
  .dot-inc { width:6px; height:6px; background:var(--verde-03); border-radius:50%; flex-shrink:0; margin-top:5px; }
  .dot-exc { width:6px; height:6px; background:rgba(255,100,80,0.8); border-radius:50%; flex-shrink:0; margin-top:5px; }
  .pag-title { font-size:13px; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
  .pag-table { width:100%; border-collapse:collapse; margin-bottom:20px; border-radius:12px; overflow:hidden; }
  .pag-table thead tr { background:rgba(255,130,0,0.14); }
  .pag-table th { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--laranja-02); padding:16px 24px; text-align:left; border-bottom:1px solid rgba(255,130,0,0.18); }
  .pag-table tbody tr { border-bottom:1px solid rgba(255,255,255,0.05); }
  .pag-table tbody tr:nth-child(even) { background:rgba(255,255,255,0.02); }
  .pag-table td { padding:16px 24px; font-size:14px; color:rgba(255,255,255,0.60); }
  .pag-table td:first-child { color:rgba(255,255,255,0.85); font-weight:600; }
  .pag-note { background:rgba(255,170,0,0.07); border-left:3px solid var(--laranja-02); border-radius:0 8px 8px 0; padding:14px 20px; font-size:12px; color:rgba(255,255,255,0.50); margin-top:4px; }
  .vantagens { background:linear-gradient(160deg,var(--verde-02) 0%,#0a1e13 100%); padding:72px 64px; }
  .vantagens-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .vantagem-card { background:rgba(0,0,0,0.20); border-radius:12px; padding:26px 22px; border:1px solid rgba(203,255,46,0.07); }
  .vantagem-icon { width:42px; height:42px; background:rgba(255,130,0,0.14); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; margin-bottom:14px; }
  .vantagem-title { font-size:14px; font-weight:700; color:var(--branco); margin-bottom:8px; }
  .vantagem-desc { font-size:13px; color:rgba(255,255,255,0.52); line-height:1.55; }
  .sobre { background:var(--verde-01); padding:72px 64px; }
  .sobre-texto { font-size:15px; color:rgba(255,255,255,0.68); line-height:1.80; max-width:720px; }
  .sobre-texto strong { color:var(--branco); font-weight:700; }
  .assinaturas { background:linear-gradient(135deg,#0a1f14 0%,var(--verde-01) 100%); padding:72px 64px 80px; }
  .assinaturas .data { font-size:13px; color:rgba(255,255,255,0.38); margin-bottom:64px; letter-spacing:0.5px; }
  .sig-row { display:grid; grid-template-columns:1fr 1fr; gap:60px; max-width:680px; margin:0 auto; }
  .sig-box { display:flex; flex-direction:column; align-items:center; text-align:center; }
  .sig-titulo { font-size:10px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--laranja-01); margin-bottom:16px; }
  .sig-space { height:70px; }
  .sig-line-wrap { width:100%; position:relative; margin-bottom:16px; }
  .sig-line-wrap::before { content:''; display:block; height:1px; background:rgba(255,255,255,0.22); }
  .sig-line-wrap::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:48px; height:2px; background:var(--laranja-01); }
  .sig-name { font-size:13px; font-weight:700; color:var(--branco); margin-bottom:5px; }
  .sig-detail { font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:0.5px; }
  .divider { height:1px; background:linear-gradient(to right,transparent,var(--laranja-01),transparent); margin:0 64px; opacity:0.22; }
  footer { background:#0d1f16; padding:28px 64px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(203,255,46,0.08); }
  footer .footer-brand img { height:32px; width:auto; }
  footer .footer-cnpj { font-size:11px; color:rgba(255,255,255,0.22); letter-spacing:1px; }
`;

// ── Geradores de :root e @import de fonte ───────────────────────────────────

function buildRootCSS(cores: CoresConfig): string {
  return `:root {
    --verde-01:${cores.verde01}; --verde-02:${cores.verde02}; --verde-03:${cores.verde03};
    --laranja-01:${cores.laranja01}; --laranja-02:${cores.laranja02}; --amarelo-01:${cores.amarelo01};
    --branco:${cores.branco};
    --fonte-principal:'${DEFAULT_LAYOUT.fontes.familia}';
  }`;
}

function buildFontImportCSS(fontes: FontesConfig): string {
  if (fontes.googleFontUrlOverride) {
    return `@import url('${fontes.googleFontUrlOverride}');`;
  }
  const familiaUrl = fontes.familia.replace(/ /g, "+");
  return `@import url('https://fonts.googleapis.com/css2?family=${familiaUrl}:wght@${fontes.pesos}&display=swap');`;
}

// ── Seções (cada uma retorna HTML puro) ─────────────────────────────────────

function renderCapa(d: DadosProposta, layout: LayoutConfig): string {
  const nome = d.nomeCliente || "—";
  const cpf = d.cpfCnpj || "—";
  const cidade = d.cidade || "—";
  const estado = d.estado || "—";
  const data = d.data || "—";
  const kwp = d.kwp || "—";
  const bgImg = layout.capa.imagemFundoBase64 || HERO_B64;
  const logo = layout.identidade.logoBase64 || LOGO_B64;

  return `<section class="capa">
    <div class="capa-bg" style="background-image:url('data:image/jpeg;base64,${bgImg}');"></div>
    <div class="capa-overlay"></div>
    <div class="capa-line"></div>
    <div class="logo-mark">
      <img src="data:image/png;base64,${logo}" alt="${layout.identidade.nomeEmpresa}">
    </div>
    <div class="capa-body">
      <div class="capa-eyebrow">
        <div class="capa-eyebrow-line"></div>
        <div class="capa-eyebrow-text">${layout.capa.eyebrow}</div>
      </div>
      <h1 class="capa-titulo">${layout.capa.tituloPrefixo} <span>${layout.capa.tituloDestaque}</span> ${layout.capa.tituloSufixo}</h1>
      <p class="capa-subtitulo">${kwp} kWp &nbsp;·&nbsp; ${cidade} – ${estado}</p>
      <div class="capa-cliente">
        <div class="label">Cliente</div>
        <div class="nome">${nome}</div>
        <div class="cpf">CPF/CNPJ: ${cpf}</div>
      </div>
    </div>
    <div class="capa-footer">
      <span class="local">${cidade} – ${estado}, ${data}</span>
      <span class="validade">${layout.capa.validadeTexto}</span>
    </div>
  </section>`;
}

function renderEmpresaIntro(layout: LayoutConfig): string {
  return `<section class="empresa-intro">
    <div class="empresa-intro-grid">
      <div class="empresa-intro-img">
        <img src="data:image/jpeg;base64,${TEAM_B64}" alt="Equipe ${layout.identidade.nomeEmpresa}">
      </div>
      <div class="empresa-intro-content">
        <div class="section-label">Quem somos</div>
        <h2 class="section-title">${layout.identidade.nomeEmpresa.split(" ")[0]} <span>${layout.identidade.nomeEmpresa.split(" ").slice(1).join(" ")}</span></h2>
        <p class="empresa-desc"><strong>Especialista em soluções de energia</strong>, a ${layout.identidade.nomeEmpresa} possui mais de 15 anos de experiência no mercado, contando com uma equipe de profissionais altamente qualificados e ampla expertise no desenvolvimento e execução de projetos elétricos.</p>
        <p class="empresa-desc">Atuamos com excelência, segurança e compromisso, entregando soluções eficientes para o agronegócio, o comércio, a indústria e o setor público.</p>
        <div class="empresa-exp">
          <div class="num">+15</div>
          <div class="txt">anos de experiência<br>no setor elétrico</div>
        </div>
        <div class="empresa-tagline">Transforme a força do sol em resultado.</div>
      </div>
    </div>
  </section>`;
}

function renderVMV(): string {
  return `<section class="vmv">
    <div class="section-label">Propósito</div>
    <h2 class="section-title">Visão, Missão e <span>Valores</span></h2>
    <div class="vmv-grid">
      <div class="vmv-card visao"><div class="vmv-badge">Visão</div><div class="vmv-title">Ser referência no setor elétrico</div><p class="vmv-text">Consolidar nossa atuação como referência em engenharia e soluções estratégicas, contribuindo para o desenvolvimento sustentável do setor elétrico.</p></div>
      <div class="vmv-card missao"><div class="vmv-badge">Missão</div><div class="vmv-title">Destravar operações e viabilizar resultados</div><p class="vmv-text">Simplificar processos, eliminar barreiras técnicas e transformar desafios do setor elétrico em soluções seguras, previsíveis e economicamente viáveis.</p></div>
      <div class="vmv-card valores"><div class="vmv-badge">Valores</div><div class="vmv-title">Clareza. Confiança. Compromisso.</div><p class="vmv-text">Clareza para transformar o complexo em simples. Confiança construída com transparência. Compromisso com resultados consistentes.</p></div>
    </div>
  </section>`;
}

function renderPortfolio(): string {
  return `<section class="portfolio">
    <div class="section-label">Projetos Realizados</div>
    <h2 class="section-title">Nossa <span>Expertise</span> em Campo</h2>
    <div class="portfolio-grid">
      <div class="portfolio-item tall"><img src="data:image/jpeg;base64,${DRONE_FARM_B64}" alt="Usina solar aérea"></div>
      <div class="portfolio-item"><img src="data:image/jpeg;base64,${DRONE_PANELS_B64}" alt="Painéis solares"></div>
    </div>
  </section>`;
}

function renderProcesso(): string {
  return `<section class="processo">
    <div class="section-label">Como Funciona</div>
    <h2 class="section-title">Entenda o Processo — <span>Nós Cuidamos de Tudo</span></h2>
    <p class="processo-intro">Projetamos, instalamos, regularizamos e realizamos a operação e manutenção de sistemas fotovoltaicos para diferentes perfis de consumo e portes de operação. Cada projeto é desenvolvido a partir de análises técnicas e econômicas, com estimativas de retorno e payback apresentadas antes da implantação do sistema.</p>
    <div class="processo-grid">
      <div class="passo"><div class="passo-num">Etapa 01</div><div class="passo-titulo-label">Elaboração</div><div class="passo-titulo">Projeto</div><p class="passo-desc">Realizaremos o levantamento detalhado do local de instalação para elaboração do projeto 100% personalizado do seu sistema fotovoltaico, realizado por uma equipe de engenheiros.</p></div>
      <div class="passo"><div class="passo-num">Etapa 02</div><div class="passo-titulo-label">Processo de</div><div class="passo-titulo">Homologação</div><p class="passo-desc">Com o memorial descritivo do projeto, resolveremos toda a aprovação do projeto elétrico junto à concessionária de energia.</p></div>
      <div class="passo"><div class="passo-num">Etapa 03</div><div class="passo-titulo-label">Execução e</div><div class="passo-titulo">Instalação</div><p class="passo-desc">Realizaremos a instalação do sistema, de acordo com sua disponibilidade de horário, com uma equipe de profissionais altamente qualificados.</p></div>
      <div class="passo"><div class="passo-num">Etapa 04</div><div class="passo-titulo-label">Aprovação e</div><div class="passo-titulo">Vistoria</div><p class="passo-desc">Com o sistema aprovado, solicitaremos uma vistoria da Concessionária para a instalação do medidor bidirecional, para geração de créditos.</p></div>
      <div class="passo" style="grid-column:span 2;"><div class="passo-num">Etapa 05</div><div class="passo-titulo-label">Pós-Venda e</div><div class="passo-titulo">Monitoramento</div><p class="passo-desc">Oferecemos o serviço de pós-venda e garantimos o monitoramento do seu sistema em tempo real. Você poderá monitorar seu sistema por aplicativo.</p></div>
    </div>
  </section>`;
}

function renderSpecs(d: DadosProposta): string {
  const kwp = d.kwp || "—";
  const area = d.areaM2 || "—";
  const kwh = d.kwhMes || "—";
  const paineis = d.quantidadePaineis || "—";
  const modulo = d.moduloW || "—";
  const base = d.baseInstalacao || "—";
  const inversor = d.inversor || "—";

  return `<section class="specs">
    <div class="section-label">Seu Projeto</div>
    <h2 class="section-title">Nossa <span>Solução</span></h2>
    <div class="specs-grid">
      <div class="spec-card"><div class="spec-label">Potência do Sistema</div><div class="spec-value">${kwp}</div><div class="spec-unit">kWp</div></div>
      <div class="spec-card"><div class="spec-label">Área do Projeto</div><div class="spec-value">${area}</div><div class="spec-unit">m²</div></div>
      <div class="spec-card"><div class="spec-label">Geração Mensal Estimada</div><div class="spec-value">${kwh}</div><div class="spec-unit">kWh/Mês</div></div>
      <div class="spec-card"><div class="spec-label">Quantidade de Painéis</div><div class="spec-value">${paineis}</div><div class="spec-unit">módulos ${modulo} W</div></div>
      <div class="spec-card" style="grid-column:span 2;"><div class="spec-label">Base de Instalação</div><div class="spec-value" style="font-size:22px;">${base}</div></div>
    </div>
    <div class="inversor-card">
      <div class="inversor-icon">⚡</div>
      <div class="inversor-info">
        <div class="label">Inversor do Projeto</div>
        <div class="value">${inversor}</div>
        <div class="sub">Capacidade máxima: ${paineis} módulos de ${modulo} W</div>
      </div>
    </div>
    <div class="capacidade-note"><strong>Upgrade futuro disponível.</strong> Caso seja necessário, poderá ser feito um upgrade no seu sistema fotovoltaico futuramente.</div>
  </section>`;
}

function renderGarantias(): string {
  return `<section class="garantias">
    <div class="section-label">Segurança</div>
    <h2 class="section-title">Garantimos tudo com <span>Extrema Segurança</span></h2>
    <div class="garantias-grid">
      <div class="garantia-item"><div class="garantia-nome">Painéis Solares <small>Garantia de produto</small></div><div class="garantia-badge">15 anos</div></div>
      <div class="garantia-item"><div class="garantia-nome">Painéis Solares <small>80% de Eficiência</small></div><div class="garantia-badge">25 anos</div></div>
      <div class="garantia-item"><div class="garantia-nome">Inversor <small>Garantia de fabricante</small></div><div class="garantia-badge">10 anos</div></div>
      <div class="garantia-item"><div class="garantia-nome">Instalação <small>Garantia de serviço</small></div><div class="garantia-badge">12 meses</div></div>
    </div>
    <p style="font-size:11px;color:rgba(255,255,255,0.28);margin-top:18px;line-height:1.6;">Eficiências de 80% sobre o produto. A garantia é contra defeitos de fabricação. A garantia dos equipamentos são oferecidas pelo fabricante.</p>
  </section>`;
}

function renderInvestimento(d: DadosProposta): string {
  const valor = d.valorAVista || "—";
  const extenso = d.valorExtenso || "—";
  const trsPagamento = linhasPagamentoHTML(d.pagamento);

  return `<section class="investimento">
    <div class="section-label">Nós Cuidamos do Seu Investimento</div>
    <h2 class="section-title">Valor do Seu <span>Investimento</span></h2>
    <div class="preco-hero">
      <div class="tag">Pagamento à Vista</div>
      <div class="valor">${valor}</div>
      <div class="extenso">${extenso}</div>
      <span class="modalidade">À Vista</span>
    </div>
    <div class="servicos-row">
      <div class="servico-box inclusos"><div class="box-title">Serviços Inclusos</div><ul><li><span class="dot-inc"></span>Conexão até o ponto de energia existente</li></ul></div>
      <div class="servico-box exclusos"><div class="box-title">Serviços Exclusos</div><ul><li><span class="dot-exc"></span>Adequações elétricas ou civis</li></ul></div>
    </div>
    <div class="pag-title">Condições de Pagamento</div>
    <table class="pag-table">
      <thead>
        <tr><th>Forma de Pagamento</th><th>Quantidade de Parcelas</th><th>Valor da Parcela</th></tr>
      </thead>
      <tbody>${trsPagamento}</tbody>
    </table>
    <div class="pag-note">*Simulação de financiamento sujeita à aprovação de crédito. Os valores e pagamentos podem ser alterados de acordo com a financeira escolhida.</div>
  </section>`;
}

function renderVantagens(): string {
  return `<section class="vantagens">
    <div class="section-label">Benefícios</div>
    <h2 class="section-title">São inúmeras vantagens, <span>você só tende a ganhar!</span></h2>
    <div class="vantagens-grid">
      <div class="vantagem-card"><div class="vantagem-icon">⏳</div><div class="vantagem-title">Carência no Primeiro Pagamento</div><p class="vantagem-desc">Carência para o primeiro pagamento de até 120 dias.</p></div>
      <div class="vantagem-card"><div class="vantagem-icon">📈</div><div class="vantagem-title">Valorização do Imóvel</div><p class="vantagem-desc">Valorização de cerca de 8% do seu imóvel.</p></div>
      <div class="vantagem-card"><div class="vantagem-icon">🔇</div><div class="vantagem-title">Sistema Silencioso</div><p class="vantagem-desc">O sistema de energia solar é completamente silencioso.</p></div>
      <div class="vantagem-card"><div class="vantagem-icon">🕰️</div><div class="vantagem-title">Longa Vida Útil</div><p class="vantagem-desc">Possui uma vida útil de 25 anos ou mais.</p></div>
      <div class="vantagem-card"><div class="vantagem-icon">💰</div><div class="vantagem-title">Retorno do Investimento</div><p class="vantagem-desc">Retorno total do investimento feito em cerca de 3 a 7 anos.</p></div>
      <div class="vantagem-card"><div class="vantagem-icon">🌱</div><div class="vantagem-title">Energia Limpa e Sustentável</div><p class="vantagem-desc">É uma energia limpa, sustentável, acessível e de fácil manutenção.</p></div>
    </div>
  </section>`;
}

function renderSobre(layout: LayoutConfig): string {
  return `<section class="sobre">
    <div class="section-label">Sobre a Empresa</div>
    <h2 class="section-title">${layout.identidade.nomeEmpresa.split(" ")[0]} <span>${layout.identidade.nomeEmpresa.split(" ").slice(1).join(" ")}</span></h2>
    <p class="sobre-texto"><strong>${layout.identidade.nomeEmpresa} Ltda</strong> é uma empresa especializada em Consultorias, elaboração de projetos e execução de obras Elétricas e auditorias técnicas no sistema energético brasileiro — obras dentre elas de Subestações Elétricas, Redes de Distribuição Elétrica, Sistemas Fotovoltaicos entre outros. Todas as propostas são pautadas no estudo de viabilidade técnica e econômica.</p>
    <p class="sobre-texto" style="margin-top:16px;">Cada projeto é desenvolvido a partir de análises técnicas e econômicas, com estimativas de retorno e payback apresentadas antes da implantação do sistema.</p>
  </section>`;
}

function renderAssinaturas(d: DadosProposta, layout: LayoutConfig): string {
  const nome = d.nomeCliente || "—";
  const cpf = d.cpfCnpj || "—";
  const cidade = d.cidade || "—";
  const estado = d.estado || "—";
  const data = d.data || "—";

  return `<section class="assinaturas">
    <div class="section-label">Formalização</div>
    <h2 class="section-title" style="margin-bottom:10px;">Aceite da <span>Proposta</span></h2>
    <p class="data">${cidade} – ${estado}, ${data}</p>
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-titulo">Contratante</div>
        <div class="sig-space"></div>
        <div class="sig-line-wrap"></div>
        <div class="sig-name">${nome}</div>
        <div class="sig-detail">CPF/CNPJ: ${cpf}</div>
      </div>
      <div class="sig-box">
        <div class="sig-titulo">Contratada</div>
        <div class="sig-space"></div>
        <div class="sig-line-wrap"></div>
        <div class="sig-name">${layout.identidade.nomeEmpresa} Ltda</div>
        <div class="sig-detail">CNPJ: ${layout.identidade.cnpj}</div>
      </div>
    </div>
  </section>`;
}

function renderFooter(layout: LayoutConfig): string {
  const logo = layout.identidade.logoBase64 || LOGO_B64;
  return `<footer>
    <div class="footer-brand"><img src="data:image/png;base64,${logo}" alt="${layout.identidade.nomeEmpresa}"></div>
    <span class="footer-cnpj">CNPJ ${layout.identidade.cnpj}</span>
  </footer>`;
}

// ── Registro de seções configuráveis ────────────────────────────────────────

const SECAO_RENDERERS: Record<
  SecaoId,
  (d: DadosProposta, layout: LayoutConfig) => string
> = {
  "empresa-intro": (_d, layout) => renderEmpresaIntro(layout),
  vmv: () => renderVMV(),
  portfolio: () => renderPortfolio(),
  processo: () => renderProcesso(),
  specs: (d) => renderSpecs(d),
  garantias: () => renderGarantias(),
  investimento: (d) => renderInvestimento(d),
  vantagens: () => renderVantagens(),
  sobre: (_d, layout) => renderSobre(layout),
  assinaturas: (d, layout) => renderAssinaturas(d, layout),
};

// ── Função principal ─────────────────────────────────────────────────────────

export function gerarHTMLProposta(d: DadosProposta): string {
  const layout = mergeLayout(d.layout);
  const nome = d.nomeCliente || "—";

  const secoesHTML = layout.secoes.ordem
    .filter((id) => layout.secoes.visiveis[id])
    .map((id) => `<div class="divider"></div>\n${SECAO_RENDERERS[id](d, layout)}`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta ${layout.identidade.nomeEmpresa} – ${nome}</title>
<style>
  ${buildFontImportCSS(layout.fontes)}
  ${buildRootCSS(layout.cores)}
  ${BASE_CSS}
</style>
</head>
<body>

${renderCapa(d, layout)}

${secoesHTML}

${renderFooter(layout)}

</body>
</html>`;
}
