import { useState } from "react";
import { useListMonitoredProducts, getListMonitoredProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MonitorPrecos() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListMonitoredProducts({ query: { queryKey: getListMonitoredProductsQueryKey() } });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitor de Preços</h2>
          <p className="text-muted-foreground">Acompanhamento e inteligência de mercado.</p>
        </div>
        <Button className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-xl" />)
        ) : filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isDrop = (product.priceChangePercent ?? 0) < 0;
            const isIncrease = (product.priceChangePercent ?? 0) > 0;

            return (
              <Card key={product.id} className="overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                    </div>
                    {product.priceChangePercent !== undefined && product.priceChangePercent !== 0 && (
                      <Badge variant="outline" className={`\${
                        isDrop ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {isDrop ? <TrendingDown className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3" />}
                        {Math.abs(product.priceChangePercent).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">Preço Atual</span>
                    <span className="text-3xl font-bold tracking-tight text-primary">
                      {formatCurrency(product.currentPrice)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border/50 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mín 30d</div>
                      <div className="text-sm font-medium">{formatCurrency(product.lowestPrice30d)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mín 60d</div>
                      <div className="text-sm font-medium">{formatCurrency(product.lowestPrice60d)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mín 90d</div>
                      <div className="text-sm font-medium">{formatCurrency(product.lowestPrice90d)}</div>
                    </div>
                  </div>
                </CardContent>
                
                {product.aiInsight && (
                  <CardFooter className="bg-muted/40 p-4 border-t flex gap-3 items-start">
                    <div className="mt-0.5 bg-accent/20 p-1.5 rounded-md text-accent shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {product.aiInsight}
                    </p>
                  </CardFooter>
                )}
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-12 text-center border rounded-lg bg-card text-muted-foreground">
            Nenhum produto monitorado.
          </div>
        )}
      </div>
    </div>
  );
}
