import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { listCategories } from "@/lib/server/catalog";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/admin/products/new")({
  component: () => (
    <AdminGuard>
      <NewProduct />
    </AdminGuard>
  ),
});

function NewProduct() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    void listCategories().then(setCategories);
  }, []);
  return (
    <AdminShell title="New product">
      {categories.length ? <ProductForm categories={categories} /> : <p className="text-sm text-muted">Loading…</p>}
    </AdminShell>
  );
}
