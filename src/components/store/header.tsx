import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { cartCount, useCartStore } from "@/lib/cart-store";
import type { Category } from "@/lib/types";

const NAV = [
  { label: "New Arrivals", to: "/shop" as const, search: { arrivals: "1" as const } },
  { label: "Dresses", slug: "dresses" },
  { label: "Tops", slug: "tops" },
  { label: "Trousers", slug: "trousers" },
  { label: "Skirts", slug: "skirts" },
  { label: "Jackets", slug: "jackets" },
  { label: "Accessories", slug: "accessories" },
];

export function StoreHeader({
  onSearch,
}: {
  categories: Category[];
  onSearch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((s) => s.items);
  const count = hydrated ? cartCount(items) : 0;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setHydrated(true), []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8">
        <button
          type="button"
          className="grid size-11 place-items-center lg:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <Logo className="text-[1.55rem]" />
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) =>
            "slug" in item && item.slug ? (
              <Link
                key={item.label}
                to="/shop/$category"
                params={{ category: item.slug }}
                className="text-[13px] tracking-wide text-espresso/90 transition-colors hover:text-espresso"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to="/shop"
                search={{ arrivals: "1" }}
                className="text-[13px] tracking-wide text-espresso/90 transition-colors hover:text-espresso"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={onSearch}
            className="grid size-11 place-items-center"
          >
            <Search className="size-[18px]" />
          </button>
          <Link to="/cart" aria-label="Shopping bag" className="relative grid size-11 place-items-center">
            <ShoppingBag className="size-[18px]" />
            {count > 0 ? (
              <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-espresso px-1 text-[9px] font-semibold text-cream">
                {count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col bg-cream shadow-lift">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo />
              <button type="button" className="grid size-11 place-items-center" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col px-3">
              {NAV.map((item) =>
                "slug" in item && item.slug ? (
                  <Link
                    key={item.label}
                    to="/shop/$category"
                    params={{ category: item.slug }}
                    className="border-b border-line px-3 py-4 text-[15px]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    key={item.label}
                    to="/shop"
                    search={{ arrivals: "1" }}
                    className="border-b border-line px-3 py-4 text-[15px]"
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <Link to="/about" className="border-b border-line px-3 py-4 text-[15px]">
                About
              </Link>
              <Link to="/contact" className="px-3 py-4 text-[15px]">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
