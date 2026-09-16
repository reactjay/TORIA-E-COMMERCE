import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({
  children,
  title,
  subtitle,
  initials = "AD",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  initials?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-cream text-charcoal lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col border-r border-line bg-ivory/70 px-4 py-6 lg:flex">
        <Link to="/admin/dashboard" className="font-display px-3 text-2xl italic text-espresso">
          Elite
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.to || (l.to !== "/admin/dashboard" && pathname.startsWith(l.to));
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-espresso text-cream" : "text-espresso/80 hover:bg-beige/40",
                )}
              >
                <Icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-espresso/70 hover:bg-beige/40"
          onClick={() => {
            void signOut()
              .catch(() => undefined)
              .finally(() => navigate({ to: "/admin" }));
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-8">
          <div>
            <h1 className="font-display text-3xl text-espresso">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input className="field h-10 w-56 pl-9" placeholder="Search" readOnly />
            </div>
            <span className="relative grid size-10 place-items-center rounded-full border border-line">
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-2 rounded-full bg-espresso" />
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-espresso text-xs font-semibold text-cream">
              {initials.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-8">{children}</div>
        <nav className="sticky bottom-0 flex gap-1 overflow-x-auto border-t border-line bg-cream px-2 py-2 lg:hidden">
          {LINKS.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px]",
                  active ? "bg-espresso text-cream" : "text-muted",
                )}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
