import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/types";

export function SearchDialog({
  open,
  onClose,
  products,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products.slice(0, 6);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.categoryName.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    );
  }, [q, products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-charcoal/35" aria-label="Close search" onClick={onClose} />
      <div className="relative mx-auto mt-16 w-[min(640px,92vw)] overflow-hidden rounded-[22px] glass-strong shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            className="h-14 flex-1 bg-transparent text-base outline-none"
            placeholder="Search the collection"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="grid size-10 place-items-center" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-auto p-2">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">No pieces matched.</li>
          ) : (
            results.map((p) => (
              <li key={p.id}>
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-beige/30"
                >
                  <img src={p.imageUrl} alt="" className="size-14 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.categoryName}</p>
                  </div>
                  <p className="text-sm">{formatNaira(p.price)}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
