```tsx
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetDashboardCashFlow,
  getGetDashboardCashFlowQueryKey,
  useGetDashboardProjectsOverview,
  getGetDashboardProjectsOverviewQueryKey,
  useGetDashboardAlerts,
  getGetDashboardAlertsQueryKey
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

import {
  DollarSign,
  AlertTriangle,
  Briefcase,
  PackageOpen,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Boxes
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const {
    data: summary,
    isLoading: isLoadingSummary
  } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey()
    }
  });

  const {
    data: projects,
    isLoading: isLoadingProjects
  } = useGetDashboardProjectsOverview({
    query: {
      queryKey: getGetDashboardProjectsOverviewQueryKey()
    }
  });

  const {
    data: alerts,
    isLoading: isLoadingAlerts
  } = useGetDashboardAlerts({
    query: {
      queryKey: getGetDashboardAlertsQueryKey()
    }
  });

  useGetDashboardCashFlow({
    query: {
      queryKey: getGetDashboardCashFlowQueryKey()
    }
  });

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-3xl font-bold">
          Dashboard
        </h2>

        <p className="text-muted-foreground">
          Visão geral e indicadores em tempo real
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

        {isLoadingSummary ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className="h-32 rounded-xl"
              />
            ))
        ) : summary ? (
          <>

            <Card>
              <CardHeader>
                <CardTitle>
                  Saldo Projetado
                </CardTitle>
              </CardHeader>

              <CardContent>

                <div className="flex items-center gap-2">

                  <DollarSign />

                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.cashBalance)}
                  </div>

                </div>

                <p className="text-sm text-muted-foreground">

                  <ArrowDownRight className="inline h-4 w-4" />

                  A pagar:
                  {" "}
                  {formatCurrency(summary.payableThisWeek)}

                </p>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Compras Pendentes
                </CardTitle>
              </CardHeader>

              <CardContent>

                <div className="flex items-center gap-2">

                  <PackageOpen />

                  <div className="text-2xl font-bold">
                    {summary.pendingPurchases}
                  </div>

                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Obras Ativas
                </CardTitle>
              </CardHeader>

              <CardContent>

                <div className="flex items-center gap-2">

                  <Briefcase />

                  <div className="text-2xl font-bold">
                    {summary.activeProjects}
                  </div>

                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Estoque Crítico
                </CardTitle>
              </CardHeader>

              <CardContent>

                <div className="flex items-center gap-2">

                  <AlertTriangle />

                  <div className="text-2xl font-bold">
                    {summary.lowStockItems}
                  </div>

                </div>

                <p className="text-sm text-muted-foreground">
                  Materiais abaixo do mínimo
                </p>

              </CardContent>
            </Card>

            <Card className="border-primary">

              <CardHeader>

                <CardTitle>
                  📦 Estoque Inteligente
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="flex items-center gap-2">

                  <Boxes />

                  <div className="text-xl font-bold">
                    Ativo
                  </div>

                </div>

                <p className="text-sm text-muted-foreground">

                  Reposição automática
                  <br />
                  Previsão de consumo

                </p>

              </CardContent>

            </Card>

          </>
        ) : null}

      </div>

      <Card>

        <CardHeader>

          <CardTitle>
            Alertas Ativos
          </CardTitle>

        </CardHeader>

        <CardContent>

          {isLoadingAlerts ? (

            <Skeleton className="h-48" />

          ) : alerts?.length ? (

            alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="mb-3"
              >

                <Badge>

                  {alert.severity}

                </Badge>

                <div>

                  {alert.title}

                </div>

                <div className="text-muted-foreground">

                  {alert.message}

                </div>

              </div>
            ))

          ) : (

            <div className="text-center py-8">

              <CheckCircle2 className="mx-auto mb-3" />

              Tudo em ordem

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}
```
