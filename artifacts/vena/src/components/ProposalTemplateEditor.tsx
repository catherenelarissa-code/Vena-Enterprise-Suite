import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Download, Upload, X, Eye } from "lucide-react";

interface ProposalTemplate {
  id: number;
  name: string;
  description?: string;
  html: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  fonts?: { body?: string; heading?: string };
  logoFileId?: number;
  bannerFileId?: number;
  imageFileIds?: number[];
  useGeneratedHtml?: boolean;
  isDefault: string;
  createdAt: string;
  updatedAt: string;
}

const FONT_OPTIONS = ["Arial", "Helvetica", "Roboto", "Open Sans", "Montserrat", "Lato"];

export function ProposalTemplateEditor() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProposalTemplate | null>(null);
  const [form, setForm] = useState<Partial<ProposalTemplate>>({
    name: "",
    description: "",
    html: "",
    colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" },
    fonts: { body: "Arial", heading: "Arial" },
    logoFileId: undefined,
    bannerFileId: undefined,
    imageFileIds: [],
    useGeneratedHtml: false,
    isDefault: "false",
  });

  const [preview, setPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const imagesFileRef = useRef<HTMLInputElement>(null);

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

  // Generate preview on changes
  const { mutate: generatePreview } = useMutation({
    mutationFn: async (templateData: Partial<ProposalTemplate>) => {
      const res = await fetch("/api/automation/render-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateMetadata: {
            colors: templateData.colors,
            fonts: templateData.fonts,
            logoFileId: templateData.logoFileId,
            bannerFileId: templateData.bannerFileId,
            imageFileIds: templateData.imageFileIds,
            useGeneratedHtml: templateData.useGeneratedHtml,
            title: templateData.name,
            subtitle: templateData.description,
          },
          proposalData: {
            kwp: "8.0",
            valor: "R$ 45.000,00",
            data: new Date().toLocaleDateString("pt-BR"),
          },
          clientData: {
            cliente: "Cliente Exemplo",
            cidade: "São Paulo, SP",
          },
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar preview");
      return res.json();
    },
    onSuccess: (data) => {
      setPreview(data.html);
    },
    onError: (err: any) => {
      console.error(err);
    },
  });

  // Upload file handler
  const uploadFile = async (file: File, type: "logo" | "banner" | "images") => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/client-files/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao enviar arquivo");
      const data = await res.json();
      return data.id;
    } catch (err) {
      toast.error(`Erro ao enviar ${type}`);
      throw err;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileId = await uploadFile(file, "logo");
      setForm({ ...form, logoFileId: fileId });
      generatePreview({ ...form, logoFileId: fileId });
      toast.success("Logo enviado com sucesso");
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const fileId = await uploadFile(file, "banner");
      setForm({ ...form, bannerFileId: fileId });
      generatePreview({ ...form, bannerFileId: fileId });
      toast.success("Banner enviado com sucesso");
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingBanner(false);
      if (bannerFileRef.current) bannerFileRef.current.value = "";
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    try {
      const newIds: number[] = [...(form.imageFileIds || [])];
      for (let i = 0; i < files.length; i++) {
        const fileId = await uploadFile(files[i], "images");
        newIds.push(fileId);
      }
      setForm({ ...form, imageFileIds: newIds });
      generatePreview({ ...form, imageFileIds: newIds });
      toast.success("Imagens enviadas com sucesso");
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImages(false);
      if (imagesFileRef.current) imagesFileRef.current.value = "";
    }
  };

  const removeLogoImage = async (fileId: number | undefined) => {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/client-files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      setForm({ ...form, logoFileId: undefined });
      generatePreview({ ...form, logoFileId: undefined });
      toast.success("Logo removido");
    } catch (err) {
      toast.error("Erro ao remover logo");
    }
  };

  const removeBannerImage = async (fileId: number | undefined) => {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/client-files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      setForm({ ...form, bannerFileId: undefined });
      generatePreview({ ...form, bannerFileId: undefined });
      toast.success("Banner removido");
    } catch (err) {
      toast.error("Erro ao remover banner");
    }
  };

  const removeImage = async (index: number, fileId: number) => {
    try {
      const res = await fetch(`/api/client-files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      const newIds = form.imageFileIds?.filter((_, i) => i !== index) || [];
      setForm({ ...form, imageFileIds: newIds });
      generatePreview({ ...form, imageFileIds: newIds });
      toast.success("Imagem removida");
    } catch (err) {
      toast.error("Erro ao remover imagem");
    }
  };

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
      setPreview("");
      setForm({
        name: "",
        description: "",
        html: "",
        colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" },
        fonts: { body: "Arial", heading: "Arial" },
        logoFileId: undefined,
        bannerFileId: undefined,
        imageFileIds: [],
        useGeneratedHtml: false,
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
    setPreview("");
    setForm({
      name: "",
      description: "",
      html: "",
      colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#F97316" },
      fonts: { body: "Arial", heading: "Arial" },
      logoFileId: undefined,
      bannerFileId: undefined,
      imageFileIds: [],
      useGeneratedHtml: false,
      isDefault: "false",
    });
    setOpen(true);
  };

  const openEdit = (template: ProposalTemplate) => {
    setEditing(template);
    setForm(template);
    setPreview("");
    setOpen(true);
  };

  const handleFormChange = (changes: Partial<ProposalTemplate>) => {
    const updated = { ...form, ...changes };
    setForm(updated);
    // Auto-generate preview on changes
    if (form.useGeneratedHtml) {
      generatePreview(updated);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );

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
              {t.isDefault === "true" && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                  Padrão
                </span>
              )}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="media">Mídia</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              {form.useGeneratedHtml && <TabsTrigger value="preview">Preview</TabsTrigger>}
            </TabsList>

            {/* Aba: Informações */}
            <TabsContent value="info" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => handleFormChange({ name: e.target.value })}
                  placeholder="Ex: Proposta Padrão 2024"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => handleFormChange({ description: e.target.value })}
                  placeholder="Descrição do template"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.useGeneratedHtml === true}
                    onChange={(e) => handleFormChange({ useGeneratedHtml: e.target.checked })}
                  />
                  Gerar HTML automaticamente (baseado em cores, fontes, logo, banner e imagens)
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault === "true"}
                    onChange={(e) => handleFormChange({ isDefault: e.target.checked ? "true" : "false" })}
                  />
                  Usar como padrão
                </label>
              </div>
            </TabsContent>

            {/* Aba: Mídia */}
            <TabsContent value="media" className="space-y-6">
              {/* Upload de Logo */}
              <div className="border rounded p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Logo
                </h4>
                {form.logoFileId ? (
                  <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded">
                    <img
                      src={`/api/client-files/${form.logoFileId}`}
                      alt="Logo"
                      className="h-12 w-auto max-w-[120px]"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">ID: {form.logoFileId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => logoFileRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        Substituir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeLogoImage(form.logoFileId)}
                        disabled={uploadingLogo}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full"
                  >
                    {uploadingLogo ? "Enviando..." : "Enviar Logo"}
                  </Button>
                )}
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Upload de Banner */}
              <div className="border rounded p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Banner
                </h4>
                {form.bannerFileId ? (
                  <div className="flex flex-col gap-3 mb-3 p-2 bg-gray-50 rounded">
                    <img
                      src={`/api/client-files/${form.bannerFileId}`}
                      alt="Banner"
                      className="w-full h-24 object-cover rounded"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bannerFileRef.current?.click()}
                        disabled={uploadingBanner}
                        className="flex-1"
                      >
                        Substituir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeBannerImage(form.bannerFileId)}
                        disabled={uploadingBanner}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => bannerFileRef.current?.click()}
                    disabled={uploadingBanner}
                    className="w-full"
                  >
                    {uploadingBanner ? "Enviando..." : "Enviar Banner"}
                  </Button>
                )}
                <input
                  ref={bannerFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>

              {/* Upload de Imagens */}
              <div className="border rounded p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Galeria de Imagens
                </h4>
                {form.imageFileIds && form.imageFileIds.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {form.imageFileIds.map((id, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={`/api/client-files/${id}`}
                          alt={`Imagem ${idx + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={() => removeImage(idx, id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => imagesFileRef.current?.click()}
                  disabled={uploadingImages}
                  className="w-full"
                >
                  {uploadingImages ? "Enviando..." : "Adicionar Imagens"}
                </Button>
                <input
                  ref={imagesFileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesUpload}
                  className="hidden"
                />
              </div>
            </TabsContent>

            {/* Aba: Design */}
            <TabsContent value="design" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Cor Primária */}
                <div>
                  <label className="text-sm font-medium">Cor Primária</label>
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      type="color"
                      value={form.colors?.primary || "#000000"}
                      onChange={(e) =>
                        handleFormChange({
                          colors: { ...form.colors, primary: e.target.value },
                        })
                      }
                      className="h-10 w-14 cursor-pointer"
                    />
                    <Input
                      value={form.colors?.primary || ""}
                      onChange={(e) =>
                        handleFormChange({
                          colors: { ...form.colors, primary: e.target.value },
                        })
                      }
                      className="text-xs"
                    />
                  </div>
                  <div
                    className="w-full h-8 rounded mt-2 border"
                    style={{ backgroundColor: form.colors?.primary || "#000000" }}
                  ></div>
                </div>

                {/* Cor Secundária */}
                <div>
                  <label className="text-sm font-medium">Cor Secundária</label>
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      type="color"
                      value={form.colors?.secondary || "#FFFFFF"}
                      onChange={(e) =>
                        handleFormChange({
                          colors: { ...form.colors, secondary: e.target.value },
                        })
                      }
                      className="h-10 w-14 cursor-pointer"
                    />
                    <Input
                      value={form.colors?.secondary || ""}
                      onChange={(e) =>
                        handleFormChange({
                          colors: { ...form.colors, secondary: e.target.value },
                        })
                      }
                      className="text-xs"
                    />
                  </div>
                  <div
                    className="w-full h-8 rounded mt-2 border"
                    style={{ backgroundColor: form.colors?.secondary || "#FFFFFF" }}
                  ></div>
                </div>

                {/* Cor de Destaque */}
                <div>
                  <label className="text-sm font-medium">Cor de Destaque</label>
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      type="color"
                      value={form.colors?.accent || "#F97316"}
                      onChange={(e) =>
                        handleFormChange({
                          colors: { ...form.colors, accent: e.target.value },
                        })
                      }
                      className="h-10 w-14 cursor-pointer"
                    />
                    <Input
                      value={form.colors?.accent || ""}
                      onChange={(e) =>
                        handleFormChange({
                          colors: { ...form.colors, accent: e.target.value },
                        })
                      }
                      className="text-xs"
                    />
                  </div>
                  <div
                    className="w-full h-8 rounded mt-2 border"
                    style={{ backgroundColor: form.colors?.accent || "#F97316" }}
                  ></div>
                </div>
              </div>

              {/* Tipografia */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Tipografia</h4>
                <div>
                  <label className="text-sm font-medium">Fonte Body</label>
                  <Select
                    value={form.fonts?.body || "Arial"}
                    onValueChange={(value) =>
                      handleFormChange({ fonts: { ...form.fonts, body: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p
                    className="text-sm mt-2 p-2 rounded bg-gray-50"
                    style={{ fontFamily: form.fonts?.body || "Arial" }}
                  >
                    Exemplo de texto com {form.fonts?.body || "Arial"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Fonte Heading</label>
                  <Select
                    value={form.fonts?.heading || "Arial"}
                    onValueChange={(value) =>
                      handleFormChange({ fonts: { ...form.fonts, heading: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p
                    className="text-lg font-bold mt-2 p-2 rounded bg-gray-50"
                    style={{ fontFamily: form.fonts?.heading || "Arial" }}
                  >
                    Título com {form.fonts?.heading || "Arial"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Aba: HTML */}
            <TabsContent value="html" className="space-y-4">
              {!form.useGeneratedHtml ? (
                <div>
                  <label className="text-sm font-medium">HTML do Template *</label>
                  <Textarea
                    value={form.html || ""}
                    onChange={(e) => handleFormChange({ html: e.target.value })}
                    placeholder="Cole o HTML do template aqui..."
                    className="h-64 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {{"{CLIENTE}"}}, {{"{VALOR}"}}, {{"{DATA}"}} etc. como placeholders
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm text-blue-900">
                    ✓ HTML é gerado automaticamente baseado em cores, fontes, logo, banner e imagens.
                    O editor de HTML está oculto quando esta opção está ativada.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Aba: Preview */}
            {form.useGeneratedHtml && (
              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded overflow-auto bg-white">
                  {preview ? (
                    <iframe
                      srcDoc={preview}
                      className="w-full h-96 border-0"
                      title="Preview do Template"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <div className="text-center">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Clique em "Gerar Preview" para visualizar o template</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => generatePreview(form)}
                  className="w-full"
                >
                  Gerar Preview
                </Button>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveTemplate(form)}
              disabled={!form.name || (!form.useGeneratedHtml && !form.html) || isPending}
            >
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
