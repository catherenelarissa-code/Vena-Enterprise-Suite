import { useState } from "react";
import { useListMaterials, getListMaterialsQueryKey, useCreateMaterial, useUpdateMaterial } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Filter, AlertCircle, Package, Pencil, ArrowUpDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["Aterramento", "Cabos", "Caixas", "Condutores", "Conectores", "Disjuntores", "Eletrodutos", "EPI", "Estruturas", "Ferramentas", "Fixação", "Fotovoltaico", "Isoladores", "Outros", "Proteção", "Transformadores"];
const UNITS = ["un", "m", "mt", "kg", "cx", "rl", "par", "um"];

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  lastPurchasePrice?: number | null;
};

export function Materiais() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openMove, setOpenMove] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);
  const [form, setForm] = useState({ name: "", category: "", unit: "un", currentStock: 0, minimumStock: 0 });
  const [moveType, setMoveType] = useState<"entrada" | "saida">("entrada");
  const [moveQty, setMoveQty] = useState(0);
  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useListMaterials({}, { query: { queryKey: getListMaterialsQueryKey() } });
  const { mutateAsync: createMaterial, isPending: isCreating } = useCreateMaterial();
  const { mutateAsync: updateMaterial, isPending: isUpdating } = useUpdateMaterial();

  const filteredMaterials = materials?.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!form.name || !form.category) return;
    await createMaterial({ body: form });
    queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
    setOpenNew(false);
    setForm({ name: "", category: "", unit: "un", currentStock: 0, minimumStock: 0 });
  }

  function handleOpenEdit(m: Material) {
    setSelected(m);
    setForm({ name: m.name, category: m.category, unit: m.unit, currentStock: m.currentStock, minimumStock: m.minimumStock });
    setOpenEdit(true);
  }

  async function handleEdit() {
    if (!selected) return;
    await updateMaterial({ path: { id: selected.id }, body: { name: form.name, category: form.category, unit: form.unit, minimumStock: form.minimumStock } });
    queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
    setOpenEdit(false);
  }

  function handleOpenMove(m: Material, type: "entrada" | "saida") {
    setSelected(m);
    setMoveType(type);
    setMoveQty(0);
    setOpenMove(true);
  }

  async function handleMove() {
    if (!selected || moveQty <= 0) return;
    const newStock = moveType === "entrada"
      ? selected.currentStock + moveQty
      : Math.max(0, selected.currentStock - moveQty);
    await updateMaterial({ path: { id: selected.id }, body: { currentStock: newStock } });
    queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
    setOpenMove(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Materiais e Estoque</h2>
          <p className="text-muted-foreground">Controle de insumos e alertas de reposição.</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Material
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nome ou categoria..." className="pl-8 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" className="shrink-0"><Filter className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm text-muted-foreground">
              <div className="col-span-4">Material / Categoria</div>
              <div className="col-span-2 text-right">Estoque Atual</div>
              <div className="col-span-2 text-right">Mínimo</div>
              <div className="col-span-2 text-right">Último Preço</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Ações</div>
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
                      <div className="col-span-1 flex justify-center">
                        {isLow ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                            <AlertCircle className="h-3 w-3" /> Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">Normal</Badge>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(item as Material)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenMove(item as Material, "entrada")}>
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground">Nenhum material encontrado.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Novo Material */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input placeholder="Ex: Cabo 2,5mm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
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
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isCreating}>{isCreating ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Material</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estoque Mínimo</Label>
              <Input type="number" value={form.minimumStock} onChange={e => setForm(f => ({ ...f, minimumStock: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={isUpdating}>{isUpdating ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Movimentação */}
      <Dialog open={openMove} onOpenChange={setOpenMove}>
        <DialogContent>
          <DialogHeader><DialogTitle>Movimentar Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground font-medium">{selected?.name}</p>
            <p className="text-sm">Estoque atual: <strong>{selected?.currentStock} {selected?.unit}</strong></p>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={moveType} onValueChange={v => setMoveType(v as "entrada" | "saida")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={moveQty} onChange={e => setMoveQty(Number(e.target.value))} />
            </div>
            {moveType === "saida" && selected && moveQty > selected.currentStock && (
              <p className="text-sm text-destructive">Quantidade maior que o estoque disponível!</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMove(false)}>Cancelar</Button>
            <Button onClick={handleMove} disabled={isUpdating || moveQty <= 0}>{isUpdating ? "Salvando..." : "Confirmar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
