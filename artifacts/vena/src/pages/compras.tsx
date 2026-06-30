import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  useListPurchaseRequests, getListPurchaseRequestsQueryKey,
  useCreatePurchaseRequest,
} from "@workspace/api-client-react";
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
import { Search, Plus, FileText, Filter, Clock, Trash2, Upload, Sparkles, X, Pencil, Check, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Comprime imagem para max 1MB antes de enviar (fix 413)
async function compressAndEncode(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}

type Item = { materialName: string; quantity: string; unit: string; notes: string };

// ── OCR Upload ────────────────────────────────────────────────────────────────

import * as pdfjsLib from "pdfjs-dist";

async function convertPdfToImage(file: File) {
  const data = await file.arrayBuffer();

  const pdf =
    await pdfjsLib
      .getDocument({
        data,
      })
      .promise;

  const page =
    await pdf.getPage(1);

  const viewport =
    page.getViewport({
      scale: 2,
    });

  const canvas =
    document.createElement(
      "canvas"
    );

  const ctx =
    canvas.getContext(
      "2d"
    )!;

  canvas.width =
    viewport.width;

  canvas.height =
    viewport.height;

  await page.render({
    canvasContext:
      ctx,
    viewport,
  }).promise;

  return {
    base64:
      canvas
        .toDataURL(
          "image/jpeg",
          0.85
        )
        .split(",")[1],

    mediaType:
      "image/jpeg",
  };
}

function OcrMaterialsUpload({
  onExtracted,
}: {
  onExtracted: (
    items: Item[]
  ) => void;
}) {
  const fileRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  async function handleFile(
    file: File
  ) {
    const isImage =
      file.type.startsWith(
        "image/"
      );

    const isPdf =
      file.type ===
      "application/pdf";

    if (
      !isImage &&
      !isPdf
    ) {
      toast.error(
        "Envie imagem ou PDF."
      );

      return;
    }

    setLoading(true);

    try {
      const payload =
        isPdf
          ? await convertPdfToImage(
              file
            )
          : await compressAndEncode(
              file
            );

      const res =
        await fetch(
          "/api/automation/ocr-materials",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      if (!res.ok) {
        throw new Error(
          "Erro OCR"
        );
      }

      const data =
        await res.json();

      onExtracted(
        data.items ??
          []
      );

      toast.success(
        "Documento lido!"
      );
    } catch {
      toast.error(
        "Erro ao processar documento"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <div className="space-y-3">

      <Label>
        Importar itens
      </Label>

      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"

        onClick={() =>
          fileRef.current?.click()
        }
      >

        <input
          ref={
            fileRef
          }

          type="file"

          accept="image/*,application/pdf"

          capture="environment"

          className="hidden"

          onChange={(
            e
          ) => {
            const file =
              e.target
                .files?.[0];

            if (
              file
            ) {
              handleFile(
                file
              );
            }
          }}
        />

        {loading ? (
          <div>
            Processando...
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-2 h-6 w-6" />

            <p>
              Tirar foto
              ou enviar
              PDF
            </p>

          </>
        )}

      </div>

    </div>
  );
}

// ── Item Row ──────────────────────────────────────────────────────────────────

function ItemRow({ item, index, canRemove, onUpdate, onRemove }: {
  item: Item; index: number; canRemove: boolean;
  onUpdate: (i: number, f: string, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={`grid grid-cols-12 gap-2 items-center p-3 border rounded-lg transition-colors ${editing ? "border-primary/40 bg-primary/5" : ""}`}>
      {editing ? (
        <>
          <div className="col-span-5"><Input placeholder="Material *" value={item.materialName} onChange={(e) => onUpdate(index, "materialName", e.target.value)} autoFocus /></div>
          <div className="col-span-2"><Input placeholder="Qtd *" type="number" value={item.quantity} onChange={(e) => onUpdate(index, "quantity", e.target.value)} /></div>
          <div className="col-span-2">
            <Select value={item.unit} onValueChange={(v) => onUpdate(index, "unit", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["un","m","m²","kg","cx","rolo","pç","lt"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Input placeholder="Obs" value={item.notes} onChange={(e) => onUpdate(index, "notes", e.target.value)} /></div>
          <div className="col-span-1 flex justify-center">
            <button type="button" onClick={() => setEditing(false)} className="text-primary hover:text-primary/80"><Check className="h-4 w-4" /></button>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-5 text-sm font-medium truncate">{item.materialName || <span className="text-muted-foreground italic">sem nome</span>}</div>
          <div className="col-span-2 text-sm text-muted-foreground">{item.quantity} {item.unit}</div>
          <div className="col-span-3 text-xs text-muted-foreground truncate">{item.notes || "—"}</div>
          <div className="col-span-2 flex justify-end gap-1">
            <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground p-1 rounded"><Pencil className="h-3.5 w-3.5" /></button>
            {canRemove && <button type="button" onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive p-1 rounded"><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────

export function Compras() {
  const [activeTab, setActiveTab] = useState("solicitacoes");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [notes, setNotes] = useState("");
  const [project, setProject] = useState("");
  const [items, setItems] = useState<Item[]>([{ materialName: "", quantity: "", unit: "un", notes: "" }]);

  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useListPurchaseRequests({}, { query: { queryKey: getListPurchaseRequestsQueryKey() } });
  const { mutate: createRequest, isPending } = useCreatePurchaseRequest();
  const [isDeleting, setIsDeleting] = useState(false);

  // Separa solicitações por status
  const solicitacoes = requests?.filter(r => !['ordered','delivered'].includes(r.status)) ?? [];
  const pedidos = requests?.filter(r => ['ordered','delivered'].includes(r.status)) ?? [];

  function addItem() { setItems([...items, { materialName: "", quantity: "", unit: "un", notes: "" }]); }
  function removeItem(index: number) { setItems(items.filter((_, i) => i !== index)); }
  function updateItem(index: number, field: string, value: string) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }
  function handleOcrExtracted(extracted: Item[]) { setItems(extracted); }
  function handleCloseModal() {
    setShowModal(false);
    setTitle(""); setUrgency("normal"); setNotes(""); setProject("");
    setItems([{ materialName: "", quantity: "", unit: "un", notes: "" }]);
  }

  async function handleDelete(id: number) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/purchases/requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      queryClient.invalidateQueries({ queryKey: getListPurchaseRequestsQueryKey() });
      setDeleteConfirm(null);
      toast.success("Solicitação excluída.");
    } catch {
      toast.error("Erro ao excluir solicitação.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSubmit() {
    if (!title || items.some(i => !i.materialName || !i.quantity)) {
      toast.error("Preencha o título e todos os itens."); return;
    }
    createRequest({
      data: {
        title, requestedBy: "Usuário atual", urgency: urgency as any, notes,
        items: items.map(i => ({ materialName: i.materialName, quantity: parseFloat(i.quantity), unit: i.unit, notes: i.notes })),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPurchaseRequestsQueryKey() });
        handleCloseModal();
        toast.success("Solicitação criada!");
      }
    });
  }

  function RequestCard({ req }: { req: any }) {
    return (
      <div className="relative group">
        <Link href={`/compras/${req.id}`}>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="font-semibold text-lg">{req.title}</h3>
                    <Badge variant="outline" className={getStatusColor(req.status)}>{getStatusLabel(req.status)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center"><Clock className="mr-1 h-3 w-3" />{formatDate(req.createdAt)}</span>
                    <span>•</span><span>{req.projectName || 'Sem Obra'}</span>
                    <span>•</span><span>{req.items?.length || 0} itens</span>
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium">Req: #{req.id.toString().padStart(4, '0')}</div>
            </CardContent>
          </Card>
        </Link>
        {/* Botão excluir — aparece no hover */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(req.id); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-muted-foreground"
          title="Excluir solicitação"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
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
          <TabsTrigger value="solicitacoes">
            Solicitações {solicitacoes.length > 0 && <span className="ml-1.5 text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{solicitacoes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
          <TabsTrigger value="pedidos">
            Pedidos {pedidos.length > 0 && <span className="ml-1.5 text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">{pedidos.length}</span>}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar..." className="pl-8 bg-card" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0"><Filter className="h-4 w-4" /></Button>
        </div>

        <TabsContent value="solicitacoes" className="mt-6 space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : solicitacoes.length > 0 ? (
            solicitacoes.map((req) => <RequestCard key={req.id} req={req} />)
          ) : (
            <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">Nenhuma solicitação encontrada.</div>
          )}
        </TabsContent>

        <TabsContent value="cotacoes" className="mt-6">
          <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">Módulo de cotações em desenvolvimento.</div>
        </TabsContent>

        <TabsContent value="pedidos" className="mt-6 space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : pedidos.length > 0 ? (
            pedidos.map((req) => <RequestCard key={req.id} req={req} />)
          ) : (
            <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
              Nenhum pedido realizado ainda. Os pedidos aparecem aqui quando uma cotação é aprovada.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Nova Solicitação */}
      <Dialog open={showModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Solicitação de Compra</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <OcrMaterialsUpload onExtracted={handleOcrExtracted} />
            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
              <div className="flex-1 border-t" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Título da solicitação *</Label>
                <Input placeholder="Ex: Materiais elétricos obra X" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                <Input placeholder="Nome da obra" value={project} onChange={(e) => setProject(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Textarea placeholder="Informações adicionais..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens * <span className="text-muted-foreground font-normal">({items.length})</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar item
                </Button>
              </div>
              {items.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs text-muted-foreground">
                  <div className="col-span-5">Material</div>
                  <div className="col-span-2">Qtd / Un</div>
                  <div className="col-span-3">Obs</div>
                  <div className="col-span-2" />
                </div>
              )}
              <div className="space-y-2">
                {items.map((item, index) => (
                  <ItemRow key={index} item={item} index={index} canRemove={items.length > 1} onUpdate={updateItem} onRemove={removeItem} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando..." : "Criar Solicitação"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar exclusão */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Excluir solicitação?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita. Todas as cotações vinculadas também serão removidas.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
