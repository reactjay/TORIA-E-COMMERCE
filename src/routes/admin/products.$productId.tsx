import { useEffect, useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { listCategories } from "@/lib/server/catalog";
import { listAdminProducts } from "@/lib/server/admin";
import type { Category, Product } from "@/lib/types";

export const Route = createFileRoute("/admin/products/$productId")({
  component: () => (
    <AdminGuard>
      <EditProduct />
    </AdminGuard>
  ),
});

function EditProduct() {
  const { productId } = useParams({ from: "/admin/products/$productId" });
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void Promise.all([listAdminProducts(), listCategories()]).then(([products, cats]) => {
      setCategories(cats);
      setProduct(products.find((p) => p.id === productId) ?? null);
    });
  }, [productId]);

  return (
    <AdminShell title={product?.name ?? "Edit product"}>
      {product && categories.length ? (
        <ProductForm product={product} categories={categories} />
      ) : (
        <p className="text-sm text-muted">Loading…</p>
      )}
    </AdminShell>
  );
}
