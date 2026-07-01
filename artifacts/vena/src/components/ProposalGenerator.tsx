import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Eye, FileDown } from "lucide-react";

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  origin?: string;
}

interface ProposalTemplate {
  id: number;
  name: string;
  html: string;
  colors?: any;
  fonts?: any;
}

interface Proposal {
  id: number;
  nomeCliente: string;
  cpfCnpj?: string;
  valorAVista?: string;
  [key: string]: any;
}

export function ProposalGenerator() {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [proposalData, setProposalData] = useState<Partial<Proposal>>({
    nomeCliente: "",
    cpfCnpj: "",
    valorAVista: "",
  });
  const [previewHtml, setPreviewHtml] = useState("");

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/crm");
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json();
    },
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["proposal-templates"],
    queryFn: async () => {
      const res = await fetch("/api/proposal-templates");
      if (!res.ok) throw new Error("Erro ao carregar templates");
      return res.json();
    },
  });

  // Fetch proposals
  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const res = await fetch("/api/automation/propostas");
      if (!res.ok) throw new Error("Erro ao carregar propostas");
      return res.json();
    },
  });

  const selectedClientData = useMemo(() => {
    return clients.find((c: Client) => c.id.toString() === selectedClient);
  }, [selectedClient, clients]);

  // Auto-fill from client
  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find((c: Client) => c.id.toString() === clientId);
    if (client) {
      setProposalData((prev) => ({
        ...prev,
        nomeCliente: client.name,
        cpfCnpj: client.cpfCnpj,
        email: client.email,
        phone: client.phone,
        address: client.address,
      }));
    }
  };

  // Replace template variables
  const generatePreview = () => {
    const template = templates.find((t: ProposalTemplate) => t.id.toString() === selectedTemplate);
    if (!template) {
      toast.error("Selecione um template");
      return;
    }

    let html = template.html;
    Object.entries(proposalData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key.toUpperCase()}\\}\\}`, "g");
      html = html.replace(regex, String(value || ""));
    });

    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  // Generate and download PDF
  const { mutate: generatePDF, isPending } = useMutation({
    mutationFn: async () => {
      if (!previewHtml) {
        toast.error("Gere uma prévia primeiro");
        return;
      }

      const res = await fetch("/api/automation/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: previewHtml,
          clientId: selectedClient ? parseInt(selectedClient) : null,
          proposalId: null,
          fileName: `proposta-${proposalData.nomeCliente}-${new Date().toISOString().split('T')[0]}.pdf`,
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar PDF");

      // Download the PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposta-${proposalData.nomeCliente}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF gerado e salvo!");
      queryClient.invalidateQueries({ queryKey: ["client-files"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao gerar PDF");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Gerador de Propostas</h3>
        <Button onClick={() => setOpen(true)} size="sm">
          <FileDown className="w-4 h-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Proposta de Fotovoltaica</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList>
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="preview">Prévia</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente *</label>
                  <Select value={selectedClient} onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c: Client) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Template *</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t: ProposalTemplate) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Nome do Cliente</label>
                  <Input value={proposalData.nomeCliente || ""} onChange={(e) => setProposalData({ ...proposalData, nomeCliente: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">CPF/CNPJ</label>
                  <Input value={proposalData.cpfCnpj || ""} onChange={(e) => setProposalData({ ...proposalData, cpfCnpj: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Valor à Vista</label>
                  <Input type="number" value={proposalData.valorAVista || ""} onChange={(e) => setProposalData({ ...proposalData, valorAVista: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" value={proposalData.data || ""} onChange={(e) => setProposalData({ ...proposalData, data: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Potência (kWp)</label>
                  <Input value={proposalData.kwp || ""} onChange={(e) => setProposalData({ ...proposalData, kwp: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <textarea
                    value={proposalData.notes || ""}
                    onChange={(e) => setProposalData({ ...proposalData, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={generatePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 py-4">
              {previewHtml ? (
                <div className="border rounded p-4 bg-white">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-96 border"
                    title="preview"
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Gere uma prévia para visualizar</p>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => generatePDF()} disabled={!previewHtml || isPending} className="gap-2">
                  <Download className="w-4 h-4" />
                  {isPending ? "Gerando..." : "Gerar PDF"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
