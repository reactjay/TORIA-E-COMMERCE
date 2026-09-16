import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreShell } from "@/components/store/store-shell";
import { ProductCard } from "@/components/store/product-card";
import { getStoreSettings, listCategories, listProducts } from "@/lib/server/catalog";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [categories, products, settings] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      getStoreSettings(),
    ]);
    return { categories, products, settings };
  },
  component: HomePage,
});

function HomePage() {
  const { categories, products, settings } = Route.useLoaderData();
  const arrivals = products.filter((p) => p.isNew).slice(0, 4);
  const featuredCats = ["dresses", "tops", "trousers", "accessories"]
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean);

  return (
    <StoreShell categories={categories} products={products}>
      <section className="relative">
        <img
          src="/images/hero.jpg"
          alt="Elite campaign — tailored camel blazer"
          className="h-[min(78vh,820px)] min-h-[460px] w-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5f0e8]/80 via-[#f5f0e8]/25 to-transparent" />
        <div className="absolute inset-0 mx-auto flex max-w-[1400px] items-center px-6 sm:px-10">
          <div className="max-w-[34rem]">
            <h1 className="font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.95] text-espresso">
              WEAR YOUR
              <br />
              PRESENCE
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-espresso/80">
              Contemporary pieces designed for effortless everyday style.
            </p>
            <Link to="/shop" search={{ arrivals: "1" }} className="btn-primary mt-8">
              Shop New Arrivals
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
        <h2 className="mb-8 text-center font-display text-2xl tracking-[0.18em] text-espresso sm:text-3xl">
          SHOP BY CATEGORY
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {featuredCats.map((c) =>
            c ? (
              <Link
                key={c.id}
                to="/shop/$category"
                params={{ category: c.slug }}
                className="group relative block overflow-hidden bg-paper"
              >
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-r from-charcoal/35 to-transparent" />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-2xl text-cream sm:text-3xl">
                  {c.name}
                </span>
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-8 sm:px-10">
        <h2 className="mb-8 text-center font-display text-2xl tracking-[0.18em] text-espresso sm:text-3xl">
          NEW ARRIVALS
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {arrivals.map((p) => (
            <ProductCard key={p.id} product={p} variant="simple" />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
        <div className="glass-strong rounded-[22px] px-6 py-10 text-center sm:px-16">
          <p className="label-caps">The atelier</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Presence, made wearable.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            From {settings.storeAddress}, Elite designs quiet luxury for the contemporary wardrobe —
            linen, satin, and tailoring in a palette of cream, espresso and charcoal.
          </p>
          <Link to="/about" className="btn-secondary mt-6">
            Our story
          </Link>
        </div>
      </section>
    </StoreShell>
  );
}
