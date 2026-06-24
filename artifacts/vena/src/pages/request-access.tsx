import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { useRequestAccess } from "@workspace/api-client-react";
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
            <h2 className="text-xl font-bold text-foreground">Solicitar Acesso</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados abaixo para solicitar acesso ao sistema VENA.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} className="bg-background" />
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
                    <FormLabel>E-mail Corporativo</FormLabel>
                    <FormControl>
                      <Input placeholder="seu.nome@empresa.com.br" {...field} className="bg-background" />
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
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Engenharia, Compras..." {...field} className="bg-background" />
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
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Engenheiro Civil, Analista..." {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6"
                disabled={requestMutation.isPending}
              >
                {requestMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </form>
          </Form>

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
