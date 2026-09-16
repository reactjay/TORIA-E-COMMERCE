import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/store/store-shell";
import { formatNaira } from "@/lib/format";
import { listCategories, listProducts, getProductBySlug } from "@/lib/server/catalog";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const [product, categories, products] = await Promise.all([
      getProductBySlug({ data: { slug: params.slug } }),
      listCategories(),
      listProducts({ data: {} }),
    ]);
    if (!product) throw notFound();
    return { product, categories, products };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, categories, products } = Route.useLoaderData();
  const [image, setImage] = useState(product.images[0] ?? product.imageUrl);
  const [size, setSize] = useState(product.sizes.includes("M") ? "M" : (product.sizes[0] ?? ""));
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState<string | null>("details");
  const addItem = useCartStore((s) => s.addItem);
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const out = product.stock <= 0;
  const related = products.filter((p) => p.id !== product.id).slice(0, 3);

  function add() {
    if (out) return;
    if (!size) {
      toast.error("Please select a size.");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size,
      color: color?.name ?? "Cream",
      colorHex: color?.hex ?? "#F5F0E8",
      quantity: qty,
    });
    toast.success("Added to cart");
  }

  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-8 lg:grid-cols-2 lg:px-10">
        <div>
          <div className="relative overflow-hidden bg-paper">
            <img src={image} alt={product.name} className="aspect-square w-full object-cover object-center sm:aspect-[4/5]" />
          </div>
          {product.images.length > 1 ? (
            <div className="mt-3 flex gap-3">
              {product.images.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImage(src)}
                  className={cn(
                    "overflow-hidden border bg-paper",
                    image === src ? "border-espresso" : "border-transparent",
                  )}
                >
                  <img src={src} alt="" className="size-20 object-cover sm:size-24" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:pt-4">
          <h1 className="font-display text-4xl text-espresso sm:text-5xl">{product.name}</h1>
          <p className="mt-3 font-display text-2xl">{formatNaira(product.price)}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 border-t border-line pt-6">
            <div className="flex items-center gap-3">
              <span className="label-caps w-20">Colour</span>
              <span className="text-sm">{color?.name}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-8 border",
                    color?.name === c.name ? "border-espresso" : "border-line",
                  )}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <div className="flex items-center gap-3">
              <span className="label-caps w-20">Size</span>
              <span className="text-sm">{size || "Select Size"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-12 px-3 py-2 text-sm",
                    size === s ? "bg-espresso text-cream" : "border border-line",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <p className="label-caps">Quantity</p>
            <div className="mt-3 inline-flex items-center border border-line">
              <button type="button" className="grid size-10 place-items-center" onClick={() => setQty(Math.max(1, qty - 1))}>
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-8 text-center text-sm">{qty}</span>
              <button
                type="button"
                className="grid size-10 place-items-center"
                onClick={() => setQty(Math.min(Math.max(1, product.stock), qty + 1))}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          <button type="button" className="btn-primary mt-8 w-full" disabled={out} onClick={add}>
            {out ? "Out of Stock" : "Add to Cart"}
          </button>
          <button
            type="button"
            className="btn-secondary mt-3 w-full"
            onClick={() => toggleWish(product.id)}
          >
            <Heart className={cn("size-4", wished && "fill-espresso")} />
            {wished ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>

          <div className="mt-8 divide-y divide-line border-y border-line">
            {[
              ["details", "Product Details", product.details || product.description],
              [
                "size",
                "Size Guide",
                "Designed for a considered fit. If you are between sizes, we suggest taking the larger size for shirts and the smaller size for tailored trousers. XS 6–8 · S 8–10 · M 10–12 · L 12–14 · XL 14–16.",
              ],
              [
                "ship",
                "Shipping & Returns",
                "Complimentary delivery across Nigeria on orders over ₦80,000. Standard delivery 3–6 working days. Unworn pieces with tags may be returned within 14 days.",
              ],
            ].map(([key, label, body]) => (
              <div key={key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"
                  onClick={() => setOpen(open === key ? null : key)}
                >
                  {label}
                  <span className="text-lg leading-none">{open === key ? "–" : "+"}</span>
                </button>
                {open === key ? <p className="pb-4 text-sm leading-relaxed text-muted">{body}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1400px] px-4 pb-16 lg:px-10">
        <h2 className="mb-6 font-display text-2xl">You may also like</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((p) => (
            <Link
              key={p.id}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="flex overflow-hidden border border-line bg-ivory"
            >
              <img src={p.imageUrl} alt="" className="h-36 w-32 object-cover sm:h-40 sm:w-40" />
              <div className="flex flex-1 flex-col justify-center px-4">
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-sm">{formatNaira(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
