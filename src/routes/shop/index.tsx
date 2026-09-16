import { createFileRoute } from "@tanstack/react-router";
import { StoreShell } from "@/components/store/store-shell";
import { ShopView } from "@/components/store/shop-view";
import { listCategories, listProducts } from "@/lib/server/catalog";

export const Route = createFileRoute("/shop/")({
  validateSearch: (search: Record<string, unknown>) => ({
    arrivals: typeof search.arrivals === "string" ? search.arrivals : undefined,
  }),
  loader: async () => {
    const [categories, products] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
    ]);
    return { categories, products };
  },
  component: ShopIndex,
});

function ShopIndex() {
  const { categories, products } = Route.useLoaderData();
  const { arrivals } = Route.useSearch();
  return (
    <StoreShell categories={categories} products={products}>
      <ShopView
        categories={categories}
        products={products}
        activeSlug="all"
        arrivalsOnly={arrivals === "1"}
      />
    </StoreShell>
  );
}
