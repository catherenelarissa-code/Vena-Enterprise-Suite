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
  Zap,
  Users2,
  CalendarDays
} from "lucide-react";

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
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-orange-400" },
    { name: "CRM", href: "/crm", icon: Users2, color: "text-purple-400" },
    { name: "Agenda", href: "/agenda", icon: CalendarDays, color: "text-blue-400" },
    { name: "Compras", href: "/compras", icon: ShoppingCart, color: "text-green-400" },
    { name: "Fornecedores", href: "/fornecedores", icon: Truck, color: "text-blue-400" },
    { name: "Financeiro", href: "/financeiro", icon: DollarSign, color: "text-yellow-400" },
    { name: "Obras", href: "/obras", icon: HardHat, color: "text-orange-300" },
    { name: "Materiais", href: "/materiais", icon: Package, color: "text-green-300" },
    { name: "Monitor de Preços", href: "/monitor-precos", icon: TrendingDown, color: "text-red-400" },
    { name: "Automação", href: "/automacao", icon: Zap, color: "text-yellow-300" },
    ...(user?.role === "admin" ? [{ name: "Admin", href: "/admin", icon: Users, color: "text-purple-400" }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{
      background: "linear-gradient(135deg, hsl(220,25%,6%) 0%, hsl(200,25%,9%) 40%, hsl(152,30%,8%) 100%)"
    }}>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col",
        "border-r border-white/5",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{
        background: "linear-gradient(180deg, hsl(152,60%,7%) 0%, hsl(152,50%,9%) 50%, hsl(220,25%,8%) 100%)",
      }}>

       {/* Logo */}
<div className="flex h-20 shrink-0 items-center justify-center px-4 border-b border-white/5">
  <img 
    src="/vena_logo.png" 
    alt="Vena Engenharia" 
    className="w-44 object-contain"
  />
</div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer group",
                      isActive
                        ? "bg-orange-500/15 text-white border border-orange-500/20"
                        : "text-white/60 hover:bg-white/5 hover:text-white/90"
                    )}>
                      <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-md transition-all",
                        isActive ? "bg-orange-500/20" : "bg-white/5 group-hover:bg-white/10"
                      )}>
                        <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-orange-400" : item.color)} />
                      </div>
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 shrink-0">
              <span className="text-xs font-bold text-green-400">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-white/40 capitalize">{user?.role || "Role"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} 
              className="text-white/40 hover:text-white hover:bg-white/5 shrink-0 h-7 w-7">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 shrink-0 items-center border-b border-white/5 bg-black/20 px-6 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="-ml-2 mr-2 text-white/60">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-bold text-white">
            vena <div className="h-2 w-2 rounded-full bg-orange-400" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
