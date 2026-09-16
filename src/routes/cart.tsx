import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreShell } from "@/components/store/store-shell";
import { QtyControl } from "@/components/store/qty";
import { formatNaira } from "@/lib/format";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";
import { getStoreSettings, listCategories, listProducts } from "@/lib/server/catalog";

export const Route = createFileRoute("/cart")({
  loader: async () => {
    const [categories, products, settings] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      getStoreSettings(),
    ]);
    return { categories, products, settings };
  },
  component: CartPage,
});

function CartPage() {
  const { categories, products, settings } = Route.useLoaderData();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = cartSubtotal(items);
  const delivery = items.length ? settings.deliveryFee : 0;
  const total = subtotal + delivery;

  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-[22px] border border-line bg-ivory p-5 sm:p-8">
          <h1 className="font-display text-4xl text-espresso">Your Cart</h1>
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted">Your bag is empty.</p>
              <Link to="/shop" search={{ arrivals: undefined }} className="btn-primary mt-6">
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              <ul className="mt-8 divide-y divide-line">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4 py-6">
                    <img src={item.imageUrl} alt="" className="size-24 object-cover sm:size-28" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="font-medium">{formatNaira(item.price)}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        Size: {item.size}
                        <br />
                        Colour: {item.color}
                        <br />
                        Quantity: {item.quantity}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <QtyControl value={item.quantity} onChange={(n) => setQuantity(item.key, n)} />
                        <button
                          type="button"
                          className="text-sm text-warn hover:underline"
                          onClick={() => removeItem(item.key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-line pt-6">
                <p className="label-caps mb-4">Order summary</p>
                <div className="flex justify-between py-1 text-sm">
                  <span>Subtotal:</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span>Delivery:</span>
                  <span>{formatNaira(delivery)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
                  <span>Total:</span>
                  <span>{formatNaira(total)}</span>
                </div>
                <Link to="/checkout" className="btn-primary mt-6 w-full">
                  Proceed to Checkout
                </Link>
                <Link to="/shop" search={{ arrivals: undefined }} className="mt-4 block text-center text-sm text-warn hover:underline">
                  Continue Shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
