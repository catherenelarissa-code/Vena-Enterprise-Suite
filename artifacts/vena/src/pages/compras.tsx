import { useState } from "react";
import { Link } from "wouter";
import { useListPurchaseRequests, getListPurchaseRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { Search, Plus, FileText, Filter, Clock } from "lucide-react";

function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
    case 'delivered':
      return 'bg-secondary/10 text-secondary border-secondary/20';
    case 'pending':
    case 'quoting':
    case 'ordered':
      return 'bg-accent/10 text-accent border-accent/20';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    'pending': 'Pendente',
    'quoting': 'Em Cotação',
    'approved': 'Aprovado',
    'ordered': 'Pedido Realizado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
  };
  return map[status] || status;
}

function getUrgencyBadge(urgency: string | undefined) {
  if (!urgency) return null;
  const isUrgent = urgency === 'urgent' || urgency === 'high';
  
  return (
    <Badge variant="outline" className={`ml-2 \${isUrgent ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted text-muted-foreground'}`}>
      {urgency === 'urgent' ? 'Urgente' : urgency === 'high' ? 'Alta' : urgency === 'normal' ? 'Normal' : 'Baixa'}
    </Badge>
  );
}

export function Compras() {
  const [activeTab, setActiveTab] = useState("solicitacoes");
  const { data: requests, isLoading } = useListPurchaseRequests({}, { query: { queryKey: getListPurchaseRequestsQueryKey() } });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
          <p className="text-muted-foreground">Gestão de requisições, cotações e pedidos.</p>
        </div>
        <Button className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nova Solicitação
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-8 bg-card"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="solicitacoes" className="mt-6 space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : requests && requests.length > 0 ? (
            requests.map((req) => (
              <Link key={req.id} href={`/compras/\${req.id}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-semibold text-lg">{req.title}</h3>
                          <Badge variant="outline" className={getStatusColor(req.status)}>
                            {getStatusLabel(req.status)}
                          </Badge>
                          {getUrgencyBadge(req.urgency)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" /> {formatDate(req.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{req.projectName || 'Sem Obra'}</span>
                          <span>•</span>
                          <span>{req.items?.length || 0} itens</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-right sm:text-left w-full sm:w-auto mt-2 sm:mt-0">
                      Req: #{req.id.toString().padStart(4, '0')}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
              Nenhuma solicitação encontrada.
            </div>
          )}
        </TabsContent>

        <TabsContent value="cotacoes" className="mt-6">
          <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
            Módulo de cotações em desenvolvimento.
          </div>
        </TabsContent>

        <TabsContent value="pedidos" className="mt-6">
          <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
            Módulo de pedidos em desenvolvimento.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
