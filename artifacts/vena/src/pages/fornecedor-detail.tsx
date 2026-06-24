import { useParams, Link } from "wouter";
import { useGetSupplier, getGetSupplierQueryKey, useListSupplierPriceHistory, getListSupplierPriceHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft, Star, Phone, Mail, MapPin, Building, Package, ShoppingCart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`h-4 w-4 \${star <= Math.round(rating) ? 'fill-accent text-accent' : 'fill-muted text-muted'}`} 
        />
      ))}
      <span className="ml-2 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function FornecedorDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: supplier, isLoading } = useGetSupplier(
    id, 
    { query: { enabled: !!id, queryKey: getGetSupplierQueryKey(id) } }
  );

  const { data: history, isLoading: isLoadingHistory } = useListSupplierPriceHistory(
    id,
    { query: { enabled: !!id, queryKey: getListSupplierPriceHistoryQueryKey(id) } }
  );

  if (!id) return <div>ID inválido</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/fornecedores">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-8 w-64" /> : supplier?.name}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            {supplier?.category} {supplier?.cnpj && `• CNPJ: \${supplier.cnpj}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contato & Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : supplier ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Telefone</p>
                    <p className="font-medium">{supplier.phone || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <p className="text-muted-foreground text-xs">E-mail</p>
                    <p className="font-medium truncate" title={supplier.email || ''}>{supplier.email || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Endereço</p>
                    <p className="font-medium">{supplier.address || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total de Pedidos</p>
                    <p className="font-medium">{supplier.totalPurchases}</p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Avaliação de Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : supplier ? (
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="bg-card border rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Preço Competitivo</span>
                  <StarRating rating={supplier.avgPriceScore} />
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Prazo de Entrega</span>
                  <StarRating rating={supplier.avgDeliveryScore} />
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Qualidade Geral</span>
                  <StarRating rating={supplier.avgQualityScore} />
                </div>
              </div>
            ) : null}
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium mb-4">Evolução de Preços</h3>
              {isLoadingHistory ? (
                <Skeleton className="h-48 w-full" />
              ) : history && history.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickFormatter={(val) => formatDate(val).substring(0, 5)} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `R$ \${val}`} tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), "Preço"]}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Line type="monotone" dataKey="unitPrice" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground border rounded-md">
                  Histórico de preços indisponível.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
