import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AuthShell, AuthLogo } from "@/components/AuthBackdrop";

const RAILWAY = "https://workspaceapi-server-production-783e.up.railway.app";

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
  const [isPending, setIsPending] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % MOTIVATIONAL_PHRASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsPending(true);
    try {
      // Chama Railway diretamente para evitar problemas de cookie cross-domain via Vercel
      const res = await fetch(`${RAILWAY}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "E-mail ou senha incorretos.",
        });
        return;
      }
      // Aguarda sessão ser salva e redireciona
      setTimeout(() => setLocation("/dashboard"), 200);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
      });
    } finally {
      setIsPending(false);
    }
  };

  async function handleForgotPassword() {
    if (!forgotEmail) { toast({ variant: "destructive", title: "Informe seu e-mail." }); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${RAILWAY}/api/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.resetLink) {
        setResetLink(data.resetLink);
      } else {
        toast({ title: "Se o e-mail existir, você receberá as instruções." });
        setShowForgot(false);
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao processar solicitação." });
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-7 flex flex-col items-center text-center">
        <AuthLogo />
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
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
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(180,200,185,0.7)" }}>
                E-mail corporativo
              </FormLabel>
              <FormControl>
                <Input placeholder="seu.nome@empresa.com.br" {...field} className="brand-input h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(180,200,185,0.7)" }}>
                Senha
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="brand-input h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="rememberMe" render={({ field }) => (
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
              <button
                type="button"
                onClick={() => { setShowForgot(true); setResetLink(null); setForgotEmail(""); }}
                className="text-xs font-medium transition-colors hover:opacity-80 cursor-pointer"
                style={{ color: "rgba(180,200,185,0.7)" }}
              >
                Esqueci minha senha
              </button>
            </FormItem>
          )} />

          <button
            type="submit"
            disabled={isPending}
            className="group relative w-full overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-strong) 100%)",
              color: "#0a0f0c",
              boxShadow: "var(--shadow-glow-orange)",
            }}
          >
            <span className="relative z-10">
              {isPending ? "Autenticando..." : "Entrar na plataforma"}
            </span>
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1" style={{ background: "var(--auth-bg-border)" }} />
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(180,200,185,0.5)" }}>ou</span>
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

      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-sm border-white/10" style={{ background: "hsl(220,25%,11%)" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Recuperar senha</DialogTitle>
          </DialogHeader>
          {resetLink ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-white/60">Link de redefinição gerado. Copie e acesse:</p>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 break-all text-xs text-white/80 font-mono">
                {resetLink}
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => { window.open(resetLink, "_blank"); setShowForgot(false); }}
              >
                Abrir link de redefinição
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-white/60">Informe seu e-mail para receber o link de redefinição de senha.</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/50 uppercase tracking-wider">E-mail</Label>
                <Input
                  placeholder="seu@email.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="brand-input"
                  onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowForgot(false)} className="border-white/10 text-white/60">
                  Cancelar
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {forgotLoading ? "Buscando..." : "Recuperar"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AuthShell>
  );
}
