import { asBool, asNumber, parseJson } from "@/lib/utils";
import type { Category, Customer, OrderItem, Payment, Product, ProductColor } from "@/lib/types";

export type ProductRow = Record<string, unknown>;

export function mapCategory(row: ProductRow): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    imageUrl: String(row.image_url ?? ""),
    sortOrder: asNumber(row.sort_order),
  };
}

export function mapProduct(row: ProductRow): Product {
  const images = parseJson<string[]>(row.images_json, []);
  const sizes = parseJson<string[]>(row.sizes_json, []);
  const colors = parseJson<ProductColor[]>(row.colors_json, []);
  const imageUrl = String(row.image_url ?? images[0] ?? "");
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    price: asNumber(row.price),
    categoryId: String(row.category_id),
    categoryName: String(row.category_name ?? ""),
    categorySlug: String(row.category_slug ?? ""),
    imageUrl,
    images: images.length ? images : imageUrl ? [imageUrl] : [],
    stock: asNumber(row.stock),
    sizes,
    colors,
    details: String(row.details ?? ""),
    isNew: asBool(row.is_new),
    isActive: asBool(row.is_active),
    createdAt: String(row.created_at ?? ""),
  };
}

export function mapCustomer(row: ProductRow): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    address: String(row.address),
    city: String(row.city),
    state: String(row.state),
    createdAt: String(row.created_at ?? ""),
  };
}

export function mapOrderItem(row: ProductRow): OrderItem {
  return {
    id: String(row.id),
    productId: row.product_id ? String(row.product_id) : null,
    productName: String(row.product_name),
    productImage: String(row.product_image ?? ""),
    quantity: asNumber(row.quantity),
    price: asNumber(row.price),
    selectedSize: String(row.selected_size ?? ""),
    selectedColor: String(row.selected_color ?? ""),
  };
}

export function mapPayment(row: ProductRow): Payment {
  return {
    id: String(row.id),
    amount: asNumber(row.amount),
    status: String(row.status),
    receiptName: row.receipt_name ? String(row.receipt_name) : null,
    receiptMime: row.receipt_mime ? String(row.receipt_mime) : null,
    hasReceipt: Boolean(row.receipt_data),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    verifiedAt: row.verified_at ? String(row.verified_at) : null,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
  };
}
