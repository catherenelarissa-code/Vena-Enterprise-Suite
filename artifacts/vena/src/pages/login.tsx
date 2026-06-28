import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AuthShell, AuthLogo } from "@/components/AuthBackdrop";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail corporativo inválido" }),
  password: z.string().min(1, { message: "A senha é obrigatória" }),
  rememberMe: z.boolean().default(false),
});

const MOTIVATIONAL_PHRASES = [
  "Gestão Inteligente de Compras e Obras",
  "O centro de controle da sua engenharia",
  "Precisão em cada decisão de compra",
  "Eficiência que transforma projetos",
  "Informação no tempo certo para a melhor decisão",
  "Construindo o futuro com controle total"
];

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % MOTIVATIONAL_PHRASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: { email: data.email, password: data.password } },
      {
        onSuccess: () => {
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "E-mail ou senha incorretos.",
          });
        },
      }
    );
  };

  return (
    <AuthShell>
      <div className="mb-7 flex flex-col items-center text-center">
        <AuthLogo />
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span style={{ color: "#fff" }}>vena</span>{" "}
          <span style={{ color: "var(--brand-neon)" }}>engenharia</span>
        </h1>
        <div className="h-6 relative w-full flex justify-center mt-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-sm font-medium absolute"
              style={{ color: "rgba(180,200,185,0.7)" }}
            >
              {MOTIVATIONAL_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(180,200,185,0.7)" }}>
                  E-mail corporativo
                </FormLabel>
                <FormControl>
                  <Input placeholder="seu.nome@empresa.com.br" {...field} className="brand-input h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(180,200,185,0.7)" }}>
                  Senha
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="brand-input h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-y-0 py-1">
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-3.5 w-3.5 data-[state=checked]:bg-[var(--brand-orange)] data-[state=checked]:border-[var(--brand-orange)]"
                    />
                  </FormControl>
                  <FormLabel className="text-xs font-normal cursor-pointer" style={{ color: "rgba(180,200,185,0.7)" }}>
                    Manter conectado
                  </FormLabel>
                </div>
                <Link href="#">
                  <span
                    className="text-xs font-medium transition-colors hover:opacity-80 cursor-pointer"
                    style={{ color: "rgba(180,200,185,0.7)" }}
                  >
                    Esqueci minha senha
                  </span>
                </Link>
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="group relative w-full overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-strong) 100%)",
              color: "#0a0f0c",
              boxShadow: "var(--shadow-glow-orange)",
            }}
          >
            <span className="relative z-10">
              {loginMutation.isPending ? "Autenticando..." : "Entrar na plataforma"}
            </span>
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1" style={{ background: "var(--auth-bg-border)" }} />
            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(180,200,185,0.5)" }}>ou</span>
            <div className="h-px flex-1" style={{ background: "var(--auth-bg-border)" }} />
          </div>

          <Link href="/request-access">
            <button
              type="button"
              className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ borderColor: "rgba(143,217,75,0.35)", color: "var(--brand-neon)", background: "rgba(143,217,75,0.04)" }}
            >
              Solicitar acesso
            </button>
          </Link>
        </form>
      </Form>

      <p className="mt-6 text-center text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(180,200,185,0.4)" }}>
        Vena Engenharia © {new Date().getFullYear()}
      </p>
    </AuthShell>
  );
}
