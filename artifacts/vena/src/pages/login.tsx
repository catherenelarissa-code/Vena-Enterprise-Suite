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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-baseline gap-2 mb-2">
            <h1 className="text-5xl font-bold tracking-tighter text-primary">VENA</h1>
            <div className="h-3 w-3 rounded-full bg-accent" />
          </div>
          
          <div className="h-6 relative w-full flex justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-muted-foreground text-sm font-medium absolute"
              >
                {MOTIVATIONAL_PHRASES[phraseIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl shadow-xl p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">E-mail corporativo</FormLabel>
                    <FormControl>
                      <Input placeholder="seu.nome@empresa.com.br" {...field} className="h-11 bg-background" />
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
                    <FormLabel className="text-foreground/80">Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-foreground/80 cursor-pointer">
                        Manter conectado
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-sm"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Autenticando..." : "Entrar"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 flex justify-between text-sm text-muted-foreground">
            <Link href="/request-access">
              <span className="hover:text-primary transition-colors cursor-pointer font-medium">
                Solicitar acesso
              </span>
            </Link>
            <Link href="#">
              <span className="hover:text-primary transition-colors cursor-pointer">
                Esqueci minha senha
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground/60">
          Vena Engenharia © {new Date().getFullYear()} Todos os direitos reservados
        </div>
      </motion.div>
    </div>
  );
}
