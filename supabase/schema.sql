-- =====================================================================
-- AETERNUM WATCHES — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor (or `supabase db push`) on a
-- fresh project. Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE
-- wherever Postgres supports it.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- ROLES / ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'processing', 'completed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PROFILES  (extends auth.users)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role user_role not null default 'customer',
  vip_status boolean not null default false,
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------
-- ADDRESSES
-- ---------------------------------------------------------------------
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postal_code text,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on addresses(user_id);

-- ---------------------------------------------------------------------
-- CATEGORIES / COLLECTIONS-as-products metadata
-- ---------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null
);

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  category text,
  collection text,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'USD',
  is_limited boolean not null default false,
  is_new boolean not null default false,
  is_active boolean not null default true,
  stock integer not null default 0 check (stock >= 0),
  movement text,
  case_material text,
  water_resistance text,
  warranty text,
  description text,
  image_url text,
  model_url text,
  rating numeric(2,1) default 0,
  review_count integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category);
create index if not exists idx_products_collection on products(collection);
create index if not exists idx_products_active on products(is_active);

-- ---------------------------------------------------------------------
-- INVENTORY (movement log, separate from the live `products.stock` count)
-- ---------------------------------------------------------------------
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  change integer not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_product on inventory(product_id);

-- ---------------------------------------------------------------------
-- DISCOUNTS / COUPONS
-- ---------------------------------------------------------------------
create table if not exists discounts (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  percent_off numeric(5,2) not null check (percent_off > 0 and percent_off <= 100),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- FEEDBACK (contact form submissions, reviewable/removable by admins)
-- ---------------------------------------------------------------------
create table if not exists feedback (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ORDERS / ORDER ITEMS
-- ---------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number bigserial unique,
  user_id uuid references profiles(id) on delete set null,
  status order_status not null default 'pending',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','awaiting_verification','paid','failed','refunded')),
  payment_method text not null default 'stripe' check (payment_method in ('stripe','whish_money','whish_card','cash_on_delivery')),
  payment_reference text,
  stripe_session_id text,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Safe to re-run against an existing database that predates these columns:
alter table orders add column if not exists payment_status text not null default 'unpaid';
alter table orders add column if not exists stripe_session_id text;
alter table orders add column if not exists payment_method text not null default 'stripe';
alter table orders add column if not exists payment_reference text;
alter table products add column if not exists model_url text;
update products set currency = 'USD' where currency = 'GBP';
-- Widen the payment_status check to allow the "awaiting_verification" state
-- used by manual payment methods like Whish Money (re-running this is safe
-- even on a database created before that state existed):
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid','awaiting_verification','paid','failed','refunded'));
alter table orders drop constraint if exists orders_payment_method_check;
alter table orders add constraint orders_payment_method_check
  check (payment_method in ('stripe','whish_money','whish_card','cash_on_delivery'));
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);
create index if not exists idx_order_items_order on order_items(order_id);

-- ---------------------------------------------------------------------
-- INVOICES  (sequential INV-000001 numbering via trigger)
-- ---------------------------------------------------------------------
create sequence if not exists invoice_number_seq start 1;

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number bigint unique not null default nextval('invoice_number_seq'),
  order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_invoices_order on invoices(order_id);

-- Auto-generate an invoice the moment an order is marked completed.
create or replace function generate_invoice_on_completion()
returns trigger as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    insert into invoices (order_id) values (new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_invoice on orders;
create trigger trg_generate_invoice
  after update of status on orders
  for each row execute procedure generate_invoice_on_completion();

-- ---------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_product on reviews(product_id);

-- Keep products.rating / review_count in sync with the reviews table.
create or replace function refresh_product_rating()
returns trigger as $$
begin
  update products p
  set rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where product_id = p.id), 0),
      review_count = (select count(*) from reviews where product_id = p.id)
  where p.id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_refresh_rating on reviews;
create trigger trg_refresh_rating
  after insert or update or delete on reviews
  for each row execute procedure refresh_product_rating();

-- ---------------------------------------------------------------------
-- WISHLISTS  (server-side mirror; the frontend also keeps a local copy
-- for guests via localStorage — see src/context/WishlistContext.jsx)
-- ---------------------------------------------------------------------
create table if not exists wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- ANALYTICS / VISITORS
-- ---------------------------------------------------------------------
create table if not exists visitors (
  id uuid primary key default uuid_generate_v4(),
  session_id text,
  created_at timestamptz not null default now()
);

