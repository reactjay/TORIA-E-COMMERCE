import { createFileRoute } from "@tanstack/react-router";
import { StoreShell } from "@/components/store/store-shell";
import { getStoreSettings, listCategories, listProducts } from "@/lib/server/catalog";

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [categories, products, settings] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      getStoreSettings(),
    ]);
    return { categories, products, settings };
  },
  component: AboutPage,
});

function AboutPage() {
  const { categories, products, settings } = Route.useLoaderData();
  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="label-caps">The maison</p>
        <h1 className="mt-3 font-display text-5xl text-espresso">Wear your presence.</h1>
        <p className="mt-6 text-lg leading-relaxed text-espresso/80">
          Elite is a contemporary fashion house designed in Lagos. We make considered pieces —
          linen shirts, satin dresses, precise tailoring — in a palette of cream, espresso and
          charcoal. Nothing louder than it needs to be. Everything meant to last.
        </p>
        <img src="/images/hero.jpg" alt="" className="mt-10 aspect-[16/9] w-full object-cover" />
        <p className="mt-8 text-sm leading-relaxed text-muted">
          From {settings.storeAddress}, the atelier works in small collections. Each garment is cut
          for a Nigerian climate and an international standard of finish. We ship nationwide, and we
          verify every payment by hand — because presence includes how we take care of you after you
          order.
        </p>
      </div>
    </StoreShell>
  );
}
