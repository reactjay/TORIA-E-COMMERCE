import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { asNumber } from "@/lib/utils";
import { isOrderStatus } from "@/lib/format";
import { mapCategory, mapCustomer, mapOrderItem, mapPayment, mapProduct } from "@/lib/server/mappers";
import type { Order } from "@/lib/types";

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(`select user_id from admins where user_id = $1`, [userId]);
  if (!rows[0]) throw new ForbiddenError();
  return sql;
}

async function loadAdminOrder(orderId: string): Promise<Order> {
  const sql = await getSql();
  const orders = await sql.query(
    `select o.*, c.id as cid, c.name as cname, c.email as cemail, c.phone as cphone,
            c.address as caddress, c.city as ccity, c.state as cstate, c.created_at as ccreated
     from orders o join customers c on c.id = o.customer_id where o.id = $1`,
    [orderId],
  );
  const o = orders[0];
  if (!o) throw new Error("Order not found");
  const items = await sql.query(`select * from order_items where order_id = $1`, [orderId]);
  const pays = await sql.query(`select * from payments where order_id = $1`, [orderId]);
  return {
    id: String(o.id),
    orderNumber: String(o.order_number),
    status: String(o.status),
    subtotal: asNumber(o.subtotal),
    deliveryFee: asNumber(o.delivery_fee),
    total: asNumber(o.total),
    createdAt: String(o.created_at),
    updatedAt: String(o.updated_at),
    customer: mapCustomer({
      id: o.cid,
      name: o.cname,
      email: o.cemail,
      phone: o.cphone,
      address: o.caddress,
      city: o.ccity,
      state: o.cstate,
      created_at: o.ccreated,
    }),
    items: items.map(mapOrderItem),
    payment: pays[0] ? mapPayment(pays[0]) : null,
  };
}

export const adminHasAny = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<{ n: number }>(`select count(*)::int as n from admins`);
  return { hasAdmin: asNumber(rows[0]?.n) > 0 };
});

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const mine = await sql.query(`select user_id from admins where user_id = $1`, [context.userId]);
    if (mine[0]) return { ok: true as const, role: "admin" as const };
    const any = await sql.query(`select user_id from admins limit 1`);
    if (any[0]) return { ok: false as const, role: "none" as const };
    const users = await sql.query(`select email from "user" where id = $1`, [context.userId]);
    const email = String(users[0]?.email ?? "");
    await sql.query(`insert into admins (user_id, email) values ($1, $2)`, [context.userId, email]);
    return { ok: true as const, role: "admin" as const, bootstrapped: true };
  });

