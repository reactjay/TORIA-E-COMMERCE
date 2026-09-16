import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { deleteCategory, listAdminCategories, saveCategory } from "@/lib/server/admin";

export const Route = createFileRoute("/admin/categories")({
  component: () => (
    <AdminGuard>
      <CategoriesPage />
    </AdminGuard>
  ),
});

function CategoriesPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminCategories>>>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function reload() {
    setRows(await listAdminCategories());
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <AdminShell title="Categories" subtitle="Organize the collection.">
      <form
        className="mb-6 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void saveCategory({
            data: {
              name,
              slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            },
          })
            .then(() => {
              toast.success("Category created.");
              setName("");
              setSlug("");
              return reload();
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save."));
        }}
      >
        <input className="field max-w-xs" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="field max-w-xs" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <button type="submit" className="btn-primary">
          Add category
        </button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-line bg-ivory">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Products</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-5 py-3">{c.name}</td>
                <td className="px-5 py-3 text-muted">{c.slug}</td>
                <td className="px-5 py-3">{c.productCount}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    className="text-danger underline"
                    onClick={() => {
                      if (!confirm(`Delete ${c.name}?`)) return;
                      void deleteCategory({ data: { id: c.id } })
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
    </AdminShell>
  );
}
