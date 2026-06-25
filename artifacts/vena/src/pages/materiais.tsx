import { useState } from "react";
import { useListMaterials, getListMaterialsQueryKey, useCreateMaterial } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Filter, AlertCircle, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["Cabos", "Disjuntores", "Conectores", "Abraçadeiras", "Outros"];
const UNITS = ["un", "m", "kg", "cx", "rolo", "par"];

export function Materiais() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", unit: "un", currentStock: 0, minimumStock: 0 });
  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useListMaterials({}, { query: { queryKey: getListMaterialsQueryKey() } });
  const { mutateAsync: createMaterial, isPending } = useCreateMaterial();

  const filteredMaterials = materials?.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit() {
    if (!form.name || !form.category) return;
    await createMaterial({ body: form });
    queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
    setOpen(false);
    setForm({ name: "", category: "", unit: "un", currentStock: 0, minimumStock: 0 });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Materiais e Estoque</h2>
          <p className="text-muted-foreground">Controle de insumos e alertas de reposição.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Material
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

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm text-muted-foreground">
              <div className="col-span-4">Material / Categoria</div>
              <div className="col-span-2 text-right">Estoque Atual</div>
              <div className="col-span-2 text-right">Mínimo</div>
              <div className="col-span-2 text-right">Último Preço</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-12"><Skeleton className="h-6 w-full" /></div>
                  </div>
                ))
              ) : filteredMaterials && filteredMaterials.length > 0 ? (
                filteredMaterials.map((item) => {
                  const isLow = item.currentStock <= item.minimumStock;
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                      <div className="col-span-4">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">{item.category}</div>
                      </div>
                      <div className={`col-span-2 text-right font-medium ${isLow ? 'text-destructive' : ''}`}>
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {item.minimumStock} {item.unit}
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {item.lastPurchasePrice ? formatCurrency(item.lastPurchasePrice) : '-'}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {isLow ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                            <AlertCircle className="h-3 w-3" /> Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                            Normal
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum material encontrado.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input placeholder="Ex: Cabo 2,5mm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Estoque Atual</Label>
                <Input type="number" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Estoque Mínimo</Label>
                <Input type="number" value={form.minimumStock} onChange={e => setForm(f => ({ ...f, minimumStock: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
