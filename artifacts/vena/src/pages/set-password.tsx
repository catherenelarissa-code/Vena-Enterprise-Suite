import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link, useSearch } from "wouter";
import { useSetPassword } from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-bold tracking-tighter text-primary">VENA</h1>
            <div className="h-2 w-2 rounded-full bg-accent" />
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Bem-vindo à Vena</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Defina sua senha para finalizar o acesso ao sistema.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
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
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6"
                disabled={setPasswordMutation.isPending || !token}
              >
                {setPasswordMutation.isPending ? "Finalizando..." : "Finalizar Acesso"}
              </Button>
            </form>
          </Form>

          {!token && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 text-center">
              Aviso: Token de acesso ausente na URL.
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/login">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Voltar para o login
              </span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
