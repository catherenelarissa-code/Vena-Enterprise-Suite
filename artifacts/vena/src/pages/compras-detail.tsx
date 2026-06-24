import { useParams, Link } from "wouter";
import { useGetPurchaseRequest, getGetPurchaseRequestQueryKey, useCompareQuotes, getCompareQuotesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft, FileText, CheckCircle, Package, AlertCircle, Building2, User, Clock, Sparkles } from "lucide-react";

export function ComprasDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: request, isLoading: isLoadingRequest } = useGetPurchaseRequest(
    id, 
    { query: { enabled: !!id, queryKey: getGetPurchaseRequestQueryKey(id) } }
  );

  const { data: quotes, isLoading: isLoadingQuotes } = useCompareQuotes(
    { request_id: id },
    { query: { enabled: !!id && request?.status === 'quoting', queryKey: getCompareQuotesQueryKey({ request_id: id }) } }
  );

  if (!id) return <div>ID inválido</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/compras">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              {isLoadingRequest ? <Skeleton className="h-8 w-64" /> : request?.title}
            </h2>
            {request && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {request.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <FileText className="h-4 w-4" /> Req: #{id.toString().padStart(4, '0')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Itens Solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRequest ? (
               <Skeleton className="h-48 w-full" />
            ) : request?.items && request.items.length > 0 ? (
              <div className="rounded-md border divide-y">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-muted/50 text-sm text-muted-foreground">
                  <div className="col-span-6">Material</div>
                  <div className="col-span-2 text-right">Qtd</div>
                  <div className="col-span-2">Unidade</div>
                  <div className="col-span-2 text-right">Observações</div>
                </div>
                {request.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                    <div className="col-span-6 font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {item.materialName}
                    </div>
                    <div className="col-span-2 text-right">{item.quantity}</div>
                    <div className="col-span-2">{item.unit}</div>
                    <div className="col-span-2 text-right text-muted-foreground truncate" title={item.notes || ''}>
                      {item.notes || '-'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item na solicitação.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingRequest ? (
                <Skeleton className="h-32 w-full" />
              ) : request ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Solicitante</span>
                    <span className="font-medium">{request.requestedBy}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Obra Destino</span>
                    <span className="font-medium">{request.projectName || 'Estoque Geral'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Data da Solicitação</span>
                    <span className="font-medium">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Urgência</span>
                    <Badge variant="outline" className="w-fit">{request.urgency || 'Normal'}</Badge>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {request?.status === 'quoting' && (
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <CardTitle>Análise de Cotações</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingQuotes ? (
              <Skeleton className="h-32 w-full" />
            ) : quotes?.quotes && quotes.quotes.length > 0 ? (
              <div className="space-y-6">
                {quotes.aiInsight && (
                  <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg text-sm text-foreground/90">
                    <p><strong>Recomendação IA:</strong> {quotes.aiInsight}</p>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-3">
                  {quotes.quotes.map((quote) => {
                    const isRecommended = quote.id === quotes.recommendedQuoteId;
                    return (
                      <Card key={quote.id} className={`relative overflow-hidden \${isRecommended ? 'border-accent shadow-sm' : ''}`}>
                        {isRecommended && (
                          <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                            RECOMENDADO
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{quote.supplierName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-4">{formatCurrency(quote.totalAmount)}</div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Prazo:</span>
                              <span className="font-medium text-foreground">{quote.deliveryDays} dias</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Frete:</span>
                              <span className="font-medium text-foreground">{quote.freightCost ? formatCurrency(quote.freightCost) : 'Grátis'}</span>
                            </div>
                          </div>
                          <Button className="w-full mt-6" variant={isRecommended ? "default" : "outline"}>
                            Aprovar Cotação
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma cotação recebida ainda.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
