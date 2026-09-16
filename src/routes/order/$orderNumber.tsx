import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { CheckCircle2, CloudUpload, Info, X } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/store/store-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira } from "@/lib/format";
import { listCategories, listProducts } from "@/lib/server/catalog";
import { getPublicOrder, uploadReceipt } from "@/lib/server/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$orderNumber")({
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
    const [categories, products, order] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      token
        ? getPublicOrder({ data: { orderNumber: params.orderNumber, token } })
        : Promise.resolve(null),
    ]);
    return { categories, products, order, token };
  },
  component: OrderPage,
});

const STEPS = ["Cart", "Checkout", "Payment", "Confirmation"];

function OrderPage() {
  const { categories, products, order, token } = Route.useLoaderData();
  const { orderNumber } = Route.useParams();
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; size: string; dataUrl: string; mime: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const submitted = Boolean(order?.payment?.hasReceipt) || order?.status === "under_verification";

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Maximum file size is 5MB.");
      return;
    }
    const ok = ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(f.type);
    if (!ok) {
      toast.error("Please upload a JPG, PNG or PDF.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
    setFile({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      dataUrl,
      mime: f.type,
    });
  }

  async function submit() {
    if (!file || !token) return;
    setBusy(true);
    try {
      await uploadReceipt({
        data: {
          orderNumber,
          token,
          filename: file.name,
          mime: file.mime,
          dataUrl: file.dataUrl,
        },
      });
      toast.success("Receipt submitted");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
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
          <h1 className="mt-8 font-display text-4xl text-espresso">Upload Payment Receipt</h1>

          {!order ? (
            <p className="mt-6 text-sm text-muted">
              We couldn’t find this order.{" "}
              <Link to="/account" className="underline">
                Look it up
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  Order Number: <strong>#{order.orderNumber}</strong>
                </span>
                <span>
                  Amount: <strong>{formatNaira(order.total)}</strong>
                </span>
              </div>

              {submitted ? (
                <div className="mt-8 space-y-4">
                  <div className="flex gap-3 rounded-2xl border border-line p-4 text-sm">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-beige/70">
                      <Info className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">Your payment is awaiting verification.</p>
                      <p className="mt-1 text-muted">
                        Once your receipt is reviewed and verified, your order status will be updated.
                      </p>
                    </div>
                  </div>
                  <p className="label-caps pt-2">After submission</p>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-cream/70 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-6 text-success" />
                      <div>
                        <p className="font-medium">Receipt Submitted</p>
                        <p className="mt-1 text-sm text-muted">
                          Your order has been received and your payment is currently under verification.
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <Link to="/shop" search={{ arrivals: undefined }} className="btn-secondary mt-4 w-full">
                    Continue shopping
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-cream/50 px-6 py-12 text-center">
                    <CloudUpload className="size-10 text-espresso/70" />
                    <span className="font-medium">Upload your payment receipt</span>
                    <span className="text-sm text-muted">JPEG, PNG or PDF · Maximum file size: 5MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      className="sr-only"
                      onChange={(e) => void onFile(e.target.files?.[0])}
                    />
                  </label>
                  {file ? (
                    <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted">{file.size}</p>
                      </div>
                      <button type="button" aria-label="Remove file" onClick={() => setFile(null)}>
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : null}
                  <button type="button" className="btn-primary w-full" disabled={!file || busy} onClick={() => void submit()}>
                    {busy ? "Submitting…" : "Submit Receipt"}
                  </button>
                  <div className="flex gap-3 rounded-2xl border border-line p-4 text-sm text-muted">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-beige/70">
                      <Info className="size-4 text-espresso" />
                    </span>
                    Your payment is awaiting verification. Uploading a receipt does not confirm payment.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
