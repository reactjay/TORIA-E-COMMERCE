import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatNaira, ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import { listAdminOrders } from "@/lib/server/admin";

export const Route = createFileRoute("/admin/orders/")({
  component: () => (
    <AdminGuard>
      <OrdersPage />
    </AdminGuard>
  ),
});

function OrdersPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminOrders>>>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);

  async function refresh(nextStatus = status, nextQ = q) {
    const data = await listAdminOrders({ data: { status: nextStatus, search: nextQ } });
    setRows(data);
    setReady(true);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell title="Orders" subtitle="Incoming orders and payment verification.">
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="field max-w-xs"
          placeholder="Search orders"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void refresh(status, q);
          }}
        />
        <select
          className="field max-w-xs"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            void refresh(e.target.value, q);
          }}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-ivory">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-muted">
              <tr>
                {["Order", "Customer", "Items", "Total", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!ready ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    No orders match.
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-5 py-3 font-medium">#{o.orderNumber}</td>
                    <td className="px-5 py-3">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-muted">{o.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3">{o.itemCount} items</td>
                    <td className="px-5 py-3">{formatNaira(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Link to="/admin/orders/$orderId" params={{ orderId: o.id }} className="underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
