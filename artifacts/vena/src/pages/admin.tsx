import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useApproveUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ShieldAlert, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = import.meta.env.VITE_API_URL ?? "";

async function authFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}/api/auth${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    const err: any = new Error(parsed?.error || text || "Erro na requisição");
    err.details = parsed?.details;
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function Admin() {
  const { data: users, isLoading } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const approveUserMutation = useApproveUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: number; name: string } | null>(null);

  const handleApprove = (userId: number) => {
    approveUserMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "Usuário aprovado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro ao aprovar usuário", variant: "destructive" });
      }
    });
  };

  const handleDeactivate = async (userId: number) => {
    setDeactivatingId(userId);
    try {
      await authFetch(`/users/${userId}/deactivate`, { method: "PATCH" });
      toast({ title: "Usuário inativado com sucesso" });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (err: any) {
      toast({ title: "Erro ao inativar usuário", description: err.message, variant: "destructive" });
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteUser) return;
    const userId = confirmDeleteUser.id;
    setDeletingId(userId);
    try {
      await authFetch(`/users/${userId}`, { method: "DELETE" });
      toast({ title: "Usuário excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setConfirmDeleteUser(null);
    } catch (err: any) {
      if (err.status === 409) {
        toast({
          title: "Não foi possível excluir",
          description: `Este usuário possui: ${(err.details || []).join(", ") || "registros vinculados"}. Use 'Inativar' em vez de excluir.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Erro ao excluir usuário", description: err.message, variant: "destructive" });
      }
      setConfirmDeleteUser(null);
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Administração</h2>
        <p className="text-muted-foreground">Gerenciamento de usuários e permissões do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>Controle quem tem acesso à plataforma VENA.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm text-muted-foreground">
              <div className="col-span-4">Usuário</div>
              <div className="col-span-3">Cargo / Departamento</div>
              <div className="col-span-2">Nível de Acesso</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-12"><Skeleton className="h-10 w-full" /></div>
                  </div>
                ))
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <div className="col-span-3 flex flex-col">
                      <span>{user.position || '-'}</span>
                      <span className="text-xs text-muted-foreground">{user.department || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={`
                        \${user.role === 'admin' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                        \${user.role === 'manager' ? 'bg-accent/10 text-accent border-accent/20' : ''}
                        \${user.role === 'engineer' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                        capitalize
                      `}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge variant="outline" className={`
                        \${user.status === 'active' ? 'bg-secondary/10 text-secondary border-secondary/20' : ''}
                        \${user.status === 'pending' ? 'bg-accent/10 text-accent border-accent/20' : ''}
                      `}>
                        {user.status === 'active' ? 'Ativo' : user.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      {user.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-secondary hover:bg-secondary/90 h-8"
                          onClick={() => handleApprove(user.id)}
                          disabled={approveUserMutation.isPending}
                        >
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                        </Button>
                      )}
                      {user.status === 'active' && user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={deactivatingId === user.id}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          {deactivatingId === user.id ? "Inativando..." : "Revogar"}
                        </Button>
                      )}
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setConfirmDeleteUser({ id: user.id, name: user.name })}
                          disabled={deletingId === user.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDeleteUser} onOpenChange={(o) => { if (!o) setConfirmDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{confirmDeleteUser?.name}</strong> permanentemente? Essa ação não pode ser desfeita.
              Se o usuário tiver tarefas, compromissos ou histórico vinculados, a exclusão será bloqueada — use "Revogar" nesse caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
