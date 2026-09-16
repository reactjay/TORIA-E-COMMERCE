import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { StoreShell } from "@/components/store/store-shell";
import { formatNaira } from "@/lib/format";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";
import { getStoreSettings, listCategories, listProducts } from "@/lib/server/catalog";
import { createCheckoutOrder } from "@/lib/server/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const [categories, products, settings] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      getStoreSettings(),
    ]);
    return { categories, products, settings };
  },
  component: CheckoutPage,
});

const STEPS = ["Cart", "Checkout", "Payment", "Confirmation"];

function CheckoutPage() {
  const { categories, products, settings } = Route.useLoaderData();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = cartSubtotal(items);
  const delivery = items.length ? settings.deliveryFee : 0;
  const total = subtotal + delivery;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (form.phone.trim().length < 7) next.phone = "Enter a phone number.";
    if (form.address.trim().length < 4) next.address = "Enter a delivery address.";
    if (form.city.trim().length < 2) next.city = "Enter your city.";
    if (form.state.trim().length < 2) next.state = "Enter your state.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!validate()) return;
    setBusy(true);
    try {
      const result = await createCheckoutOrder({
        data: {
          ...form,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
        },
      });
      window.localStorage.setItem(
        `elite-order-${result.orderNumber}`,
        result.accessToken,
      );
      clear();
      await navigate({
        to: "/payment/$orderNumber",
        params: { orderNumber: result.orderNumber },
        search: { token: result.accessToken },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-[22px] border border-line bg-ivory p-5 sm:p-8">
          <h1 className="font-display text-4xl text-espresso">Checkout</h1>
          <ol className="mt-6 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={cn(i === 1 && "font-semibold text-espresso")}>{s}</span>
                {i === 1 ? <span className="block h-0.5 w-8 bg-espresso" /> : null}
                {i < STEPS.length - 1 ? <span>→</span> : null}
              </li>
            ))}
          </ol>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted">Nothing to check out.</p>
              <Link to="/shop" search={{ arrivals: undefined }} className="btn-primary mt-6">
                Shop the collection
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-8">
              <section>
                <p className="label-caps mb-3">Contact information</p>
                <div className="space-y-3">
                  <Field label="Email Address" value={form.email} onChange={(v) => set("email", v)} error={errors.email} type="email" />
                  <Field label="Full Name" value={form.name} onChange={(v) => set("name", v)} error={errors.name} />
                  <Field label="Phone Number" value={form.phone} onChange={(v) => set("phone", v)} error={errors.phone} />
                </div>
              </section>
              <section>
                <p className="label-caps mb-3">Delivery information</p>
                <div className="space-y-3">
                  <Field label="Delivery Address" value={form.address} onChange={(v) => set("address", v)} error={errors.address} />
                  <Field label="City" value={form.city} onChange={(v) => set("city", v)} error={errors.city} />
                  <Field label="State" value={form.state} onChange={(v) => set("state", v)} error={errors.state} />
                </div>
              </section>
              <section className="rounded-2xl border border-line p-5">
                <p className="label-caps mb-4">Order summary</p>
                {items.map((i) => (
                  <div key={i.key} className="flex justify-between py-1 text-sm">
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <span>{formatNaira(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 text-sm">
                  <span>Delivery</span>
                  <span>{formatNaira(delivery)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>
              </section>
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? "Placing order…" : "Continue to Payment"}
              </button>
            </form>
          )}
        </div>
      </div>
    </StoreShell>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        className={cn("field", error && "border-danger")}
        placeholder={label}
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
