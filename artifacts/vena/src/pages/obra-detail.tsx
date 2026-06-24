import { useParams, Link } from "wouter";
import { useGetProject, getGetProjectQueryKey, useGetProjectBudgetAnalysis, getGetProjectBudgetAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft, Building2, MapPin, User, Calendar, DollarSign, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export function ObraDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: project, isLoading: isLoadingProject } = useGetProject(
    id, 
    { query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) } }
  );

  const { data: budget, isLoading: isLoadingBudget } = useGetProjectBudgetAnalysis(
    id,
    { query: { enabled: !!id, queryKey: getGetProjectBudgetAnalysisQueryKey(id) } }
  );

  if (!id) return <div>ID inválido</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/obras">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              {isLoadingProject ? <Skeleton className="h-8 w-64" /> : project?.name}
            </h2>
            {project && (
              <Badge variant="outline" className={`\${
                project.status === 'active' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                'bg-muted text-muted-foreground'
              }`}>
                {project.status === 'active' ? 'Em andamento' : project.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {project?.client}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Análise de Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBudget ? (
              <Skeleton className="h-64 w-full" />
            ) : budget ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Orçado</p>
                    <p className="text-xl font-bold">{formatCurrency(budget.budget)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gasto (Realizado)</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(budget.spent)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Comprometido</p>
                    <p className="text-xl font-bold text-accent">{formatCurrency(budget.committed)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Livre</p>
                    <p className={`text-xl font-bold \${budget.remaining < 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(budget.remaining)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <PieChart className="h-4 w-4" /> Despesas por Categoria
                    </h3>
                    <span className="text-sm font-medium text-muted-foreground">
                      {budget.percentUsed.toFixed(1)}% do total
                    </span>
                  </div>
                  
                  {budget.byCategory && budget.byCategory.length > 0 ? (
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budget.byCategory} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" tickFormatter={(val) => `R$ \${val/1000}k`} />
                          <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            cursor={{fill: "hsl(var(--muted))"}}
                          />
                          <Legend />
                          <Bar dataKey="spent" name="Gasto" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="budgeted" name="Orçado" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-md bg-muted/20">
                      Nenhuma despesa categorizada.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Ficha Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingProject ? (
              <Skeleton className="h-48 w-full" />
            ) : project ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Gestor Responsável</p>
                    <p className="font-medium">{project.manager || 'Não atribuído'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Local</p>
                    <p className="font-medium">{project.location || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Início</p>
                    <p className="font-medium">{formatDate(project.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Previsão Entrega</p>
                    <p className="font-medium">{project.endDate ? formatDate(project.endDate) : '-'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Descrição</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.description || 'Sem descrição.'}
                  </p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
