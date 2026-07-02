import { useState } from "react";
import {
  useListSuppliers, getListSuppliersQueryKey,
  useCreateSupplier, useUpdateSupplier, useDeleteSupplier,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Filter, Star, Phone, Mail, MapPin,
  Pencil, Trash2, KeyRound, Copy,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Supplier = {
  id: number;
  name: string;
  category: string;
  contact: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  address?: string;
  notes?: string;
  pixKey?: string;
  avgPriceScore?: number;
  avgDeliveryScore?: number;
  avgQualityScore?: number;
};

function StarRating({
  rating,
  onChange,
  editable = false,
}: {
  rating: number;
  onChange?: (value: number) => void;
  editable?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => onChange?.(star)}
          className={editable ? "cursor-pointer" : "cursor-default"}
          aria-label={editable ? `Avaliar com ${star} estrela(s)` : undefined}
        >
          <Star
            className={`h-3.5 w-3.5 transition-transform ${
              star <= Math.round(rating) ? "fill-accent text-accent" : "fill-muted text-muted"
            } ${editable ? "hover:scale-110" : ""}`}
          />
        </button>
      ))}
      <span className="ml-1.5 text-xs font-medium">{Number(rating || 0).toFixed(1)}</span>
    </div>
  );
}

export function Fornecedores() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [address, setAddress] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [notes, setNotes] = useState("");
  const [priceScore, setPriceScore] = useState(0);
  const [deliveryScore, setDeliveryScore] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);

  const queryClient = useQueryClient();
  const { data: suppliers, isLoading } = useListSuppliers({}, { query: { queryKey: getListSuppliersQueryKey() } });
  const { mutate: createSupplier, isPending: isCreating } = useCreateSupplier();
  const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier();
  const { mutate: deleteSupplier } = useDeleteSupplier();

  const isPending = isCreating || isUpdating;

  const filteredSuppliers = suppliers?.filter((s: Supplier) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setName(""); setCategory(""); setContact(""); setEmail("");
    setPhone(""); setCnpj(""); setAddress(""); setPixKey(""); setNotes("");
    setPriceScore(0); setDeliveryScore(0); setQualityScore(0);
  }

  function openCreateModal() {
    setEditingSupplier(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier);
    setName(supplier.name ?? "");
    setCategory(supplier.category ?? "");
    setContact(supplier.contact ?? "");
    setEmail(supplier.email ?? "");
    setPhone(supplier.phone ?? "");
    setCnpj(supplier.cnpj ?? "");
    setAddress(supplier.address ?? "");
    setPixKey(supplier.pixKey ?? "");
    setNotes(supplier.notes ?? "");
    setPriceScore(supplier.avgPriceScore ?? 0);
    setDeliveryScore(supplier.avgDeliveryScore ?? 0);
    setQualityScore(supplier.avgQualityScore ?? 0);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSupplier(null);
  }

  function handleSubmit() {
    if (!name || !category || !contact) return;
    const payload = {
      name, category, contact, email, phone, cnpj, address, notes,
      pixKey,
      avgPriceScore: priceScore,
      avgDeliveryScore: deliveryScore,
      avgQualityScore: qualityScore,
    };

    if (editingSupplier) {
      updateSupplier(
        { id: editingSupplier.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
            toast.success("Fornecedor atualizado!");
            closeModal();
            resetForm();
          },
          onError: () => toast.error("Erro ao atualizar fornecedor."),
        }
      );
    } else {
      createSupplier(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
            toast.success("Fornecedor cadastrado!");
            closeModal();
            resetForm();
          },
          onError: () => toast.error("Erro ao cadastrar fornecedor."),
        }
      );
    }
  }

  function handleDelete(supplier: Supplier) {
    if (!window.confirm(`Excluir o fornecedor "${supplier.name}"? Essa ação não pode ser desfeita.`)) return;
    deleteSupplier(
      { id: supplier.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
          toast.success("Fornecedor excluído.");
        },
        onError: () => toast.error("Erro ao excluir fornecedor."),
      }
    );
  }

  function copyPixKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Chave Pix copiada!");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-muted-foreground">Base de parceiros comerciais e avaliações de desempenho.</p>
        </div>
        <Button onClick={openCreateModal} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nome ou categoria..." className="pl-8 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier: Supplier) => (
            <Card key={supplier.id} className="overflow-hidden hover:border-primary/50 transition-colors flex flex-col group">
              <div className="p-5 border-b bg-muted/20">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-lg truncate pr-2">{supplier.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {supplier.category}
                    </Badge>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(supplier)} title="Editar fornecedor"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(supplier)} title="Excluir fornecedor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {supplier.cnpj && <p className="text-xs text-muted-foreground font-mono">CNPJ: {supplier.cnpj}</p>}
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
                  {supplier.pixKey && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <KeyRound className="mr-2 h-4 w-4 text-primary/70 shrink-0" />
                      <span className="truncate flex-1">{supplier.pixKey}</span>
                      <button
                        onClick={() => copyPixKey(supplier.pixKey!)}
                        className="text-primary/70 hover:text-primary shrink-0 ml-1"
                        title="Copiar chave Pix"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Preço</span>
                    <StarRating rating={supplier.avgPriceScore ?? 0} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Entrega</span>
                    <StarRating rating={supplier.avgDeliveryScore ?? 0} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Qualidade</span>
                    <StarRating rating={supplier.avgQualityScore ?? 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border rounded-lg bg-card text-muted-foreground">
            Nenhum fornecedor encontrado. Clique em "Novo Fornecedor" para começar.
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome do fornecedor" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input placeholder="Ex: Elétrico, EPI, Ferramentas" value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contato principal *</Label>
                <Input placeholder="Nome do contato" value={contact} onChange={e => setContact(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input placeholder="email@fornecedor.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input placeholder="Cidade / Estado" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Chave Pix
              </Label>
              <Input
                placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Usada para preencher o pagamento automaticamente na aba Financeiro &gt; A Pagar.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <Label className="text-xs text-muted-foreground">Avaliação</Label>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Preço</span>
                <StarRating rating={priceScore} editable onChange={setPriceScore} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Entrega</span>
                <StarRating rating={deliveryScore} editable onChange={setDeliveryScore} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Qualidade</span>
                <StarRating rating={qualityScore} editable onChange={setQualityScore} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Produtos principais, condições de pagamento..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : editingSupplier ? "Salvar Alterações" : "Cadastrar Fornecedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
