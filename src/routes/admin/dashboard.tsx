import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Cog, ShoppingBag } from "lucide-react";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatNaira } from "@/lib/format";
import { getDashboardStats } from "@/lib/server/admin";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (
    <AdminGuard>
      <Dashboard />
    </AdminGuard>
  ),
});

function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);

  useEffect(() => {
    void getDashboardStats().then(setData);
  }, []);

  if (!data) {
    return (
      <AdminShell title="Dashboard">
        <p className="text-sm text-muted">Loading…</p>
      </AdminShell>
    );
  }

  const cards = [
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingBag },
    { label: "Pending Verification", value: data.pendingVerification, icon: Clock },
    { label: "Processing", value: data.processing, icon: Cog },
    { label: "Completed", value: data.completed, icon: CheckCircle2 },
  ];

  return (
    <AdminShell title="Dashboard" subtitle="Welcome back. Here’s what’s happening with your store.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-line bg-ivory p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-beige/50 text-espresso">
              <c.icon className="size-5" />
            </span>
            <div>
              <p className="label-caps">{c.label}</p>
              <p className="font-display text-3xl">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-ivory">
        <div className="px-5 py-4">
          <h2 className="font-medium">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
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
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-5 py-3 font-medium">#{o.orderNumber}</td>
                    <td className="px-5 py-3">{o.customerName}</td>
                    <td className="px-5 py-3">{o.itemCount} items</td>
                    <td className="px-5 py-3">{formatNaira(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Link
                        to="/admin/orders/$orderId"
                        params={{ orderId: o.id }}
                        className="underline underline-offset-4"
                      >
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

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-ivory">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-medium">Products</h2>
          <Link to="/admin/products/new" className="btn-primary h-9 px-4">
            +
          </Link>
        </div>
        <ul>
          {data.products.map((p) => (
            <li key={p.id} className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span>{p.name}</span>
              <span className="flex items-center gap-4">
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-success">
                  {p.isActive ? "Active" : "Hidden"}
                </span>
                <Link to="/admin/products/$productId" params={{ productId: p.id }} className="underline">
                  Edit
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
