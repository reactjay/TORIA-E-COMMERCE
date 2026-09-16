import { useEffect, useState } from "react";
import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatNaira, ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import { getAdminOrder, getReceipt, updateOrderStatus, verifyPayment } from "@/lib/server/admin";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: () => (
    <AdminGuard>
      <OrderDetail />
    </AdminGuard>
  ),
});

function OrderDetail() {
  const { orderId } = useParams({ from: "/admin/orders/$orderId" });
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<{ dataUrl: string; name: string; mime: string } | null | "loading">(
    null,
  );

  async function reload() {
    const data = await getAdminOrder({ data: { id: orderId } });
    setOrder(data);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!order) {
    return (
      <AdminShell title="Order">
        <p className="text-sm text-muted">Loading…</p>
      </AdminShell>
    );
  }

  const current = order;

  async function loadReceipt() {
    setReceipt("loading");
    const data = await getReceipt({ data: { orderId: current.id } });
    setReceipt(data);
  }

  async function verify(approve: boolean) {
    try {
      await verifyPayment({
        data: {
          orderId: current.id,
          approve,
          reason: approve ? undefined : "Receipt could not be verified.",
        },
      });
      toast.success(approve ? "Payment verified." : "Payment rejected.");
      await reload();
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update payment.");
    }
  }

  async function setStatus(status: string) {
    try {
      await updateOrderStatus({ data: { orderId: current.id, status } });
      toast.success("Status updated.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  return (
    <AdminShell title={`Order #${order.orderNumber}`} subtitle={formatDate(order.createdAt)}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-ivory p-5">
            <p className="label-caps">Customer</p>
            <p className="mt-2 font-medium">{order.customer.name}</p>
            <p className="text-sm text-muted">{order.customer.email}</p>
            <p className="text-sm text-muted">{order.customer.phone}</p>
            <p className="mt-3 text-sm">
              {order.customer.address}, {order.customer.city}, {order.customer.state}
            </p>
          </section>
          <section className="rounded-2xl border border-line bg-ivory p-5">
            <p className="label-caps mb-4">Items</p>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  {item.productImage ? (
                    <img src={item.productImage} alt="" className="size-16 object-cover" />
                  ) : null}
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted">
                      Qty {item.quantity} · {item.selectedSize} · {item.selectedColor}
                    </p>
                  </div>
                  <p className="text-sm">{formatNaira(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatNaira(order.deliveryFee)}</span>
              </div>
              <div className="mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatNaira(order.total)}</span>
              </div>
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-ivory p-5">
            <p className="label-caps">Status</p>
            <div className="mt-3">
              <StatusBadge status={order.status} />
            </div>
            <select
              className="field mt-4"
              value={order.status}
              onChange={(e) => void setStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </section>
          <section className="rounded-2xl border border-line bg-ivory p-5">
            <p className="label-caps">Payment</p>
            <p className="mt-2 text-sm">
              {order.payment?.status ?? "pending"} · {formatNaira(order.payment?.amount ?? order.total)}
            </p>
            {order.payment?.hasReceipt ? (
              <button type="button" className="btn-secondary mt-4 w-full" onClick={() => void loadReceipt()}>
                View receipt
              </button>
            ) : (
              <p className="mt-3 text-sm text-muted">No receipt uploaded yet.</p>
            )}
            {receipt && receipt !== "loading" ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-line">
                {receipt.mime.includes("pdf") ? (
                  <a href={receipt.dataUrl} target="_blank" rel="noreferrer" className="block p-4 text-sm underline">
                    Open {receipt.name}
                  </a>
                ) : (
                  <img src={receipt.dataUrl} alt={receipt.name} className="w-full" />
                )}
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn-primary" onClick={() => void verify(true)}>
                Verify
              </button>
              <button type="button" className="btn-secondary" onClick={() => void verify(false)}>
                Reject
              </button>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
