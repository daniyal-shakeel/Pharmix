import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Pill,
  Building2,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Radio,
  MapPin,
  FileText,
  Boxes,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, useCart, useNotifications } from "@/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Role } from "@/types";
import api from "@/api/base";
import { NotificationHub } from "@/components/notification-hub";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
};

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/app/medicines",
    label: "Catalog",
    icon: Pill,
    roles: ["pharmacy", "customer", "admin", "manufacturer"],
  },
  {
    to: "/app/inventory",
    label: "Inventory",
    icon: Boxes,
    roles: ["admin", "manufacturer", "pharmacy"],
  },
  {
    to: "/app/orders",
    label: "Orders",
    icon: ShoppingCart,
    roles: ["admin", "manufacturer", "pharmacy", "customer"],
  },
  {
    to: "/app/shipments",
    label: "Shipments",
    icon: Package,
    roles: ["admin", "manufacturer", "pharmacy", "delivery"],
  },
  { to: "/app/deliveries", label: "Deliveries", icon: Truck, roles: ["admin", "delivery"] },
  {
    to: "/app/tracking",
    label: "Live Tracking",
    icon: MapPin,
    roles: ["admin", "delivery", "customer"],
  },
  {
    to: "/app/payments",
    label: "Payments",
    icon: CreditCard,
    roles: ["admin", "pharmacy", "customer", "manufacturer"],
  },
  { to: "/app/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/app/partners", label: "Partners", icon: Building2, roles: ["admin", "manufacturer"] },
  {
    to: "/app/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["admin", "manufacturer", "pharmacy"],
  },
  { to: "/app/reports", label: "Reports", icon: FileText, roles: ["admin", "manufacturer"] },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  manufacturer: "Manufacturer",
  pharmacy: "Pharmacy",
  customer: "Customer",
  delivery: "Delivery Partner",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [openCmd, setOpenCmd] = useState(false);
  const cartCount = useCart((s) => s.carts.reduce((acc, cart) => acc + cart.items.reduce((a, b) => a + b.qty, 0), 0));
  const fetchCarts = useCart((s) => s.fetchCarts);
  const unreadNotifications = useNotifications((s) => s.unreadCount);

  const [summary, setSummary] = useState<{ title: string; value: string; description: string } | null>(null);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
    if (user?.role === 'pharmacy') fetchCarts();

    // Fetch Sidebar Summary
    const fetchSummary = async () => {
      try {
        const res = await api.get("/analytics/sidebar-summary");
        setSummary(res.data);
      } catch (err) {
        console.error("Failed to fetch sidebar summary", err);
      }
    };
    if (user) fetchSummary();
  }, [user, navigate, fetchCarts]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpenCmd((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!user) return null;
  const role = user.role;
  const items = NAV.filter((n) => !n.roles || n.roles.includes(role));

  return (
    <div className="flex min-h-screen w-full bg-canvas text-foreground">
      <NotificationHub />
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar sticky top-0 h-screen">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Pill className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Pharmix</span>
            <Badge
              variant="outline"
              className="ml-1 text-[10px] px-1.5 py-0 h-4 border-border bg-surface-2"
            >
              beta
            </Badge>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <div className="px-2 pb-1.5 pt-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </div>
          {items.map((n) => {
            const active = path === n.to || path.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <n.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          {summary ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 mb-1.5">
                <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{summary.title}</span>
              </div>
              <div className="text-xs font-semibold text-foreground mb-0.5">
                {summary.value}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {summary.description}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="h-3 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-full bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 md:px-6 border-b border-border bg-canvas/80 backdrop-blur-xl">
          <button
            onClick={() => setOpenCmd(true)}
            className="flex-1 max-w-md flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-surface text-xs text-muted-foreground hover:border-border-strong transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search medicines, orders, partners...</span>
            <kbd className="ml-auto text-[10px] bg-surface-2 px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {(role === "pharmacy" || role === "customer") && (
              <Link to="/app/cart">
                <Button variant="ghost" size="sm" className="relative h-8 px-2">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] grid place-items-center text-primary-foreground font-medium">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <ThemeToggle />
            <Link to="/app/notifications">
              <Button variant="ghost" size="sm" className="h-8 px-2 relative">
                <Bell className={`h-4 w-4 ${unreadNotifications > 0 ? "text-primary" : ""}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-0.5 rounded-full bg-primary text-[8px] grid place-items-center text-primary-foreground font-bold shadow-sm">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-8 px-1.5 rounded-md hover:bg-accent transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-medium">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start leading-none hidden sm:flex">
                    <span className="text-[11px] font-medium">{user.name}</span>
                    <span className="text-[9px] font-mono text-muted-foreground mt-0.5">
                      {user.entityId || user.id}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-xs font-medium">{user.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{ROLE_LABEL[role]}</span>
                    <span className="text-[10px] text-muted-foreground/40 font-mono">·</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{user.entityId || user.id}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await api.post("/auth/logout");
                    } catch (err) {
                      console.error("Logout API failed", err);
                    }
                    localStorage.removeItem("_phx_token");
                    logout();
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <CommandDialog open={openCmd} onOpenChange={setOpenCmd}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {items.map((n) => (
              <CommandItem
                key={n.to}
                onSelect={() => {
                  setOpenCmd(false);
                  navigate({ to: n.to });
                }}
              >
                <n.icon className="h-4 w-4 mr-2" /> {n.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
