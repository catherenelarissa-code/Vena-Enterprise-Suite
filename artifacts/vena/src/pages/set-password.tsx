imprt { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link, useSearch } from "wouter";
import { useSetPassword } from "@workspace/api-client-react";
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

const setPasswordSchema = z.object({
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "Confirme sua senha" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export function SetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const token = searchParams.get('token') || '';

  const { toast } = useToast();
  const setPasswordMutation = useSetPassword();

  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: z.infer<typeof setPasswordSchema>) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Link inválido",
        description: "Token de acesso não encontrado.",
      });
      return;
    }

    setPasswordMutation.mutate(
      { data: { token, password: data.password } },
      {
        onSuccess: () => {
          toast({
            title: "Senha configurada!",
            description: "Você já pode fazer login no sistema.",
          });
          setLocation("/login");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Link expirado ou inválido.",
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
        <h2 className="text-lg font-bold text-white">Bem-vindo à Vena</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(180,200,185,0.6)" }}>
          Defina sua senha para finalizar o acesso ao sistema.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Nova Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="brand-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>Confirmar Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="brand-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={setPasswordMutation.isPending || !token}
            className="group relative w-full mt-2 overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-strong) 100%)",
              color: "#0a0f0c",
              boxShadow: "var(--shadow-glow-orange)",
            }}
          >
            {setPasswordMutation.isPending ? "Finalizando..." : "Finalizar Acesso"}
          </button>
        </form>
      </Form>

      {!token && (
        <div
          className="mt-4 p-3 text-sm rounded-md border text-center"
          style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.2)", color: "#f87171" }}
        >
          Aviso: Token de acesso ausente na URL.
        </div>
      )}

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
