import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

import { SidebarLayout } from "@/components/SidebarLayout";
import { Login } from "@/pages/login";
import { RequestAccess } from "@/pages/request-access";
import { SetPassword } from "@/pages/set-password";
import { Dashboard } from "@/pages/dashboard";
import { Compras } from "@/pages/compras";
import { Financeiro } from "@/pages/financeiro";
import { Obras } from "@/pages/obras";
import { Materiais } from "@/pages/materiais";
import { MonitorPrecos } from "@/pages/monitor-precos";
import { Admin } from "@/pages/admin";
import { Fornecedores } from "@/pages/fornecedores";

import { ComprasDetail } from "@/pages/compras-detail";
import { FornecedorDetail } from "@/pages/fornecedor-detail";
import { ObraDetail } from "@/pages/obra-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!user && location !== "/login" && location !== "/request-access" && !location.startsWith("/set-password")) {
    setLocation("/login");
    return null;
  }

  if (user && (location === "/login" || location === "/")) {
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/request-access" component={RequestAccess} />
      <Route path="/set-password" component={SetPassword} />
      
      <Route path="/dashboard">
        <SidebarLayout><Dashboard /></SidebarLayout>
      </Route>
      <Route path="/compras">
        <SidebarLayout><Compras /></SidebarLayout>
      </Route>
      <Route path="/fornecedores">
        <SidebarLayout><Fornecedores /></SidebarLayout>
      </Route>
      <Route path="/financeiro">
        <SidebarLayout><Financeiro /></SidebarLayout>
      </Route>
      <Route path="/obras">
        <SidebarLayout><Obras /></SidebarLayout>
      </Route>
      <Route path="/materiais">
        <SidebarLayout><Materiais /></SidebarLayout>
      </Route>
      <Route path="/monitor-precos">
        <SidebarLayout><MonitorPrecos /></SidebarLayout>
      </Route>
      <Route path="/admin">
        <SidebarLayout><Admin /></SidebarLayout>
      </Route>
      <Route path="/">
        <div />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGuard>
            <Router />
          </AuthGuard>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
