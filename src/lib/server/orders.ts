import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { asNumber } from "@/lib/utils";
import { mapCustomer, mapOrderItem, mapPayment } from "@/lib/server/mappers";
import type { Order } from "@/lib/types";

const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.string().min(3),
  phone: z.string().min(7),
  address: z.string().min(4),
  city: z.string().min(2),
  state: z.string().min(2),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        size: z.string().min(1),
        color: z.string().min(1),
      }),
    )
    .min(1),
});

async function loadOrder(orderId: string): Promise<Order> {
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

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const address = data.address.trim();
    const city = data.city.trim();
    const state = data.state.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const sql = await getSql();
    const settings = await sql<{ key: string; value: string }>`select key, value from store_settings`;
    const map = Object.fromEntries(settings.map((r) => [r.key, r.value]));
    const deliveryFee = asNumber(map.delivery_fee, 5000);

    let subtotal = 0;
    const resolved: {
      productId: string;
      name: string;
      image: string;
      price: number;
      quantity: number;
      size: string;
      color: string;
    }[] = [];

    for (const item of data.items) {
      const rows = await sql.query(
        `select id, name, price, stock, image_url, is_active from products where id = $1`,
        [item.productId],
      );
      const p = rows[0];
      if (!p || p.is_active === false || p.is_active === "f") {
        throw new Error("One of the items is no longer available.");
      }
      const stock = asNumber(p.stock);
      if (stock < item.quantity) {
        throw new Error(`${String(p.name)} does not have enough stock.`);
      }
      const price = asNumber(p.price);
      subtotal += price * item.quantity;
      resolved.push({
        productId: String(p.id),
        name: String(p.name),
        image: String(p.image_url ?? ""),
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });
    }

    const total = subtotal + deliveryFee;
    const customerId = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const seq = await sql.query<{ n: number }>(`select nextval('order_number_seq') as n`);
    const n = asNumber(seq[0]?.n, 1024);
    const orderNumber = `ELT-${n}`;

    await sql.query(
      `insert into customers (id, name, email, phone, address, city, state)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [customerId, name, email, phone, address, city, state],
    );
    await sql.query(
      `insert into orders (id, order_number, customer_id, access_token, subtotal, delivery_fee, total, status)
       values ($1,$2,$3,$4,$5,$6,$7,'pending')`,
      [orderId, orderNumber, customerId, accessToken, subtotal, deliveryFee, total],
    );
    for (const item of resolved) {
      await sql.query(
        `insert into order_items (id, order_id, product_id, product_name, product_image, quantity, price, selected_size, selected_color)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          crypto.randomUUID(),
          orderId,
          item.productId,
          item.name,
          item.image,
          item.quantity,
          item.price,
          item.size,
          item.color,
        ],
      );
      await sql.query(`update products set stock = stock - $1 where id = $2`, [
        item.quantity,
        item.productId,
      ]);
    }
    await sql.query(
      `insert into payments (id, order_id, amount, status) values ($1,$2,$3,'pending')`,
      [paymentId, orderId, total],
    );

    return { orderNumber, accessToken, total };
  });

export const getPublicOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderNumber: z.string(), token: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query(`select id from orders where order_number = $1 and access_token = $2`, [
      data.orderNumber,
      data.token,
    ]);
    if (!rows[0]) return null;
    return loadOrder(String(rows[0].id));
  });

export const acknowledgePayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderNumber: z.string(), token: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query(
      `select id, status from orders where order_number = $1 and access_token = $2`,
      [data.orderNumber, data.token],
    );
    const order = rows[0];
    if (!order) throw new Error("Order not found");
    // Intentionally does NOT mark payment successful — pending until receipt + admin verify.
    return { ok: true, status: String(order.status) };
  });

export const uploadReceipt = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNumber: z.string(),
      token: z.string(),
      filename: z.string(),
      mime: z.string(),
      dataUrl: z.string().min(20),
    }),
  )
  .handler(async ({ data }) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf", "image/jpg"];
    const mime = data.mime.toLowerCase();
    if (!allowed.includes(mime) && !mime.endsWith("/jpeg") && !mime.endsWith("/png") && !mime.endsWith("/pdf")) {
      throw new Error("Please upload a JPG, PNG or PDF file.");
    }
    if (data.dataUrl.length > 7_000_000) {
      throw new Error("File is too large. Maximum size is 5MB.");
    }
    const sql = await getSql();
    const rows = await sql.query(
      `select id, status from orders where order_number = $1 and access_token = $2`,
      [data.orderNumber, data.token],
    );
    const order = rows[0];
    if (!order) throw new Error("Order not found");
    const status = String(order.status);
    if (status === "cancelled" || status === "completed") {
      throw new Error("This order can no longer accept a receipt.");
    }
    await sql.query(
      `update payments
         set receipt_data = $1, receipt_name = $2, receipt_mime = $3,
             submitted_at = now(), status = 'submitted'
       where order_id = $4`,
      [data.dataUrl, data.filename, data.mime, order.id],
    );
    await sql.query(
      `update orders set status = 'under_verification', updated_at = now() where id = $1`,
      [order.id],
    );
    return { ok: true, status: "under_verification" };
  });

export const lookupOrder = createServerFn({ method: "POST" })
  .validator(z.object({ orderNumber: z.string(), email: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query(
      `select o.order_number, o.access_token
         from orders o join customers c on c.id = o.customer_id
        where o.order_number = $1 and lower(c.email) = $2`,
      [data.orderNumber.trim().toUpperCase(), data.email.trim().toLowerCase()],
    );
    if (!rows[0]) throw new Error("No order matched that number and email.");
    return {
      orderNumber: String(rows[0].order_number),
      accessToken: String(rows[0].access_token),
    };
  });
