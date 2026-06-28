// artifacts/vena/src/pages/monitor-precos.tsx
// Substitua o arquivo inteiro por este conteúdo

import { useState } from "react";
import {
  useListMonitoredProducts,
  useCreateMonitoredProduct,
  useDeleteMonitoredProduct,
  getListMonitoredProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, Plus, TrendingDown, TrendingUp, Sparkles, Trash2,
  Link2, Bell, BellRing, BellOff, Pencil, ExternalLink, Crown, X,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Tipos ────────────────────────────────────────────────────────────────────

type ProductLink = {
  id: number;
  supplierName: string;
  url: string;
  currentPrice: number | null;
  isMain: boolean;
};

type Product = {
  id: number;
  name: string;
  category: string;
  url?: string;
  currentPrice: number;
  lowestPrice30d: number;
  lowestPrice60d: number;
  lowestPrice90d: number;
  priceChangePercent: number;
  alertThresholdPercent: number;
  aiInsight?: string;
  links: ProductLink[];
  bestLink?: ProductLink | null;
};

// ── API Helpers ───────────────────────────────────────────────────────────────

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`/api/price-monitor${path}`, {
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

function detectMarketplace(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("mercadolivre")) return "Mercado Livre";
  if (u.includes("amazon")) return "Amazon";
  if (u.includes("shopee")) return "Shopee";
  if (u.includes("americanas")) return "Americanas";
  if (u.includes("magalu") || u.includes("magazineluiza")) return "Magazine Luiza";
  return "Distribuidor";
}

// ── Modal: Adicionar Produto ──────────────────────────────────────────────────

function AddProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { mutate: createProduct, isPending } = useCreateMonitoredProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMonitoredProductsQueryKey() });
        toast.success("Produto adicionado ao monitoramento!");
        onClose();
      },
      onError: () => toast.error("Erro ao adicionar produto."),
    },
  });

  const [form, setForm] = useState({
    name: "", category: "", url: "", currentPrice: "", alertThresholdPercent: "10",
  });

  function handleSubmit() {
    if (!form.name || !form.currentPrice) { toast.error("Nome e preço são obrigatórios."); return; }
    const price = parseFloat(form.currentPrice.replace(",", "."));
    if (isNaN(price) || price <= 0) { toast.error("Informe um preço válido."); return; }
    createProduct({
      data: {
        name: form.name,
        category: form.category || detectMarketplace(form.url),
        url: form.url || null,
        currentPrice: price,
        alertThresholdPercent: parseFloat(form.alertThresholdPercent) || 10,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Adicionar Produto ao Monitoramento</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do produto *</Label>
            <Input placeholder="Ex: Cabo PFXB 6mm²" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input placeholder="Ex: Cabos, Disjuntores..." value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Link principal</Label>
            <div className="relative">
              <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="https://..." className="pl-8" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço atual (R$) *</Label>
              <Input placeholder="0,00" value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Alertar em queda (%)</Label>
              <Input placeholder="10" value={form.alertThresholdPercent} onChange={e => setForm(f => ({ ...f, alertThresholdPercent: e.target.value }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando..." : "Monitorar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal: Editar Produto ─────────────────────────────────────────────────────

function EditProductModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    currentPrice: product.currentPrice.toString(),
    alertThresholdPercent: product.alertThresholdPercent.toString(),
  });
  const [isPending, setIsPending] = useState(false);

  async function handleSave() {
    setIsPending(true);
    try {
      await apiCall(`/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          currentPrice: parseFloat(form.currentPrice.replace(",", ".")),
          alertThresholdPercent: parseFloat(form.alertThresholdPercent),
        }),
      });
      toast.success("Produto atualizado!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço atual (R$)</Label>
              <Input value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Alerta em queda (%)</Label>
              <Input value={form.alertThresholdPercent} onChange={e => setForm(f => ({ ...f, alertThresholdPercent: e.target.value }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal: Gerenciar Links ────────────────────────────────────────────────────

function LinksModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [links, setLinks] = useState<ProductLink[]>(product.links ?? []);
  const [newLink, setNewLink] = useState({ supplierName: "", url: "", currentPrice: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ supplierName: "", url: "", currentPrice: "" });

  async function handleAddLink() {
    if (!newLink.url) { toast.error("URL é obrigatória."); return; }
    setIsAdding(true);
    try {
      const created = await apiCall(`/products/${product.id}/links`, {
        method: "POST",
        body: JSON.stringify({
          supplierName: newLink.supplierName || detectMarketplace(newLink.url),
          url: newLink.url,
          currentPrice: newLink.currentPrice ? parseFloat(newLink.currentPrice.replace(",", ".")) : null,
          isMain: links.length === 0,
        }),
      });
      setLinks(l => [...l, created]);
      setNewLink({ supplierName: "", url: "", currentPrice: "" });
      toast.success("Link adicionado!");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteLink(linkId: number) {
    try {
      await apiCall(`/products/${product.id}/links/${linkId}`, { method: "DELETE" });
      setLinks(l => l.filter(x => x.id !== linkId));
      toast.success("Link removido.");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function startEdit(link: ProductLink) {
    setEditingId(link.id);
    setEditForm({
      supplierName: link.supplierName,
      url: link.url,
      currentPrice: link.currentPrice?.toString() ?? "",
    });
  }

  async function handleSaveEdit(linkId: number) {
    try {
      const updated = await apiCall(`/products/${product.id}/links/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify({
          supplierName: editForm.supplierName,
          url: editForm.url,
          currentPrice: editForm.currentPrice ? parseFloat(editForm.currentPrice.replace(",", ".")) : null,
        }),
      });
      setLinks(l => l.map(x => x.id === linkId ? updated : x));
      setEditingId(null);
      toast.success("Link atualizado!");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // Ordena por menor preço para comparação
  const sorted = [...links].sort((a, b) => {
    if (a.currentPrice === null) return 1;
    if (b.currentPrice === null) return -1;
    return a.currentPrice - b.currentPrice;
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Links de Preço — {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lista de links existentes */}
          {sorted.length > 0 && (
            <div className="space-y-2">
              <Label>Links cadastrados</Label>
              {sorted.map((link, idx) => (
                <div key={link.id} className="border rounded-lg p-3 space-y-2">
                  {editingId === link.id ? (
                    <div className="space-y-2">
                      <Input placeholder="Nome do fornecedor" value={editForm.supplierName} onChange={e => setEditForm(f => ({ ...f, supplierName: e.target.value }))} />
                      <Input placeholder="URL" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} />
                      <Input placeholder="Preço atual (R$)" value={editForm.currentPrice} onChange={e => setEditForm(f => ({ ...f, currentPrice: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(link.id)}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {idx === 0 && link.currentPrice !== null && (
                          <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" title="Menor preço" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{link.supplierName}</span>
                            {link.isMain && <Badge variant="outline" className="text-xs">Principal</Badge>}
                          </div>
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{link.url}</span>
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {link.currentPrice !== null && (
                          <span className={`font-bold text-sm ${idx === 0 ? "text-secondary" : ""}`}>
                            {formatCurrency(link.currentPrice)}
                          </span>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(link)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDeleteLink(link.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Adicionar novo link */}
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <Label className="text-sm font-medium">Adicionar novo link</Label>
            <Input
              placeholder="Nome do fornecedor (ex: Shopee, Amazon...)"
              value={newLink.supplierName}
              onChange={e => setNewLink(f => ({ ...f, supplierName: e.target.value }))}
            />
            <div className="relative">
              <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://..."
                className="pl-8"
                value={newLink.url}
                onChange={e => setNewLink(f => ({ ...f, url: e.target.value }))}
              />
            </div>
            <Input
              placeholder="Preço atual neste link (R$)"
              value={newLink.currentPrice}
              onChange={e => setNewLink(f => ({ ...f, currentPrice: e.target.value }))}
            />
            <Button onClick={handleAddLink} disabled={isAdding} className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {isAdding ? "Adicionando..." : "Adicionar link"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Atualização Rápida de Preço ───────────────────────────────────────────────

function QuickPriceLinks({ productId, links, onSaved }: {
  productId: number;
  links: ProductLink[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sorted = [...links]
    .sort((a, b) => {
      if (a.currentPrice === null) return 1;
      if (b.currentPrice === null) return -1;
      return a.currentPrice - b.currentPrice;
    });

  async function handleSavePrice(linkId: number) {
    const price = parseFloat(priceInput.replace(",", "."));
    if (isNaN(price) || price <= 0) { toast.error("Preço inválido."); return; }
    setIsSaving(true);
    try {
      await apiCall(`/products/${productId}/links/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify({ currentPrice: price }),
      });
      toast.success("Preço atualizado!");
      setEditing(null);
      setPriceInput("");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {sorted.slice(0, 4).map((link, idx) => (
        <div key={link.id} className="text-xs">
          {editing === link.id ? (
            <div className="flex items-center gap-1.5">
              <span className="truncate text-muted-foreground flex-1 min-w-0">{link.supplierName}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-muted-foreground">R$</span>
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-20 h-6 px-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSavePrice(link.id);
                    if (e.key === "Escape") { setEditing(null); setPriceInput(""); }
                  }}
                />
                <button
                  onClick={() => handleSavePrice(link.id)}
                  disabled={isSaving}
                  className="h-6 px-1.5 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "..." : "✓"}
                </button>
                <button
                  onClick={() => { setEditing(null); setPriceInput(""); }}
                  className="h-6 px-1 rounded hover:bg-muted text-muted-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 group">
              <div className="flex items-center gap-1.5 min-w-0">
                {idx === 0 && link.currentPrice !== null && (
                  <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                )}
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline truncate flex items-center gap-1">
                  {link.supplierName}
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`font-medium ${idx === 0 && link.currentPrice !== null ? "text-secondary" : "text-muted-foreground"}`}>
                  {link.currentPrice !== null ? formatCurrency(link.currentPrice) : "—"}
                </span>
                <button
                  onClick={() => {
                    setEditing(link.id);
                    setPriceInput(link.currentPrice?.toString() ?? "");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  title="Atualizar preço"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {links.length > 4 && (
        <p className="text-xs text-muted-foreground">+{links.length - 4} links</p>
      )}
    </div>
  );
}

// ── Card de Produto ───────────────────────────────────────────────────────────

function ProductCard({ product, onRefresh }: { product: Product; onRefresh: () => void }) {
  const queryClient = useQueryClient();
  const { mutate: deleteProduct } = useDeleteMonitoredProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMonitoredProductsQueryKey() });
        toast.success("Produto removido.");
      },
    },
  });
  const [showEdit, setShowEdit] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  const change = product.priceChangePercent ?? 0;
  const isDrop = change < -1;
  const isRise = change > 1;
  const AlertIcon = isDrop ? BellRing : isRise ? BellOff : Bell;

  return (
    <>
      <Card className="overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight truncate">{product.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {change !== 0 && (
                <Badge variant="outline" className={isDrop ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {isDrop ? <TrendingDown className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3" />}
                  {Math.abs(change).toFixed(1)}%
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => setShowEdit(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" title="Excluir" onClick={() => deleteProduct({ id: product.id })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-1 space-y-3">
          <div>
            <span className="text-xs text-muted-foreground">Preço Atual</span>
            <div className="text-2xl font-bold text-primary">{formatCurrency(product.currentPrice)}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
            {[
              { label: "Mín 30d", value: product.lowestPrice30d },
              { label: "Mín 60d", value: product.lowestPrice60d },
              { label: "Mín 90d", value: product.lowestPrice90d },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm font-medium">{formatCurrency(value)}</div>
              </div>
            ))}
          </div>

          {/* Comparação de links com atualização rápida */}
          {product.links && product.links.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Comparação de preços</p>
              <QuickPriceLinks productId={product.id} links={product.links} onSaved={onRefresh} />
            </div>
          )}

          <div className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${isDrop ? "bg-secondary/10 text-secondary" : isRise ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {isDrop ? `Queda de ${Math.abs(change).toFixed(1)}% — bom momento para comprar.`
                : isRise ? `Alta de ${change.toFixed(1)}% — aguarde estabilização.`
                : "Preço estável no período."}
            </span>
          </div>
        </CardContent>

        {product.aiInsight && (
          <CardFooter className="bg-muted/40 p-3 border-t flex gap-2.5 items-start">
            <div className="mt-0.5 bg-accent/20 p-1.5 rounded-md text-accent shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{product.aiInsight}</p>
          </CardFooter>
        )}

        <div className="px-4 pb-3 pt-1 border-t">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => setShowLinks(true)}>
            <Link2 className="h-3.5 w-3.5" />
            Gerenciar links ({product.links?.length ?? 0})
          </Button>
        </div>
      </Card>

      {showEdit && (
        <EditProductModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSaved={onRefresh}
        />
      )}
      {showLinks && (
        <LinksModal
          product={product}
          onClose={() => setShowLinks(false)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────

export function MonitorPrecos() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useListMonitoredProducts({
    query: { queryKey: getListMonitoredProductsQueryKey() },
  });

  const filtered = products?.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  function refresh() {
    queryClient.invalidateQueries({ queryKey: getListMonitoredProductsQueryKey() });
  }

  const lowPriceCount = products?.filter((p: any) => (p.priceChangePercent ?? 0) < -5).length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitor de Preços</h2>
          <p className="text-muted-foreground">
            Acompanhamento e comparação de preços entre fornecedores.
            {lowPriceCount > 0 && (
              <span className="ml-2 text-secondary font-medium">
                🔔 {lowPriceCount} produto{lowPriceCount > 1 ? "s" : ""} em queda
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
        </Button>
      </div>

      <div className="flex items-center max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos monitorados..."
            className="pl-8 bg-card"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[360px] rounded-xl" />)
        ) : filtered && filtered.length > 0 ? (
          filtered.map((product: any) => (
            <ProductCard key={product.id} product={product} onRefresh={refresh} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center border rounded-lg bg-card">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum produto monitorado ainda.</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Adicionar primeiro produto
            </Button>
          </div>
        )}
      </div>

      <AddProductModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
