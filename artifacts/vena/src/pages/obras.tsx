import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { Search, Plus, Filter, Building2, MapPin, Calendar } from "lucide-react";

export function Obras() {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useListProjects({}, { query: { queryKey: getListProjectsQueryKey() } });

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Obras</h2>
          <p className="text-muted-foreground">Gestão de projetos e orçamento.</p>
        </div>
        <Button className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nova Obra
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou cliente..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const percentUsed = (project.spent / project.budget) * 100;
            const isOverBudget = percentUsed > 100;
            const isWarning = percentUsed > 85 && !isOverBudget;

            return (
              <Card key={project.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardHeader className="pb-4 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {project.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge variant="outline" className={`\${
                      project.status === 'active' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                      project.status === 'completed' ? 'bg-muted text-muted-foreground' :
                      project.status === 'paused' ? 'bg-accent/10 text-accent border-accent/20' : ''
                    }`}>
                      {project.status === 'active' ? 'Em andamento' : project.status === 'completed' ? 'Concluída' : project.status === 'paused' ? 'Pausada' : project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate" title={project.location || ''}>
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{project.location || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(project.startDate)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Orçamento Utilizado</span>
                        <span className={`font-medium \${isOverBudget ? 'text-destructive' : isWarning ? 'text-accent' : ''}`}>
                          {percentUsed.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full \${isOverBudget ? 'bg-destructive' : isWarning ? 'bg-accent' : 'bg-primary'}`} 
                          style={{ width: `\${Math.min(percentUsed, 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Gasto</span>
                          <span className="font-medium">{formatCurrency(project.spent)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-muted-foreground">Orçado</span>
                          <span className="font-medium">{formatCurrency(project.budget)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-12 text-center border rounded-lg bg-card text-muted-foreground">
            Nenhuma obra encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
