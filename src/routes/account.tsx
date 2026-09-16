import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { StoreShell } from "@/components/store/store-shell";
import { ProductCard } from "@/components/store/product-card";
import { listCategories, listProducts } from "@/lib/server/catalog";
import { lookupOrder } from "@/lib/server/orders";
import { useWishlistStore } from "@/lib/wishlist-store";

export const Route = createFileRoute("/account")({
  loader: async () => {
    const [categories, products] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
    ]);
    return { categories, products };
  },
  component: AccountPage,
});

function AccountPage() {
  const { categories, products } = Route.useLoaderData();
  const ids = useWishlistStore((s) => s.ids);
  const saved = useMemo(() => products.filter((p) => ids.includes(p.id)), [products, ids]);
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await lookupOrder({ data: { orderNumber, email } });
      window.localStorage.setItem(`elite-order-${result.orderNumber}`, result.accessToken);
      await navigate({
        to: "/order/$orderNumber",
        params: { orderNumber: result.orderNumber },
        search: { token: result.accessToken },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order not found.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-8">
        <h1 className="font-display text-4xl text-espresso">Your atelier</h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Look up an existing order or revisit pieces you’ve saved. Elite does not require an
          account to shop.
        </p>

        <form onSubmit={(e) => void lookup(e)} className="mt-10 max-w-lg space-y-3 rounded-[22px] border border-line bg-ivory p-6">
          <p className="label-caps">Order lookup</p>
          <input
            className="field"
            placeholder="Order number (ELT-1024)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
          <input
            className="field"
            type="email"
            placeholder="Email used at checkout"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Looking up…" : "View order"}
          </button>
        </form>

        <section className="mt-14">
          <h2 className="font-display text-2xl">Wishlist</h2>
          {saved.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing saved yet.{" "}
              <Link to="/shop" search={{ arrivals: undefined }} className="underline">
                Browse the collection
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {saved.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </StoreShell>
  );
}
