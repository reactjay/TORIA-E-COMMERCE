-- Elite storefront + admin schema

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
