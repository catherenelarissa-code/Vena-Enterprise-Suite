// artifacts/vena/src/pages/monitor-precos.tsx
// Substitua o arquivo inteiro por este conteúdo

import { useState } from "react";
import {
  useListMonitoredProducts,
  useCreateMonitoredProduct,
  useDeleteMonitoredProduct,
  useGetProductPriceHistory,
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
import {
  Search, Plus, TrendingDown, TrendingUp, Sparkles, Trash2, Link2, Bell, BellRing, BellOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Modal Adicionar Produto ──────────────────────────────────────────────────

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
    name: "",
    category: "",
    url: "",
    currentPrice: "",
    alertThresholdPercent: "10",
  });

  function detectMarketplace(url: string) {
    const u = url.toLowerCase();
    if (u.includes("mercadolivre")) return "Mercado Livre";
    if (u.includes("amazon")) return "Amazon";
    if (u.includes("shopee")) return "Shopee";
    return "Distribuidor";
  }

  function handleSubmit() {
    if (!form.name || !form.currentPrice) {
      toast.error("Nome e preço atual são obrigatórios.");
      return;
    }
    const price = parseFloat(form.currentPrice.replace(",", "."));
    if (isNaN(price) || price <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }
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
        <DialogHeader>
          <DialogTitle>Adicionar Produto ao Monitoramento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do produto *</Label>
            <Input
              placeholder="Ex: Cabo PFXB 6mm²"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input
              placeholder="Ex: Cabos, Disjuntores, Inversores..."
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link do produto</Label>
            <div className="relative">
              <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://mercadolivre.com.br/..."
                className="pl-8"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço atual (R$) *</Label>
              <Input
                placeholder="0,00"
                value={form.currentPrice}
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alertar em queda de (%)</Label>
              <Input
                placeholder="10"
                value={form.alertThresholdPercent}
                onChange={(e) => setForm({ ...form, alertThresholdPercent: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-primary text-primary-foreground">
            {isPending ? "Salvando..." : "Monitorar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Gráfico de Histórico ─────────────────────────────────────────────────────

function PriceChart({ productId }: { productId: number }) {
  const { data: history, isLoading } = useGetProductPriceHistory(productId);

  if (isLoading) return <Skeleton className="h-[120px] w-full" />;
  if (!history || history.length < 2) {
    return (
      <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
        Histórico insuficiente
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={history} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickMargin={4}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => `R$${v}`}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), "Preço"]}
          labelFormatter={(l) => `Data: ${l}`}
          contentStyle={{ fontSize: 12, background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <Line
          dataKey="price"
          type="monotone"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Card de Produto ──────────────────────────────────────────────────────────

function ProductCard({ product }: { product: any }) {
  const queryClient = useQueryClient();
  const { mutate: deleteProduct } = useDeleteMonitoredProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMonitoredProductsQueryKey() });
        toast.success("Produto removido do monitoramento.");
      },
    },
  });

  const change = product.priceChangePercent ?? 0;
  const isDrop = change < -1;
  const isRise = change > 1;

  const AlertIcon = isDrop ? BellRing : isRise ? BellOff : Bell;

  const alertColor = isDrop
    ? "bg-secondary/10 text-secondary border-secondary/20"
    : isRise
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-muted text-muted-foreground border-muted";

  return (
    <Card className="overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight truncate">{product.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {change !== 0 && (
              <Badge variant="outline" className={alertColor}>
                {isDrop ? <TrendingDown className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => deleteProduct({ id: product.id })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 flex-1 space-y-4">
        <div>
          <span className="text-xs text-muted-foreground">Preço Atual</span>
          <div className="text-2xl font-bold text-primary">{formatCurrency(product.currentPrice)}</div>
        </div>

        <PriceChart productId={product.id} />

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

        <div
          className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${
            isDrop
              ? "bg-secondary/10 text-secondary"
              : isRise
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {isDrop
              ? `Queda de ${Math.abs(change).toFixed(1)}% detectada — bom momento para comprar.`
              : isRise
              ? `Alta de ${change.toFixed(1)}% — aguarde estabilização.`
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

      {product.url && (
        <div className="px-4 pb-3">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Link2 className="h-3 w-3" /> Ver produto
          </a>
        </div>
      )}
    </Card>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────

export function MonitorPrecos() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: products, isLoading } = useListMonitoredProducts({
    query: { queryKey: getListMonitoredProductsQueryKey() },
  });

  const filtered = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowPriceCount = products?.filter((p) => (p.priceChangePercent ?? 0) < -5).length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitor de Preços</h2>
          <p className="text-muted-foreground">
            Acompanhamento e inteligência de mercado.
            {lowPriceCount > 0 && (
              <span className="ml-2 text-secondary font-medium">
                🔔 {lowPriceCount} produto{lowPriceCount > 1 ? "s" : ""} com queda significativa
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
        </Button>
      </div>

      {/* Busca */}
      <div className="flex items-center max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos monitorados..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[340px] rounded-xl" />)
        ) : filtered && filtered.length > 0 ? (
          filtered.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <div className="col-span-full py-16 text-center border rounded-lg bg-card">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum produto monitorado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione produtos para acompanhar variações de preço automaticamente.
            </p>
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
