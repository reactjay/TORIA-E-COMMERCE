import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

const TABS = [
  { slug: "all", label: "All" },
  { slug: "dresses", label: "Dresses" },
  { slug: "tops", label: "Tops" },
  { slug: "trousers", label: "Trousers" },
  { slug: "skirts", label: "Skirts" },
  { slug: "jackets", label: "Jackets" },
  { slug: "accessories", label: "Accessories" },
];

export function ShopView({
  categories,
  products,
  activeSlug,
  arrivalsOnly,
}: {
  categories: Category[];
  products: Product[];
  activeSlug: string;
  arrivalsOnly?: boolean;
}) {
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (activeSlug !== "all") list = list.filter((p) => p.categorySlug === activeSlug);
    if (arrivalsOnly) list = list.filter((p) => p.isNew);
    if (inStock) list = list.filter((p) => p.stock > 0);
    const copy = [...list];
    if (sort === "price_asc") copy.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") copy.sort((a, b) => b.price - a.price);
    return copy;
  }, [products, activeSlug, arrivalsOnly, inStock, sort]);

  const title =
    activeSlug === "all"
      ? arrivalsOnly
        ? "New Arrivals"
        : "The Collection"
      : (categories.find((c) => c.slug === activeSlug)?.name ?? "Shop");

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-6 sm:px-8">
      <div className="mb-5 overflow-x-auto border-b border-line">
        <div className="flex min-w-max gap-6 px-1">
          {TABS.map((tab) => {
            const active = tab.slug === activeSlug && !arrivalsOnly;
            return (
              <Link
                key={tab.slug}
                to={tab.slug === "all" ? "/shop" : "/shop/$category"}
                params={tab.slug === "all" ? undefined : { category: tab.slug }}
                search={tab.slug === "all" ? { arrivals: undefined } : undefined}
                className={cn(
                  "relative pb-3 text-sm",
                  active ? "font-semibold text-espresso" : "text-muted",
                )}
              >
                {tab.label}
                {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-espresso" /> : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button type="button" className="btn-secondary h-12 gap-2" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal className="size-4" /> Filter
        </button>
        <button type="button" className="btn-secondary h-12 gap-2" onClick={() => setSortOpen(true)}>
          <ArrowUpDown className="size-4" /> Sort by
        </button>
      </div>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-espresso">{title}</h1>
          <p className="mt-1 text-sm text-muted">{filtered.length} pieces</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-muted">New pieces arriving soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {filterOpen ? (
        <Sheet title="Filter" onClose={() => setFilterOpen(false)}>
          <label className="flex items-center gap-3 py-2 text-sm">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
            In stock only
          </label>
          <button type="button" className="btn-primary mt-6 w-full" onClick={() => setFilterOpen(false)}>
            Apply
          </button>
        </Sheet>
      ) : null}

      {sortOpen ? (
        <Sheet title="Sort by" onClose={() => setSortOpen(false)}>
          {(
            [
              ["newest", "Newest"],
              ["price_asc", "Price: low to high"],
              ["price_desc", "Price: high to low"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                "block w-full py-3 text-left text-sm",
                sort === value ? "font-semibold" : "text-muted",
              )}
              onClick={() => {
                setSort(value);
                setSortOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </Sheet>
      ) : null}
    </div>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-charcoal/40" aria-label="Close" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-[22px] bg-cream p-6 shadow-lift">
        <p className="font-display text-2xl">{title}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
