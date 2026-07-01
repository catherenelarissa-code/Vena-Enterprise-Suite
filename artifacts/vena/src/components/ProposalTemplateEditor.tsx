import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Download } from "lucide-react";

interface ProposalTemplate {
  id: number;
  name: string;
  description?: string;
  html: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  fonts?: { body?: string; heading?: string };
  logoFileId?: number;
  bannerFileId?: number;
  isDefault: string;
  createdAt: string;
  updatedAt: string;
}

export function ProposalTemplateEditor() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProposalTemplate | null>(null);
  const [form, setForm] = useState<Partial<ProposalTemplate>>({
    name: "",
    description: "",
    html: "",
    colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" },
    fonts: { body: "Arial", heading: "Arial Bold" },
    isDefault: "false",
  });

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["proposal-templates"],
    queryFn: async () => {
      const res = await fetch("/api/proposal-templates");
      if (!res.ok) throw new Error("Erro ao carregar templates");
      return res.json();
    },
  });

  // Create/Update
  const { mutate: saveTemplate, isPending } = useMutation({
    mutationFn: async (data: Partial<ProposalTemplate>) => {
      const url = editing ? `/api/proposal-templates/${editing.id}` : "/api/proposal-templates";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao salvar template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success(editing ? "Template atualizado" : "Template criado");
      setOpen(false);
      setEditing(null);
      setForm({
        name: "",
        description: "",
        html: "",
        colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" },
        fonts: { body: "Arial", heading: "Arial Bold" },
        isDefault: "false",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar");
    },
  });

  // Delete
  const { mutate: deleteTemplate } = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/proposal-templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("Template excluído");
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      html: "",
      colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" },
      fonts: { body: "Arial", heading: "Arial Bold" },
      isDefault: "false",
    });
    setOpen(true);
  };

  const openEdit = (template: ProposalTemplate) => {
    setEditing(template);
    setForm(template);
    setOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Templates de Propostas</h3>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-2">
        {templates.map((t: ProposalTemplate) => (
          <div key={t.id} className="border rounded p-3 flex justify-between items-center hover:bg-accent/50">
            <div className="flex-1">
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              {t.isDefault === "true" && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">Padrão</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteTemplate(t.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Proposta Padrão 2024" />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do template" />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isDefault === "true"} onChange={(e) => setForm({ ...form, isDefault: e.target.checked ? "true" : "false" })} />
                  Usar como padrão
                </label>
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cor Primária</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.colors?.primary || "#000000"} onChange={(e) => setForm({ ...form, colors: { ...form.colors, primary: e.target.value } })} className="h-10 w-14 cursor-pointer rounded border" />
                    <Input value={form.colors?.primary || ""} onChange={(e) => setForm({ ...form, colors: { ...form.colors, primary: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Cor Secundária</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.colors?.secondary || "#FFFFFF"} onChange={(e) => setForm({ ...form, colors: { ...form.colors, secondary: e.target.value } })} className="h-10 w-14 cursor-pointer rounded border" />
                    <Input value={form.colors?.secondary || ""} onChange={(e) => setForm({ ...form, colors: { ...form.colors, secondary: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Cor de Destaque</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.colors?.accent || "#F97316"} onChange={(e) => setForm({ ...form, colors: { ...form.colors, accent: e.target.value } })} className="h-10 w-14 cursor-pointer rounded border" />
                    <Input value={form.colors?.accent || ""} onChange={(e) => setForm({ ...form, colors: { ...form.colors, accent: e.target.value } })} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Tipografia (para referência)</p>
                <Input value={form.fonts?.body || "Arial"} onChange={(e) => setForm({ ...form, fonts: { ...form.fonts, body: e.target.value } })} placeholder="Fonte body" />
                <Input value={form.fonts?.heading || "Arial Bold"} onChange={(e) => setForm({ ...form, fonts: { ...form.fonts, heading: e.target.value } })} placeholder="Fonte heading" className="mt-2" />
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div>
                <label className="text-sm font-medium">HTML do Template *</label>
                <Textarea value={form.html || ""} onChange={(e) => setForm({ ...form, html: e.target.value })} placeholder="Cole o HTML do template aqui..." className="h-64 font-mono text-xs" />
                <p className="text-xs text-muted-foreground mt-2">Use {{CLIENTE}}, {{VALOR}}, {{DATA}} etc. como placeholders</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveTemplate(form)} disabled={!form.name || !form.html || isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
