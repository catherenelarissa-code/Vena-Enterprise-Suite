import { useForm } from "react-hook-form";
impot { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { useRequestAccess } from "@workspace/api-client-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthShell, AuthLogo } from "@/components/AuthBackdrop";

const requestAccessSchema = z.object({
  name: z.string().min(2, { message: "O nome completo é obrigatório" }),
  email: z.string().email({ message: "E-mail corporativo inválido" }),
  department: z.string().min(2, { message: "O departamento é obrigatório" }),
  position: z.string().min(2, { message: "O cargo é obrigatório" }),
});

export function RequestAccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const requestMutation = useRequestAccess();

  const form = useForm<z.infer<typeof requestAccessSchema>>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      position: "",
    },
  });

  const onSubmit = (data: z.infer<typeof requestAccessSchema>) => {
    requestMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Solicitação enviada!",
            description: "Sua solicitação de acesso foi enviada para aprovação do administrador.",
          });
          setLocation("/login");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro ao enviar solicitação",
            description: "Ocorreu um erro. Tente novamente mais tarde.",
          });
        },
      }
    );
  };

  const labelStyle = { color: "rgba(180,200,185,0.7)" };

  return (
    <AuthShell>
      <div className="mb-6 flex flex-col items-center text-center">
        <AuthLogo size="sm" />
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span style={{ color: "#fff" }}>vena</span>{" "}
          <span style={{ color: "var(--brand-neon)" }}>engenharia</span>
        </h1>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Solicitar Acesso</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(180,200,185,0.6)" }}>
          Preencha os dados abaixo para solicitar acesso ao sistema VENA.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} className="brand-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>E-mail Corporativo</FormLabel>
                <FormControl>
                  <Input placeholder="seu.nome@empresa.com.br" {...field} className="brand-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Departamento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Engenharia, Compras..." {...field} className="brand-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Engenheiro Civil, Analista..." {...field} className="brand-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={requestMutation.isPending}
            className="group relative w-full mt-2 overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-strong) 100%)",
              color: "#0a0f0c",
              boxShadow: "var(--shadow-glow-orange)",
            }}
          >
            {requestMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm">
        <Link href="/login">
          <span
            className="transition-colors cursor-pointer hover:opacity-80"
            style={{ color: "rgba(180,200,185,0.6)" }}
          >
            Voltar para o login
          </span>
        </Link>
      </div>
    </AuthShell>
  );
}
