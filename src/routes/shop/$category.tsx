import { createFileRoute, notFound } from "@tanstack/react-router";
import { StoreShell } from "@/components/store/store-shell";
import { ShopView } from "@/components/store/shop-view";
import { listCategories, listProducts } from "@/lib/server/catalog";

export const Route = createFileRoute("/shop/$category")({
  loader: async ({ params }) => {
    const [categories, products] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
    ]);
    const found = categories.find((c) => c.slug === params.category);
    if (!found) throw notFound();
    return { categories, products, category: found };
  },
  component: ShopCategory,
});

function ShopCategory() {
  const { categories, products, category } = Route.useLoaderData();
  return (
    <StoreShell categories={categories} products={products}>
      <ShopView categories={categories} products={products} activeSlug={category.slug} />
    </StoreShell>
  );
}
