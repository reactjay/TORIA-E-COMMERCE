import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  variant = "shop",
}: {
  product: Product;
  variant?: "shop" | "simple";
}) {
  const addItem = useCartStore((s) => s.addItem);
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  const color = product.colors[0];

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size: product.sizes[0] ?? "M",
      color: color?.name ?? "Cream",
      colorHex: color?.hex ?? "#F5F0E8",
    });
    setAdded(true);
    toast.success("Added to cart");
    window.setTimeout(() => setAdded(false), 1600);
  }

  if (variant === "simple") {
    return (
      <Link to="/product/$slug" params={{ slug: product.slug }} className="group block">
        <div className="overflow-hidden bg-paper">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <p className="mt-3 text-center text-sm text-espresso">
          {product.name} — {formatNaira(product.price)}
        </p>
      </Link>
    );
  }

  return (
    <article className="group flex flex-col border border-line bg-ivory transition-shadow duration-300 hover:shadow-soft">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block overflow-hidden bg-paper">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {out ? (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-espresso px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">
            Out of stock
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="label-caps">{product.categoryName}</p>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="font-display text-lg leading-snug text-espresso">
          {product.name}
        </Link>
        <p className="text-sm font-medium text-espresso">{formatNaira(product.price)}</p>
        <div className="mt-1 flex gap-1.5">
          {product.colors.map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="size-3.5 rounded-full border border-espresso/20"
              style={{ background: c.hex }}
            />
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            type="button"
            disabled={out}
            onClick={addToCart}
            className={cn(
              "btn-primary h-10 flex-1 px-3 text-[11px]",
              added && "!bg-beige !text-espresso !border-beige",
            )}
          >
            {out ? "Out of Stock" : added ? "Added" : "Add to Cart"}
          </button>
          <button
            type="button"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              toggleWish(product.id);
            }}
            className="grid size-10 place-items-center border border-line text-espresso transition-colors hover:border-beige"
          >
            <Heart className={cn("size-4", wished && "fill-espresso")} />
          </button>
        </div>
      </div>
    </article>
  );
}
