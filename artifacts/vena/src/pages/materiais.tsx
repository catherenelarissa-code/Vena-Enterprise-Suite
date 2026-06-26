import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Zap, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

type ForecastItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  consumoMedioDiario: number;
  diasRestantes: number | null;
  critico: boolean;
  lastPurchasePrice: number | null;
};

export function ReposicaoAutomatica() {
  const [itens, setItens] = useState<ForecastItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<number | null>(null);

  useEffect(() => {
    carregarPrevisao();
  }, []);

  async function carregarPrevisao() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/materials/forecast", { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar previsão");
      const data = await res.json();
      setItens(data);
    } catch (err) {
      setError("Não foi possível carregar a previsão de reposição.");
    } finally {
      setLoading(false);
    }
  }

  async function gerarSolicitacaoCompra(item: ForecastItem) {
    setEnviando(item.id);
    try {
      const quantidadeSugerida = Math.max(
        item.minimumStock - item.currentStock,
        Math.ceil(item.minimumStock * 0.5),
      );

      const res = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Reposição automática: ${item.name}`,
          requestedBy: "Sistema (reposição automática)",
          urgency: item.critico ? "urgent" : "normal",
          notes: `Gerado automaticamente. Estoque atual: ${item.currentStock} ${item.unit}, mínimo: ${item.minimumStock} ${item.unit}, previsão de ${item.diasRestantes} dias até esgotar.`,
          items: [
            {
              materialName: item.name,
              quantity: quantidadeSugerida,
              unit: item.unit,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar solicitação");

      toast.success(`Solicitação de compra criada: ${quantidadeSugerida} ${item.unit} de ${item.name}`);
    } catch (err) {
      toast.error("Não foi possível criar a solicitação de compra.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-accent" /> Estoque mínimo inteligente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cálculo dinâmico com base no consumo médio real dos últimos 90 dias (movimentações de saída registradas). Materiais sem histórico suficiente não aparecem aqui.
          </p>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="size-4" /> {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : itens && itens.length > 0 ? (
          itens.map((item) => {
            const pct = Math.min((item.currentStock / item.minimumStock) * 100, 100);
            return (
              <Card key={item.id} className={item.critico ? "border-destructive/40" : ""}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> Com base no consumo médio, o estoque acaba em {item.diasRestantes} dias.
                    </p>
                  </div>
                  <Badge className={item.critico ? "bg-destructive text-white" : "bg-amber-500 text-white"}>
                    {item.diasRestantes} dias
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Estoque atual: {item.currentStock} {item.unit}</span>
                      <span>Mínimo: {item.minimumStock} {item.unit}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Rascunho de solicitação de compra</p>
                    <p>Consumo médio: {item.consumoMedioDiario} {item.unit}/dia</p>
                    {item.lastPurchasePrice && (
                      <p>Último preço pago: {formatCurrency(item.lastPurchasePrice)} / {item.unit}</p>
                    )}
                  </div>

                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={enviando === item.id}
                    onClick={() => gerarSolicitacaoCompra(item)}
                  >
                    <ShoppingCart className="size-4" />
                    {enviando === item.id ? "Enviando..." : "Aprovar auto-compra (1 clique)"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Nenhum material com histórico de consumo suficiente para gerar previsão ainda.
              Registre algumas saídas de estoque para habilitar esta análise.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
