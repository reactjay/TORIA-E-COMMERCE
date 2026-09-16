import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { StoreShell } from "@/components/store/store-shell";
import { formatNaira } from "@/lib/format";
import { getStoreSettings, listCategories, listProducts } from "@/lib/server/catalog";
import { acknowledgePayment, getPublicOrder } from "@/lib/server/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/payment/$orderNumber")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ params, deps }) => {
    const token =
      deps.token ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem(`elite-order-${params.orderNumber}`) ?? ""
        : "");
    const [categories, products, settings, order] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      getStoreSettings(),
      token
        ? getPublicOrder({ data: { orderNumber: params.orderNumber, token } })
        : Promise.resolve(null),
    ]);
    return { categories, products, settings, order, token };
  },
  component: PaymentPage,
});

const STEPS = ["Cart", "Checkout", "Payment", "Confirmation"];

function PaymentPage() {
  const { categories, products, settings, order, token } = Route.useLoaderData();
  const { orderNumber } = Route.useParams();
  const navigate = useNavigate();

  async function madePayment() {
    if (token) {
      await acknowledgePayment({ data: { orderNumber, token } }).catch(() => undefined);
    }
    await navigate({
      to: "/order/$orderNumber",
      params: { orderNumber },
      search: { token },
    });
  }

  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-[22px] border border-line bg-ivory p-6 sm:p-10">
          <p className="font-display text-2xl italic text-espresso">Elite</p>
          <ol className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={cn(i === 2 && "font-semibold text-espresso")}>{s}</span>
                {i === 2 ? <span className="block h-0.5 w-8 bg-espresso" /> : null}
                {i < STEPS.length - 1 ? <span>→</span> : null}
              </li>
            ))}
          </ol>
          <h1 className="mt-8 font-display text-4xl text-espresso">Complete Your Payment</h1>

          {!order ? (
            <p className="mt-6 text-sm text-muted">
              We couldn’t find this order. Check the link from your confirmation, or look it up from{" "}
              <Link to="/account" className="underline">
                order lookup
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">
                Order <span className="font-semibold text-espresso">#{order.orderNumber}</span>
              </p>
              <div className="mt-6 rounded-2xl border border-line bg-cream/60 p-5 text-sm">
                <p className="label-caps mb-4">Bank transfer</p>
                <Row label="Bank Name:" value={settings.bankName} />
                <Row label="Account Name:" value={settings.accountName} />
                <Row label="Account Number:" value={settings.accountNumber} />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-beige/40 px-5 py-4">
                <span className="label-caps">Order total:</span>
                <span className="font-display text-2xl">{formatNaira(order.total)}</span>
              </div>
              <div className="mt-4 flex gap-3 rounded-2xl border border-line p-4 text-sm text-muted">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-beige/70 text-espresso">
                  <Info className="size-4" />
                </span>
                Please transfer the exact order amount using the payment details above. Your order will
                remain pending until your payment is verified.
              </div>
              <button type="button" className="btn-primary mt-8 w-full" onClick={() => void madePayment()}>
                I’ve Made Payment
              </button>
            </>
          )}
        </div>
      </div>
    </StoreShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