create table if not exists analytics (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  path text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_analytics_event on analytics(event_type);
create index if not exists idx_analytics_created on analytics(created_at);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS  (admin bell feed + realtime source)
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  message text not null,
  severity text default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Fire an in-app notification whenever a new order is created.
create or replace function notify_new_order()
returns trigger as $$
begin
  insert into notifications (type, message, severity)
  values ('new_order', 'New order #' || new.order_number || ' received.', 'info');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_new_order on orders;
create trigger trg_notify_new_order
  after insert on orders
  for each row execute procedure notify_new_order();

-- Fire a low-stock notification whenever stock drops at or below 5.
create or replace function notify_low_stock()
returns trigger as $$
begin
  if new.stock <= 5 and (old.stock is null or old.stock > 5) then
    insert into notifications (type, message, severity)
    values ('low_stock', 'Low stock: ' || new.name || ' has ' || new.stock || ' units left.', 'warning');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_low_stock on products;
create trigger trg_notify_low_stock
  after update of stock on products
  for each row execute procedure notify_low_stock();

-- ---------------------------------------------------------------------
-- ADMIN LOGS  (activity trail)
-- ---------------------------------------------------------------------
create table if not exists admin_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  created_at timestamptz not null default now()
);

create or replace function log_admin_action(p_action text, p_table text, p_record uuid)
returns void as $$
begin
  insert into admin_logs (actor_id, action, table_name, record_id)
  values (auth.uid(), p_action, p_table, p_record);
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------
-- PRODUCT VARIANTS  (size / dial color / strap material, etc.)
-- ---------------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,           -- e.g. "Dial Color", "Strap"
  value text not null,          -- e.g. "Midnight Blue", "Alligator Leather"
  sku text,
  price_delta numeric(12,2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_variants_product on product_variants(product_id);

-- ---------------------------------------------------------------------
-- REFUND REQUESTS  (separate from order.status so a request can be
-- reviewed/approved/denied before the order itself is marked refunded)
-- ---------------------------------------------------------------------
do $$ begin
  create type refund_status as enum ('pending', 'approved', 'denied');
exception when duplicate_object then null; end $$;

create table if not exists refund_requests (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  reason text,
  status refund_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_refund_requests_order on refund_requests(order_id);
create index if not exists idx_refund_requests_status on refund_requests(status);

-- Notify admins in-app the moment a refund is requested.
create or replace function notify_refund_request()
returns trigger as $$
begin
  insert into notifications (type, message, severity)
  values ('refund_request', 'Refund requested for order — review in Admin → Orders.', 'warning');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_refund_request on refund_requests;
create trigger trg_notify_refund_request
  after insert on refund_requests
  for each row execute procedure notify_refund_request();

-- When a refund request is approved, mark the underlying order refunded.
create or replace function apply_refund_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update orders set status = 'refunded' where id = new.order_id;
    new.resolved_at = now();
  elsif new.status = 'denied' and old.status is distinct from 'denied' then
    new.resolved_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apply_refund_approval on refund_requests;
create trigger trg_apply_refund_approval
  before update of status on refund_requests
  for each row execute procedure apply_refund_approval();

-- ---------------------------------------------------------------------
-- STORE SETTINGS  (single-row config used by the Admin Settings panel)
-- ---------------------------------------------------------------------
create table if not exists store_settings (
  id boolean primary key default true check (id),  -- enforces a single row
  store_name text not null default 'Aeternum Watches',
  support_email text not null default 'support@aeternumwatches.com',
  low_stock_threshold integer not null default 5,
  whish_money_name text not null default '',
  whish_money_phone text not null default '',
  updated_at timestamptz not null default now()
);
insert into store_settings (id) values (true) on conflict (id) do nothing;
alter table store_settings add column if not exists whish_money_name text not null default '';
alter table store_settings add column if not exists whish_money_phone text not null default '';

-- ---------------------------------------------------------------------
-- STORAGE: product image uploads
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and is_admin());

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table inventory enable row level security;
alter table discounts enable row level security;
alter table feedback enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table invoices enable row level security;
alter table reviews enable row level security;
alter table wishlists enable row level security;
alter table visitors enable row level security;
alter table analytics enable row level security;
alter table notifications enable row level security;
alter table admin_logs enable row level security;
alter table product_variants enable row level security;
alter table refund_requests enable row level security;
alter table store_settings enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql stable security definer;

-- Products: public read, admin write.
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (is_active = true or is_admin());
drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products for all using (is_admin()) with check (is_admin());

-- Categories: public read, admin write.
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (true);
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories for all using (is_admin()) with check (is_admin());

-- Profiles: users see/edit their own; admins see all.
drop policy if exists "profiles_self_or_admin_select" on profiles;
create policy "profiles_self_or_admin_select" on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles for update using (id = auth.uid() or is_admin());

-- Addresses: owner or admin.
drop policy if exists "addresses_owner" on addresses;
create policy "addresses_owner" on addresses for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- Orders: owner or admin.
drop policy if exists "orders_owner_select" on orders;
create policy "orders_owner_select" on orders for select using (user_id = auth.uid() or is_admin());
drop policy if exists "orders_owner_insert" on orders;
create policy "orders_owner_insert" on orders for insert with check (user_id = auth.uid() or user_id is null);
drop policy if exists "orders_admin_update" on orders;
create policy "orders_admin_update" on orders for update using (is_admin());

-- Order items: visible if the parent order is visible.
drop policy if exists "order_items_via_order" on order_items;
create policy "order_items_via_order" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);
drop policy if exists "order_items_insert" on order_items;
create policy "order_items_insert" on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);

