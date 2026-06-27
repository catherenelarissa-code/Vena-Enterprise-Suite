import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetPurchaseRequest, getGetPurchaseRequestQueryKey, useCompareQuotes, getCompareQuotesQueryKey, useCreateQuote, useApproveQuote, useListSuppliers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft, FileText, Package, AlertCircle, Building2, User, Clock, Sparkles, Plus, Upload, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Helpers OCR ──────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function ocrQuote(
  file: File,
  itemNames: string[]
): Promise<{ prices: Record<string, string>; supplierName?: string; deliveryDays?: string; freightCost?: string; notes?: string }> {
  const { base64, mediaType } = await fileToBase64(file);
  const res = await fetch("/api/automation/ocr-quote", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mediaType, itemNames }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? "Erro ao processar imagem");
  }
  return res.json();
}

// ── Componente OCR Upload ────────────────────────────────────────────────────

function OcrUpload({
  itemNames,
  onExtracted,
}: {
  itemNames: string[];
  onExtracted: (data: { prices: Record<string, string>; supplierName?: string; deliveryDays?: string; freightCost?: string; notes?: string }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem (JPG, PNG, etc).");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setIsLoading(true);
    try {
      const result = await ocrQuote(file, itemNames);
      onExtracted(result);
      toast.success("Orçamento lido com sucesso!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao ler orçamento.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Ler orçamento por imagem (IA)</Label>
        {preview && (
          <button
            type="button"
            onClick={() => { setPreview(null); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Remover
          </button>
        )}
      </div>
      <div
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <p className="text-sm font-medium">Lendo orçamento com IA...</p>
            <p className="text-xs text-muted-foreground">Extraindo preços e informações...</p>
          </div>
        ) : preview ? (
          <div className="space-y-1">
            <img src={preview} alt="Orçamento" className="max-h-28 mx-auto rounded object-contain" />
            <p className="text-xs text-muted-foreground">Clique para trocar a imagem</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Tire foto do orçamento</p>
            <p className="text-xs text-muted-foreground">A IA preenche os preços automaticamente</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────

export function ComprasDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [freightCost, setFreightCost] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteItems, setQuoteItems] = useState<{ materialName: string; quantity: string; unit: string; unitPrice: string }[]>([]);

  const { data: request, isLoading: isLoadingRequest } = useGetPurchaseRequest(
    id,
    { query: { enabled: !!id, queryKey: getGetPurchaseRequestQueryKey(id) } }
  );

  const { data: quotes, isLoading: isLoadingQuotes } = useCompareQuotes(
    { request_id: id },
    { query: { enabled: !!id, queryKey: getCompareQuotesQueryKey({ request_id: id }) } }
  );

  const { data: suppliers } = useListSuppliers({}, {});
  const { mutate: createQuote, isPending: isCreatingQuote } = useCreateQuote();
  const { mutate: approveQuote, isPending: isApprovingQuote } = useApproveQuote();

  function openQuoteModal() {
    if (request?.items) {
      setQuoteItems(request.items.map(i => ({
        materialName: i.materialName,
        quantity: i.quantity.toString(),
        unit: i.unit,
        unitPrice: "",
      })));
    }
    setShowQuoteModal(true);
  }

  function updateQuoteItem(index: number, field: string, value: string) {
    setQuoteItems(quoteItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  // Callback quando OCR retorna dados
  function handleOcrExtracted(data: {
    prices: Record<string, string>;
    supplierName?: string;
    deliveryDays?: string;
    freightCost?: string;
    notes?: string;
  }) {
    // Preenche preços dos itens
    setQuoteItems((prev) =>
      prev.map((item) => ({
        ...item,
        unitPrice: data.prices?.[item.materialName] ?? item.unitPrice,
      }))
    );
    // Preenche fornecedor se encontrado (busca por nome)
    if (data.supplierName && suppliers) {
      const found = (suppliers as any[]).find((s) =>
        s.name.toLowerCase().includes(data.supplierName!.toLowerCase())
      );
      if (found) setSupplierId(found.id.toString());
    }
    if (data.deliveryDays) setDeliveryDays(data.deliveryDays);
    if (data.freightCost) setFreightCost(data.freightCost);
    if (data.notes) setQuoteNotes((prev) => prev ? `${prev}\n${data.notes}` : data.notes!);
  }

  function handleCreateQuote() {
    if (!supplierId || !deliveryDays || quoteItems.some(i => !i.unitPrice)) return;
    createQuote({
      data: {
        purchaseRequestId: id,
        supplierId: parseInt(supplierId),
        deliveryDays: parseInt(deliveryDays),
        freightCost: freightCost || undefined,
        notes: quoteNotes,
        items: quoteItems.map(i => ({
          materialName: i.materialName,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          unitPrice: parseFloat(i.unitPrice),
        })),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getCompareQuotesQueryKey({ request_id: id }) });
        queryClient.invalidateQueries({ queryKey: getGetPurchaseRequestQueryKey(id) });
        setShowQuoteModal(false);
        setSupplierId(""); setDeliveryDays(""); setFreightCost(""); setQuoteNotes("");
      }
    });
  }

  function handleApproveQuote(quoteId: number) {
    approveQuote({ id: quoteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPurchaseRequestQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getCompareQuotesQueryKey({ request_id: id }) });
      }
    });
  }

  if (!id) return <div>ID inválido</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/compras">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
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
        <div className="ml-auto">
          <Button onClick={openQuoteModal} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Cotação
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Itens Solicitados</CardTitle></CardHeader>
          <CardContent>
            {isLoadingRequest ? <Skeleton className="h-48 w-full" /> : request?.items && request.items.length > 0 ? (
              <div className="rounded-md border divide-y">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-muted/50 text-sm text-muted-foreground">
                  <div className="col-span-6">Material</div>
                  <div className="col-span-2 text-right">Qtd</div>
                  <div className="col-span-2">Unidade</div>
                  <div className="col-span-2 text-right">Obs</div>
                </div>
                {request.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                    <div className="col-span-6 font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />{item.materialName}
                    </div>
                    <div className="col-span-2 text-right">{item.quantity}</div>
                    <div className="col-span-2">{item.unit}</div>
                    <div className="col-span-2 text-right text-muted-foreground">{item.notes || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhum item na solicitação.</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoadingRequest ? <Skeleton className="h-32 w-full" /> : request ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Solicitante</span>
                    <span className="font-medium">{request.requestedBy}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Obra</span>
                    <span className="font-medium">{request.projectName || 'Estoque Geral'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Data</span>
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

      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <CardTitle>Comparação de Cotações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingQuotes ? <Skeleton className="h-32 w-full" /> : quotes?.quotes && quotes.quotes.length > 0 ? (
            <div className="space-y-6">
              {quotes.aiInsight && (
                <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg text-sm">
                  <p><strong>Recomendação:</strong> {quotes.aiInsight}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                {quotes.quotes.map((quote) => {
                  const isRecommended = quote.id === quotes.recommendedQuoteId;
                  return (
                    <Card key={quote.id} className={`relative overflow-hidden ${isRecommended ? 'border-accent shadow-sm' : ''}`}>
                      {isRecommended && (
                        <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                          MELHOR PREÇO
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
                        {quote.status !== 'approved' && (
                          <Button
                            className="w-full mt-6"
                            variant={isRecommended ? "default" : "outline"}
                            onClick={() => handleApproveQuote(quote.id)}
                            disabled={isApprovingQuote}
                          >
                            Aprovar esta Cotação
                          </Button>
                        )}
                        {quote.status === 'approved' && (
                          <Badge className="w-full mt-6 justify-center py-2 bg-secondary/10 text-secondary border-secondary/20">
                            ✓ Aprovada
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Nenhuma cotação ainda. Clique em "Adicionar Cotação" para começar.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Adicionar Cotação com OCR */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Cotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* OCR — leitura automática do orçamento */}
            <OcrUpload
              itemNames={quoteItems.map((i) => i.materialName)}
              onExtracted={handleOcrExtracted}
            />

            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
              <div className="flex-1 border-t" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Fornecedor *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prazo de entrega (dias) *</Label>
                <Input type="number" placeholder="Ex: 5" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Frete (R$)</Label>
                <Input type="number" placeholder="0,00" value={freightCost} onChange={e => setFreightCost(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Textarea placeholder="Condições de pagamento, validade da cotação..." value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preços por item *</Label>
              {quoteItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                  <div className="col-span-5 text-sm font-medium">{item.materialName}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">{item.quantity} {item.unit}</div>
                  <div className="col-span-5">
                    <Input
                      type="number"
                      placeholder="Preço unitário *"
                      value={item.unitPrice}
                      onChange={e => updateQuoteItem(index, "unitPrice", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateQuote} disabled={isCreatingQuote}>
              {isCreatingQuote ? "Salvando..." : "Salvar Cotação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
