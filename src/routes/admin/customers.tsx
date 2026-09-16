import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDate, formatNaira } from "@/lib/format";
import { listAdminCustomers } from "@/lib/server/admin";

export const Route = createFileRoute("/admin/customers")({
  component: () => (
    <AdminGuard>
      <CustomersPage />
    </AdminGuard>
  ),
});

function CustomersPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminCustomers>>>([]);
  useEffect(() => {
    void listAdminCustomers().then(setRows);
  }, []);

  return (
    <AdminShell title="Customers" subtitle="People who have placed orders.">
      <div className="overflow-hidden rounded-2xl border border-line bg-ivory">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-muted">
              <tr>
                {["Name", "Email", "Phone", "City", "Orders", "Spent", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    No customers yet.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-5 py-3">{c.name}</td>
                    <td className="px-5 py-3">{c.email}</td>
                    <td className="px-5 py-3">{c.phone}</td>
                    <td className="px-5 py-3">
                      {c.city}, {c.state}
                    </td>
                    <td className="px-5 py-3">{c.orderCount}</td>
                    <td className="px-5 py-3">{formatNaira(c.spent)}</td>
                    <td className="px-5 py-3">{formatDate(c.createdAt)}</td>
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
