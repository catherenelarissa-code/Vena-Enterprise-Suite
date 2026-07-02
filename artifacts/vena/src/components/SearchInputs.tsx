import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Search, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type SearchItem = { id: number; label: string; sub?: string };

// ── Componente base (genérico) ─────────────────────────────────────────────────

function SearchInputBase({
  label,
  icon,
  placeholder,
  items,
  value,
  onChange,
  onSelect,
  loading,
}: {
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  items: SearchItem[];
  value: string;
  onChange: (v: string) => void;
  onSelect: (item: SearchItem) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = items.filter(item =>
    item.label.toLowerCase().includes(value.toLowerCase()) ||
    item.sub?.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <Label className="text-white/60 text-xs flex items-center gap-1">
          {icon} {label}
        </Label>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30 pointer-events-none" />
        <Input
          placeholder={placeholder ?? "Digite para buscar..."}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-8 pr-8 border-white/10 bg-white/5 text-white placeholder:text-white/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); onSelect({ id: 0, label: "" }); setOpen(false); }}
            className="absolute right-2 top-2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {open && value.length > 0 && (
          <div
            className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 overflow-hidden shadow-xl"
            style={{ background: "hsl(220,25%,13%)" }}
          >
            {loading ? (
              <div className="px-3 py-2 text-xs text-white/40">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40">Nenhum resultado.</div>
            ) : (
              <ul className="max-h-52 overflow-y-auto">
                {filtered.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                      onMouseDown={e => {
                        e.preventDefault(); // evita blur antes do click
                        onChange(item.label);
                        onSelect(item);
                        setOpen(false);
                      }}
                    >
                      <span className="text-white">{item.label}</span>
                      {item.sub && (
                        <span className="block text-[11px] text-white/35 mt-0.5">{item.sub}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ClientSearchInput ─────────────────────────────────────────────────────────
//
// Uso:
//   <ClientSearchInput
//     label="Cliente"                   // opcional, padrão "Cliente"
//     value={form.clientName}           // texto exibido no input
//     selectedId={form.clientId}        // id selecionado (número)
//     onChange={(id, name) => setForm(f => ({ ...f, clientId: id, clientName: name }))}
//   />

export function ClientSearchInput({
  label = "Cliente",
  value,
  selectedId,
  onChange,
}: {
  label?: string;
  value: string;
  selectedId?: number | null;
  onChange: (id: number | null, name: string) => void;
}) {
  const [clients, setClients] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/crm/clients`, { credentials: "include" })
      .then(r => r.json())
      .then((data: any[]) =>
        setClients(
          data.map(c => ({
            id: c.id,
            label: c.name,
            sub: [c.cpf_cnpj, c.phone, c.email].filter(Boolean).join(" · ") || undefined,
          }))
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SearchInputBase
      label={label}
      icon={<User className="h-3.5 w-3.5" />}
      placeholder="Digite o nome do cliente..."
      items={clients}
      value={value}
      loading={loading}
      onChange={name => onChange(null, name)}
      onSelect={item => onChange(item.id || null, item.label)}
    />
  );
}

// ── CentroCustoSearchInput ────────────────────────────────────────────────────
//
// Uso:
//   <CentroCustoSearchInput
//     value={form.obraName}             // texto exibido no input
//     selectedId={form.obraId}          // id da obra selecionada
//     onChange={(id, name) => setForm(f => ({ ...f, obraId: id, obraName: name }))}
//   />

export function CentroCustoSearchInput({
  label = "Obra / Centro de Custo",
  value,
  selectedId,
  onChange,
}: {
  label?: string;
  value: string;
  selectedId?: number | null;
  onChange: (id: number | null, name: string) => void;
}) {
  const [obras, setObras] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/projects`, { credentials: "include" })
      .then(r => r.json())
      .then((data: any[]) =>
        setObras(
          data.map(p => ({
            id: p.id,
            label: p.costCenter || p.name,
            sub: [p.client, p.location].filter(Boolean).join(" · ") || undefined,
          }))
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SearchInputBase
      label={label}
      icon={<Building2 className="h-3.5 w-3.5" />}
      placeholder="Digite o centro de custo..."
      items={obras}
      value={value}
      loading={loading}
      onChange={name => onChange(null, name)}
      onSelect={item => onChange(item.id || null, item.label)}
    />
  );
}