export const getAdminMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query(`select user_id, email from admins where user_id = $1`, [
      context.userId,
    ]);
    if (!rows[0]) return { isAdmin: false as const };
    const users = await sql.query(`select name, email from "user" where id = $1`, [context.userId]);
    return {
      isAdmin: true as const,
      email: String(rows[0].email || users[0]?.email || ""),
      name: String(users[0]?.name ?? "Admin"),
    };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdmin(context.userId);
    const total = await sql.query<{ n: number }>(`select count(*)::int as n from orders`);
    const pending = await sql.query<{ n: number }>(
      `select count(*)::int as n from orders where status in ('pending','payment_submitted','under_verification')`,
    );
    const processing = await sql.query<{ n: number }>(
      `select count(*)::int as n from orders where status in ('confirmed','processing')`,
    );
    const completed = await sql.query<{ n: number }>(
      `select count(*)::int as n from orders where status = 'completed'`,
    );
    const recent = await sql.query(
      `select o.id, o.order_number, o.total, o.status, o.created_at, c.name as customer_name,
              (select count(*)::int from order_items oi where oi.order_id = o.id) as item_count
         from orders o join customers c on c.id = o.customer_id
        order by o.created_at desc limit 8`,
    );
    const products = await sql.query(
      `select p.id, p.name, p.is_active, p.stock, c.name as category_name
         from products p join categories c on c.id = p.category_id
        order by p.created_at desc limit 8`,
    );
    return {
      totalOrders: asNumber(total[0]?.n),
      pendingVerification: asNumber(pending[0]?.n),
      processing: asNumber(processing[0]?.n),
      completed: asNumber(completed[0]?.n),
      recentOrders: recent.map((r) => ({
        id: String(r.id),
        orderNumber: String(r.order_number),
        customerName: String(r.customer_name),
        itemCount: asNumber(r.item_count),
        total: asNumber(r.total),
        status: String(r.status),
        createdAt: String(r.created_at),
      })),
      products: products.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        categoryName: String(r.category_name),
        isActive: r.is_active === true || r.is_active === "t" || r.is_active === "true",
        stock: asNumber(r.stock),
      })),
    };
  });

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.string().optional(), search: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    let q = `select o.id, o.order_number, o.total, o.status, o.created_at, c.name as customer_name, c.email as customer_email,
                    (select count(*)::int from order_items oi where oi.order_id = o.id) as item_count
               from orders o join customers c on c.id = o.customer_id where 1=1`;
    const params: unknown[] = [];
    let i = 1;
    if (data.status && data.status !== "all") {
      q += ` and o.status = $${i++}`;
      params.push(data.status);
    }
    if (data.search?.trim()) {
      q += ` and (o.order_number ilike $${i} or c.name ilike $${i} or c.email ilike $${i})`;
      params.push(`%${data.search.trim()}%`);
      i += 1;
    }
    q += ` order by o.created_at desc`;
    const rows = await sql.query(q, params);
    return rows.map((r) => ({
      id: String(r.id),
      orderNumber: String(r.order_number),
      customerName: String(r.customer_name),
      customerEmail: String(r.customer_email),
      itemCount: asNumber(r.item_count),
      total: asNumber(r.total),
      status: String(r.status),
      createdAt: String(r.created_at),
    }));
  });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return loadAdminOrder(data.id);
  });

export const getReceipt = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query(
      `select receipt_data, receipt_name, receipt_mime from payments where order_id = $1`,
      [data.orderId],
    );
    const r = rows[0];
    if (!r?.receipt_data) return null;
    return {
      dataUrl: String(r.receipt_data),
      name: String(r.receipt_name ?? "receipt"),
      mime: String(r.receipt_mime ?? "application/octet-stream"),
    };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: z.string(), approve: z.boolean(), reason: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    if (data.approve) {
      await sql.query(
        `update payments set status = 'verified', verified_at = now(), verified_by = $1, rejection_reason = null where order_id = $2`,
        [context.userId, data.orderId],
      );
      await sql.query(
        `update orders set status = 'confirmed', updated_at = now() where id = $1`,
        [data.orderId],
      );
    } else {
      await sql.query(
        `update payments set status = 'rejected', verified_at = now(), verified_by = $1, rejection_reason = $2 where order_id = $3`,
        [context.userId, data.reason ?? "Receipt could not be verified.", data.orderId],
      );
      await sql.query(
        `update orders set status = 'cancelled', updated_at = now() where id = $1`,
        [data.orderId],
      );
    }
    return { ok: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: z.string(), status: z.string() }))
  .handler(async ({ context, data }) => {
    if (!isOrderStatus(data.status)) throw new Error("Invalid status");
    const sql = await requireAdmin(context.userId);
    await sql.query(`update orders set status = $1, updated_at = now() where id = $2`, [
      data.status,
      data.orderId,
    ]);
    return { ok: true };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query(
      `select p.*, c.name as category_name, c.slug as category_slug
         from products p join categories c on c.id = p.category_id
        order by p.created_at desc`,
    );
    return rows.map(mapProduct);
  });

