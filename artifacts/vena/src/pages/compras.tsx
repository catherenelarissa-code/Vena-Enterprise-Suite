import { useState } from "react";
import { Link } from "wouter";
import { useListPurchaseRequests, getListPurchaseRequestsQueryKey, useCreatePurchaseRequest } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { Search, Plus, FileText, Filter, Clock, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function getStatusColor(status: string) {
  switch (status) {
    case 'approved': case 'delivered': return 'bg-secondary/10 text-secondary border-secondary/20';
    case 'pending': case 'quoting': case 'ordered': return 'bg-accent/10 text-accent border-accent/20';
    case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    'pending': 'Pendente', 'quoting': 'Em Cotação', 'approved': 'Aprovado',
    'ordered': 'Pedido Realizado', 'delivered': 'Entregue', 'cancelled': 'Cancelado',
  };
  return map[status] || status;
}

export function Compras() {
  const [activeTab, setActiveTab] = useState("solicitacoes");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [notes, setNotes] = useState("");
  const [project, setProject] = useState("");
  const [items, setItems] = useState([{ materialName: "", quantity: "", unit: "un", notes: "" }]);
  
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useListPurchaseRequests({}, { query: { queryKey: getListPurchaseRequestsQueryKey() } });
  const { mutate: createRequest, isPending } = useCreatePurchaseRequest();

  function addItem() {
    setItems([...items, { materialName: "", quantity: "", unit: "un", notes: "" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: string) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function handleSubmit() {
    if (!title || items.some(i => !i.materialName || !i.quantity)) return;
    createRequest({
      data: {
        title,
        requestedBy: "Usuário atual",
        urgency: urgency as any,
        notes,
        items: items.map(i => ({ materialName: i.materialName, quantity: parseFloat(i.quantity), unit: i.unit, notes: i.notes })),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPurchaseRequestsQueryKey() });
        setShowModal(false);
        setTitle(""); setUrgency("normal"); setNotes(""); setProject("");
        setItems([{ materialName: "", quantity: "", unit: "un", notes: "" }]);
      }
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
          <p className="text-muted-foreground">Gestão de requisições, cotações e pedidos.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
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
            <Input type="search" placeholder="Buscar..." className="pl-8 bg-card" />
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
              <Link key={req.id} href={`/compras/${req.id}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-semibold text-lg">{req.title}</h3>
                          <Badge variant="outline" className={getStatusColor(req.status)}>
                            {getStatusLabel(req.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {formatDate(req.createdAt)}</span>
                          <span>•</span>
                          <span>{req.projectName || 'Sem Obra'}</span>
                          <span>•</span>
                          <span>{req.items?.length || 0} itens</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">Req: #{req.id.toString().padStart(4, '0')}</div>
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Título da solicitação *</Label>
                <Input placeholder="Ex: Materiais elétricos obra X" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Urgência</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Obra (opcional)</Label>
                <Input placeholder="Nome da obra" value={project} onChange={e => setProject(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Textarea placeholder="Informações adicionais..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Itens *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                  <div className="col-span-5">
                    <Input placeholder="Material *" value={item.materialName} onChange={e => updateItem(index, "materialName", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Qtd *" type="number" value={item.quantity} onChange={e => updateItem(index, "quantity", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Select value={item.unit} onValueChange={v => updateItem(index, "unit", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">un</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="cx">cx</SelectItem>
                        <SelectItem value="rolo">rolo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Obs" value={item.notes} onChange={e => updateItem(index, "notes", e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : "Criar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
