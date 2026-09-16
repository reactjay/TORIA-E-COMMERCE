import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, User, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ onSearch }: { onSearch: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hide =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/order");
  if (hide) return null;

  const item = (active: boolean) =>
    cn("grid size-12 place-items-center", active ? "text-espresso" : "text-espresso/55");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line glass lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        <Link to="/" aria-label="Home" className={item(pathname === "/")}>
          <Home className="size-5" strokeWidth={pathname === "/" ? 2.2 : 1.7} />
        </Link>
        <Link to="/shop" search={{ arrivals: undefined }} aria-label="Shop" className={item(pathname.startsWith("/shop"))}>
          <Store className="size-5" strokeWidth={pathname.startsWith("/shop") ? 2.2 : 1.7} />
        </Link>
        <button type="button" aria-label="Search" className={item(false)} onClick={onSearch}>
          <Search className="size-5" strokeWidth={1.7} />
        </button>
        <Link to="/cart" aria-label="Cart" className={item(pathname === "/cart")}>
          <ShoppingBag className="size-5" strokeWidth={pathname === "/cart" ? 2.2 : 1.7} />
        </Link>
        <Link to="/account" aria-label="Account" className={item(pathname === "/account")}>
          <User className="size-5" strokeWidth={pathname === "/account" ? 2.2 : 1.7} />
        </Link>
      </div>
    </nav>
  );
}
