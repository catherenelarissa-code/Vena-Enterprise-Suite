import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { useRequestAccess } from "@workspace/api-client-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthShell, AuthLogo } from "@/components/AuthBackdrop";

const requestAccessSchema = z.object({
  name: z.string().min(2, { message: "O nome completo é obrigatório" }),
  email: z.string().email({ message: "E-mail corporativo inválido" }),
  department: z.string().min(2, { message: "O departamento é obrigatório" }),
  position: z.string().min(2, { message: "O cargo é obrigatório" }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
  confirmPassword: z.string().min(1, { message: "Confirme sua senha" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export function RequestAccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const requestMutation = useRequestAccess();

  const form = useForm<z.infer<typeof requestAccessSchema>>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: {
      name: "", email: "", department: "", position: "", password: "", confirmPassword: "",
    },
  });

  const onSubmit = (data: z.infer<typeof requestAccessSchema>) => {
    requestMutation.mutate(
      { data: { name: data.name, email: data.email, department: data.department, position: data.position, password: data.password } },
      {
        onSuccess: () => {
          toast({
            title: "Solicitação enviada!",
            description: "Sua solicitação foi enviada. Aguarde a aprovação do administrador para acessar o sistema.",
          });
          setLocation("/login");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Erro ao enviar solicitação",
            description: err?.message ?? "Ocorreu um erro. Tente novamente.",
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
        <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          <span style={{ color: "#fff" }}>vena</span>{" "}
          <span style={{ color: "var(--brand-neon)" }}>engenharia</span>
        </h1>
      </div>

      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Solicitar Acesso</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(180,200,185,0.6)" }}>
          Preencha os dados abaixo. Após aprovação do administrador, você já poderá entrar com sua senha.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Nome Completo</FormLabel>
              <FormControl><Input placeholder="Seu nome completo" {...field} className="brand-input" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>E-mail Corporativo</FormLabel>
              <FormControl><Input placeholder="seu.nome@empresa.com.br" {...field} className="brand-input" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="department" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Departamento</FormLabel>
                <FormControl><Input placeholder="Ex: Engenharia" {...field} className="brand-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="position" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Cargo</FormLabel>
                <FormControl><Input placeholder="Ex: Engenheiro" {...field} className="brand-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-xs mb-3" style={{ color: "rgba(180,200,185,0.5)" }}>Defina sua senha de acesso</p>
            <div className="space-y-3">
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Senha</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} className="brand-input" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Confirmar Senha</FormLabel>
                  <FormControl><Input type="password" placeholder="Repita a senha" {...field} className="brand-input" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

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

      <div className="mt-5 text-center text-sm">
        <Link href="/login">
          <span className="transition-colors cursor-pointer hover:opacity-80" style={{ color: "rgba(180,200,185,0.6)" }}>
            Voltar para o login
          </span>
        </Link>
      </div>
    </AuthShell>
  );
}
