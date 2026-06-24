import { useState } from "react";
import { useListSuppliers, getListSuppliersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, Star, Phone, Mail, MapPin } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`h-3.5 w-3.5 \${star <= Math.round(rating) ? 'fill-accent text-accent' : 'fill-muted text-muted'}`} 
        />
      ))}
      <span className="ml-1.5 text-xs font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function Fornecedores() {
  const [search, setSearch] = useState("");
  const { data: suppliers, isLoading } = useListSuppliers({}, { query: { queryKey: getListSuppliersQueryKey() } });

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-muted-foreground">Base de parceiros comerciais e avaliações de desempenho.</p>
        </div>
        <Button className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou categoria..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="overflow-hidden hover:border-primary/50 transition-colors flex flex-col">
              <div className="p-5 border-b bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg truncate pr-2" title={supplier.name}>{supplier.name}</h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0">
                    {supplier.category}
                  </Badge>
                </div>
                {supplier.cnpj && (
                  <p className="text-xs text-muted-foreground font-mono">CNPJ: {supplier.cnpj}</p>
                )}
              </div>
              
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4 text-primary/70 shrink-0" />
                    <span className="truncate">{supplier.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4 text-primary/70 shrink-0" />
                    <span className="truncate">{supplier.email || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4 text-primary/70 shrink-0" />
                    <span className="truncate">{supplier.address || 'Não informado'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Preço</span>
                    <StarRating rating={supplier.avgPriceScore} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Entrega</span>
                    <StarRating rating={supplier.avgDeliveryScore} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Qualidade</span>
                    <StarRating rating={supplier.avgQualityScore} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border rounded-lg bg-card text-muted-foreground">
            Nenhum fornecedor encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
