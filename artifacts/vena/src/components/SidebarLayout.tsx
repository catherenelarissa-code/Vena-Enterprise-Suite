import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, useLogout } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  DollarSign, 
  HardHat, 
  Package, 
  TrendingDown, 
  Users, 
  LogOut,
  Menu,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "./ui/button";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login")
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Compras", href: "/compras", icon: ShoppingCart },
    { name: "Fornecedores", href: "/fornecedores", icon: Truck },
    { name: "Financeiro", href: "/financeiro", icon: DollarSign },
    { name: "Obras", href: "/obras", icon: HardHat },
    { name: "Materiais", href: "/materiais", icon: Package },
    { name: "Monitor de Preços", href: "/monitor-precos", icon: TrendingDown },
    { name: "Automação", href: "/automacao", icon: Bot },
    ...(user?.role === "admin" ? [{ name: "Admin", href: "/admin", icon: Users }] : []),
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border/50 px-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold tracking-tight">VENA</div>
            <div className="h-2 w-2 rounded-full bg-sidebar-primary" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name || "Usuário"}</span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{user?.role || "Role"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b bg-card px-6 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="-ml-2 mr-2">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-bold">
            VENA <div className="h-2 w-2 rounded-full bg-accent" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
