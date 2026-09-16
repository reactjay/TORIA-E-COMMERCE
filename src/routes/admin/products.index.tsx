import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatNaira } from "@/lib/format";
import { deleteProduct, listAdminProducts } from "@/lib/server/admin";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/admin/products/")({
  component: () => (
    <AdminGuard>
      <ProductsPage />
    </AdminGuard>
  ),
});

function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);

  async function reload() {
    setRows(await listAdminProducts());
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <AdminShell title="Products" subtitle="Manage the collection.">
      <div className="mb-5 flex justify-end">
        <Link to="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-ivory">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-muted">
              <tr>
                {["Product", "Category", "Price", "Stock", "Status", ""].map((h) => (
                  <th key={h || "a"} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="size-12 object-cover" />
                      {p.name}
                    </div>
                  </td>
                  <td className="px-5 py-3">{p.categoryName}</td>
                  <td className="px-5 py-3">{formatNaira(p.price)}</td>
                  <td className="px-5 py-3">{p.stock}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-success">
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link to="/admin/products/$productId" params={{ productId: p.id }} className="mr-3 underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="text-danger underline"
                      onClick={() => {
                        if (!confirm(`Delete ${p.name}?`)) return;
                        void deleteProduct({ data: { id: p.id } })
                          .then(() => {
                            toast.success("Deleted.");
                            return reload();
                          })
                          .catch((err) => toast.error(err instanceof Error ? err.message : "Could not delete."));
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
