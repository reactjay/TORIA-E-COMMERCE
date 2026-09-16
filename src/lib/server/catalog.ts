import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { asNumber } from "@/lib/utils";
import { mapCategory, mapProduct } from "@/lib/server/mappers";
import type { StoreSettings } from "@/lib/types";

const PRODUCT_SELECT = `
  p.id, p.name, p.slug, p.description, p.price, p.category_id, p.image_url,
  p.images_json, p.stock, p.sizes_json, p.colors_json, p.details, p.is_new,
  p.is_active, p.created_at,
  c.name as category_name, c.slug as category_slug
`;

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql`select * from categories order by sort_order asc, name asc`;
  return rows.map(mapCategory);
});

export const getStoreSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<{ key: string; value: string }>`select key, value from store_settings`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const settings: StoreSettings = {
    bankName: map.bank_name ?? "Elite Fashion Bank",
    accountName: map.account_name ?? "Elite Fashion Store",
    accountNumber: map.account_number ?? "0123456789",
    deliveryFee: asNumber(map.delivery_fee, 5000),
    storeEmail: map.store_email ?? "atelier@elite.ng",
    storePhone: map.store_phone ?? "+234 800 353 483",
    storeAddress: map.store_address ?? "Victoria Island, Lagos",
  };
  return settings;
});

export const listProducts = createServerFn({ method: "GET" })
  .validator(
    z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      sort: z.enum(["newest", "price_asc", "price_desc", "name"]).optional(),
      inStock: z.boolean().optional(),
      featured: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    let query = `select ${PRODUCT_SELECT} from products p join categories c on c.id = p.category_id where p.is_active = true`;
    const params: unknown[] = [];
    let i = 1;
    if (data.category && data.category !== "all") {
      query += ` and c.slug = $${i++}`;
      params.push(data.category);
    }
    if (data.search?.trim()) {
      query += ` and (p.name ilike $${i} or p.description ilike $${i})`;
      params.push(`%${data.search.trim()}%`);
      i += 1;
    }
    if (data.inStock) query += ` and p.stock > 0`;
    if (data.featured) query += ` and p.is_new = true`;
    if (data.sort === "price_asc") query += ` order by p.price asc`;
    else if (data.sort === "price_desc") query += ` order by p.price desc`;
    else if (data.sort === "name") query += ` order by p.name asc`;
    else query += ` order by p.is_new desc, p.created_at desc`;
    const rows = await sql.query(query, params);
    return rows.map(mapProduct);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query(
      `select ${PRODUCT_SELECT} from products p join categories c on c.id = p.category_id where p.slug = $1 limit 1`,
      [data.slug],
    );
    return rows[0] ? mapProduct(rows[0]) : null;
  });

export const getProductById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query(
      `select ${PRODUCT_SELECT} from products p join categories c on c.id = p.category_id where p.id = $1 limit 1`,
      [data.id],
    );
    return rows[0] ? mapProduct(rows[0]) : null;
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().min(3) }))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql.query(
      `insert into newsletter (id, email) values ($1, $2) on conflict (email) do nothing`,
      [id, email],
    );
    return { ok: true };
  });