const productInput = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(4),
  price: z.number().int().min(0),
  categoryId: z.string().min(1),
  imageUrl: z.string().min(1),
  images: z.array(z.string()),
  stock: z.number().int().min(0),
  sizes: z.array(z.string()),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
  details: z.string().optional(),
  isNew: z.boolean(),
  isActive: z.boolean(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(productInput)
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const id = data.id || crypto.randomUUID();
    const slug = data.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    const imagesJson = JSON.stringify(data.images.length ? data.images : [data.imageUrl]);
    const sizesJson = JSON.stringify(data.sizes.length ? data.sizes : ["One Size"]);
    const colorsJson = JSON.stringify(data.colors.length ? data.colors : [{ name: "Cream", hex: "#F5F0E8" }]);
    if (data.id) {
      await sql.query(
        `update products set name=$1, slug=$2, description=$3, price=$4, category_id=$5, image_url=$6,
                images_json=$7, stock=$8, sizes_json=$9, colors_json=$10, details=$11, is_new=$12, is_active=$13, updated_at=now()
          where id=$14`,
        [
          data.name.trim(),
          slug,
          data.description.trim(),
          data.price,
          data.categoryId,
          data.imageUrl,
          imagesJson,
          data.stock,
          sizesJson,
          colorsJson,
          data.details ?? "",
          data.isNew,
          data.isActive,
          id,
        ],
      );
    } else {
      await sql.query(
        `insert into products (id, name, slug, description, price, category_id, image_url, images_json, stock, sizes_json, colors_json, details, is_new, is_active)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          id,
          data.name.trim(),
          slug,
          data.description.trim(),
          data.price,
          data.categoryId,
          data.imageUrl,
          imagesJson,
          data.stock,
          sizesJson,
          colorsJson,
          data.details ?? "",
          data.isNew,
          data.isActive,
        ],
      );
    }
    return { id, slug };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    await sql.query(`delete from products where id = $1`, [data.id]);
    return { ok: true };
  });

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query(
      `select c.*, (select count(*)::int from products p where p.category_id = c.id) as product_count
         from categories c order by sort_order asc, name asc`,
    );
    return rows.map((r) => ({
      ...mapCategory(r),
      productCount: asNumber(r.product_count),
    }));
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().optional(),
      name: z.string().min(2),
      slug: z.string().min(2),
      imageUrl: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const slug = data.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    if (data.id) {
      await sql.query(`update categories set name=$1, slug=$2, image_url=coalesce(nullif($3,''), image_url) where id=$4`, [
        data.name.trim(),
        slug,
        data.imageUrl ?? "",
        data.id,
      ]);
      return { id: data.id };
    }
    const id = crypto.randomUUID();
    const max = await sql.query<{ n: number }>(`select coalesce(max(sort_order),0)::int as n from categories`);
    await sql.query(
      `insert into categories (id, name, slug, image_url, sort_order) values ($1,$2,$3,$4,$5)`,
      [id, data.name.trim(), slug, data.imageUrl ?? "", asNumber(max[0]?.n) + 1],
    );
    return { id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const used = await sql.query<{ n: number }>(
      `select count(*)::int as n from products where category_id = $1`,
      [data.id],
    );
    if (asNumber(used[0]?.n) > 0) {
      throw new Error("Move or delete products in this category first.");
    }
    await sql.query(`delete from categories where id = $1`, [data.id]);
    return { ok: true };
  });

export const listAdminCustomers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query(
      `select c.*, (select count(*)::int from orders o where o.customer_id = c.id) as order_count,
              (select coalesce(sum(total),0)::int from orders o where o.customer_id = c.id) as spent
         from customers c order by c.created_at desc`,
    );
    return rows.map((r) => ({
      ...mapCustomer(r),
      orderCount: asNumber(r.order_count),
      spent: asNumber(r.spent),
    }));
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      bankName: z.string().min(2),
      accountName: z.string().min(2),
      accountNumber: z.string().min(4),
      deliveryFee: z.number().int().min(0),
      storeEmail: z.string().min(3),
      storePhone: z.string().min(6),
      storeAddress: z.string().min(3),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const entries: [string, string][] = [
      ["bank_name", data.bankName],
      ["account_name", data.accountName],
      ["account_number", data.accountNumber],
      ["delivery_fee", String(data.deliveryFee)],
      ["store_email", data.storeEmail],
      ["store_phone", data.storePhone],
      ["store_address", data.storeAddress],
    ];
    for (const [key, value] of entries) {
      await sql.query(
        `insert into store_settings (key, value) values ($1,$2) on conflict (key) do update set value = excluded.value`,
        [key, value],
      );
    }
    return { ok: true };
  });

export const listNewsletter = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query(`select email, created_at from newsletter order by created_at desc`);
    return rows.map((r) => ({ email: String(r.email), createdAt: String(r.created_at) }));
  });