-- Invoices: owner (via order) or admin.
drop policy if exists "invoices_via_order" on invoices;
create policy "invoices_via_order" on invoices for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);
drop policy if exists "invoices_admin_write" on invoices;
create policy "invoices_admin_write" on invoices for all using (is_admin()) with check (is_admin());

-- Reviews: public read, authenticated write own.
drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews for select using (true);
drop policy if exists "reviews_own_write" on reviews;
create policy "reviews_own_write" on reviews for insert with check (user_id = auth.uid());
drop policy if exists "reviews_own_update" on reviews;
create policy "reviews_own_update" on reviews for update using (user_id = auth.uid() or is_admin());

-- Wishlists: owner only.
drop policy if exists "wishlists_owner" on wishlists;
create policy "wishlists_owner" on wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Inventory / discounts: admin only.
drop policy if exists "inventory_admin" on inventory;
create policy "inventory_admin" on inventory for all using (is_admin()) with check (is_admin());
drop policy if exists "discounts_admin_write" on discounts;
create policy "discounts_admin_write" on discounts for all using (is_admin()) with check (is_admin());
drop policy if exists "discounts_public_read_active" on discounts;
create policy "discounts_public_read_active" on discounts for select using (active = true or is_admin());

-- Feedback: anyone (including guests) can submit; only admins can read or delete.
drop policy if exists "feedback_public_insert" on feedback;
create policy "feedback_public_insert" on feedback for insert with check (true);
drop policy if exists "feedback_admin_read" on feedback;
create policy "feedback_admin_read" on feedback for select using (is_admin());
drop policy if exists "feedback_admin_delete" on feedback;
create policy "feedback_admin_delete" on feedback for delete using (is_admin());

-- Visitors / analytics: anyone can insert (anonymous tracking), only admins read.
drop policy if exists "visitors_insert_any" on visitors;
create policy "visitors_insert_any" on visitors for insert with check (true);
drop policy if exists "visitors_admin_read" on visitors;
create policy "visitors_admin_read" on visitors for select using (is_admin());

drop policy if exists "analytics_insert_any" on analytics;
create policy "analytics_insert_any" on analytics for insert with check (true);
drop policy if exists "analytics_admin_read" on analytics;
create policy "analytics_admin_read" on analytics for select using (is_admin());

-- Notifications: admin only (this is the admin bell feed).
drop policy if exists "notifications_admin" on notifications;
create policy "notifications_admin" on notifications for all using (is_admin()) with check (is_admin());

-- Admin logs: admin only.
drop policy if exists "admin_logs_admin" on admin_logs;
create policy "admin_logs_admin" on admin_logs for all using (is_admin()) with check (is_admin());

-- Product variants: public read (only for active products), admin write.
drop policy if exists "variants_public_read" on product_variants;
create policy "variants_public_read" on product_variants for select using (
  exists (select 1 from products p where p.id = product_id and (p.is_active or is_admin()))
);
drop policy if exists "variants_admin_write" on product_variants;
create policy "variants_admin_write" on product_variants for all using (is_admin()) with check (is_admin());

-- Refund requests: the owning customer can create/view their own; admins
-- can view and update (approve/deny) all of them.
drop policy if exists "refund_requests_owner_select" on refund_requests;
create policy "refund_requests_owner_select" on refund_requests for select using (user_id = auth.uid() or is_admin());
drop policy if exists "refund_requests_owner_insert" on refund_requests;
create policy "refund_requests_owner_insert" on refund_requests for insert with check (
  user_id = auth.uid() and exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
drop policy if exists "refund_requests_admin_update" on refund_requests;
create policy "refund_requests_admin_update" on refund_requests for update using (is_admin());

-- Store settings: public read (storefront may want the support email),
-- admin write.
drop policy if exists "store_settings_public_read" on store_settings;
create policy "store_settings_public_read" on store_settings for select using (true);
drop policy if exists "store_settings_admin_write" on store_settings;
create policy "store_settings_admin_write" on store_settings for update using (is_admin());
