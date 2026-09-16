-- Elite Complete Database Schema & Initial Data
-- Combined Auth, Store Schema, and Seed Data

-- -----------------------------------------------------------------------------
-- 1. Better Auth (Identity, Sessions & Accounts)
-- -----------------------------------------------------------------------------
create table if not exists "user" (
  "id" text not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists "session" (
  "id" text not null primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
  "id" text not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null
);

create table if not exists "verification" (
  "id" text not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- -----------------------------------------------------------------------------
-- 2. Storefront, Catalog & Orders Schema
-- -----------------------------------------------------------------------------
create sequence if not exists order_number_seq start with 1024;

create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  image_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price integer not null,
  category_id text not null references categories(id),
  image_url text not null default '',
  images_json text not null default '[]',
  stock integer not null default 0,
  sizes_json text not null default '[]',
  colors_json text not null default '[]',
  details text not null default '',
  is_new boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products (category_id);
create index if not exists products_slug_idx on products (slug);

create table if not exists customers (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);

create index if not exists customers_email_idx on customers (email);

create table if not exists orders (
  id text primary key,
  order_number text not null unique,
  customer_id text not null references customers(id),
  access_token text not null unique,
  subtotal integer not null,
  delivery_fee integer not null,
  total integer not null,
  status text not null default 'pending',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders (customer_id);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text,
  product_name text not null,
  product_image text not null default '',
  quantity integer not null,
  price integer not null,
  selected_size text not null default '',
  selected_color text not null default ''
);

create index if not exists order_items_order_id_idx on order_items (order_id);

create table if not exists payments (
  id text primary key,
  order_id text not null unique references orders(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending',
  receipt_data text,
  receipt_name text,
  receipt_mime text,
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by text,
  rejection_reason text
);

create table if not exists admins (
  user_id text primary key,
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists store_settings (
  key text primary key,
  value text not null
);

create table if not exists newsletter (
  id text primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Initial Seed Data
-- -----------------------------------------------------------------------------
insert into categories (id, name, slug, image_url, sort_order) values
  ('cat-dresses', 'Dresses', 'dresses', '/images/cat-dresses.jpg', 1),
  ('cat-tops', 'Tops', 'tops', '/images/cat-tops.jpg', 2),
  ('cat-trousers', 'Trousers', 'trousers', '/images/cat-trousers.jpg', 3),
  ('cat-skirts', 'Skirts', 'skirts', '/images/cat-dresses.jpg', 4),
  ('cat-jackets', 'Jackets', 'jackets', '/images/blazer.jpg', 5),
  ('cat-accessories', 'Accessories', 'accessories', '/images/tote.jpg', 6)
on conflict (id) do nothing;

insert into products (
  id, name, slug, description, price, category_id, image_url, images_json,
  stock, sizes_json, colors_json, details, is_new, is_active
) values
(
  'prod-linen-shirt',
  'Oversized Linen Shirt',
  'oversized-linen-shirt',
  'Relaxed-fit linen shirt designed for effortless everyday styling. Cut from breathable European linen with a softly structured collar, single chest pocket and a curved hem that sits beautifully tucked or worn open.',
  45000,
  'cat-tops',
  '/images/linen-shirt.jpg',
  '["/images/linen-shirt.jpg","/images/linen-shirt-flat.jpg"]',
  24,
  '["XS","S","M","L","XL"]',
  '[{"name":"Cream","hex":"#F5F0E8"}]',
  '100% linen. Relaxed oversized fit. Machine wash cold, hang dry. Made for year-round wear in warm climates.',
  true,
  true
),
(
  'prod-silk-top',
  'Sleeveless Silk Top',
  'sleeveless-silk-top',
  'A fluid sleeveless blouse in chocolate silk, cut to skim the body and pair with tailored trousers or a midi skirt. The jewel neckline keeps the line clean and architectural.',
  38000,
  'cat-tops',
  '/images/cat-tops.jpg',
  '["/images/cat-tops.jpg"]',
  0,
  '["XS","S","M","L","XL"]',
  '[{"name":"Espresso","hex":"#2B211C"}]',
  'Silk blend. Slim, elegant fit. Dry clean recommended.',
  false,
  true
),
(
  'prod-satin-dress',
  'Satin Midi Dress',
  'satin-midi-dress',
  'A liquid satin midi with a draped cowl neckline and slender straps. Designed to move with you — from late afternoon through evening — without ever feeling overdone.',
  55000,
  'cat-dresses',
  '/images/satin-dress.jpg',
  '["/images/satin-dress.jpg"]',
  16,
  '["XS","S","M","L","XL"]',
  '[{"name":"Champagne","hex":"#D8C8B5"},{"name":"Black","hex":"#171514"}]',
  'Satin viscose blend. Bias-cut midi length. Dry clean only. Adjustable straps.',
  true,
  true
),
(
  'prod-wrap-dress',
  'Cream Wrap Dress',
  'cream-wrap-dress',
  'A sculptural wrap dress in warm cream, with a twisted front that creates a quiet, modern line. Easy to wear, impossible to ignore.',
  58000,
  'cat-dresses',
  '/images/cat-dresses.jpg',
  '["/images/cat-dresses.jpg"]',
  12,
  '["XS","S","M","L","XL"]',
  '[{"name":"Cream","hex":"#F5F0E8"}]',
  'Soft structured viscose. True wrap silhouette. Hand wash cold.',
  false,
  true
),
(
  'prod-trousers',
  'Tailored Wide-Leg Trousers',
  'tailored-wide-leg-trousers',
  'Full-length wide-leg trousers with a high rise, pressed pleats and a clean hem. Tailored to fall in a straight, architectural line from hip to floor.',
  70000,
  'cat-trousers',
  '/images/trousers.jpg',
  '["/images/trousers.jpg","/images/cat-trousers.jpg"]',
  18,
  '["XS","S","M","L","XL"]',
  '[{"name":"Ivory","hex":"#F5F0E8"},{"name":"Charcoal","hex":"#171514"}]',
  'Wool-blend suiting. High-rise wide leg. Dry clean. Belt loops, side pockets, zip fly.',
  true,
  true
),
(
  'prod-blazer',
  'Structured Blazer',
  'structured-blazer',
  'A sharply tailored blazer with a defined shoulder, single-button close and a slightly cropped length. The piece that turns any look into a presence.',
  65000,
  'cat-jackets',
  '/images/blazer.jpg',
  '["/images/blazer.jpg"]',
  14,
  '["XS","S","M","L","XL"]',
  '[{"name":"Camel","hex":"#D8C8B5"},{"name":"Charcoal","hex":"#171514"}]',
  'Wool-blend suiting. Structured shoulder. Fully lined. Dry clean.',
  true,
  true
),
(
  'prod-tote',
  'Leather Structured Tote',
  'leather-structured-tote',
  'A compact structured tote in espresso leather, with a top handle, magnetic close and room enough for the day. Designed to sit as a quiet companion to tailored looks.',
  85000,
  'cat-accessories',
  '/images/tote.jpg',
  '["/images/tote.jpg"]',
  20,
  '["One Size"]',
  '[{"name":"Espresso","hex":"#2B211C"}]',
  'Full-grain leather. Unlined interior pocket. Wipe clean with a soft cloth.',
  false,
  true
),
(
  'prod-midi-skirt',
  'Draped Midi Skirt',
  'draped-midi-skirt',
  'A softly draped midi skirt with an easy wrap front and a fluid hem. Cut to move, in a warm cream that layers over everything in the collection.',
  42000,
  'cat-skirts',
  '/images/cat-dresses.jpg',
  '["/images/cat-dresses.jpg"]',
  10,
  '["XS","S","M","L","XL"]',
  '[{"name":"Cream","hex":"#F5F0E8"}]',
  'Fluid viscose. Wrap construction with hidden snap. Hand wash cold.',
  false,
  true
)
on conflict (id) do nothing;

insert into store_settings (key, value) values
  ('bank_name', 'Elite Fashion Bank'),
  ('account_name', 'Elite Fashion Store'),
  ('account_number', '0123456789'),
  ('delivery_fee', '5000'),
  ('store_email', 'atelier@elite.ng'),
  ('store_phone', '+234 800 353 483'),
  ('store_address', 'Victoria Island, Lagos')
on conflict (key) do nothing;
