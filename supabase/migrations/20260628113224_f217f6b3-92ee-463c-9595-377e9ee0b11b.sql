
-- ============ ROLES ============
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id);
create policy "admins read all roles" on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Allow-list admin email; grant role only when email is verified
create or replace function public.grant_admin_for_allowlisted_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) = 'humza.merch@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created_grant_admin
after insert on auth.users for each row
execute function public.grant_admin_for_allowlisted_email();

create trigger on_auth_user_confirmed_grant_admin
after update of email_confirmed_at on auth.users for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.grant_admin_for_allowlisted_email();

-- ============ PRODUCTS ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  category text not null,                       -- Club / National / Retro / Training
  type text not null default 'Home',            -- Home / Away / Third
  price integer not null,                       -- PKR
  sale_price integer,
  sizes text[] not null default '{S,M,L,XL,XXL}',
  image_url text not null,
  stock integer not null default 0,
  is_new boolean not null default false,
  is_sale boolean not null default false,
  description text not null default '',
  rating integer not null default 4,
  created_at timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "admins write products" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  postal_code text,
  payment_method text not null,                  -- cod / easypaisa / jazzcash
  items jsonb not null,                          -- [{product_id, name, size, quantity, price}]
  subtotal integer not null,
  shipping integer not null default 0,
  total integer not null,
  status text not null default 'pending',        -- pending/confirmed/shipped/delivered/cancelled
  created_at timestamptz not null default now()
);

grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
-- (no anon grant; orders are placed via SECURITY DEFINER RPC below)

alter table public.orders enable row level security;
create policy "admins read orders" on public.orders for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "admins update orders" on public.orders for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============ CUSTOMERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  city text not null,
  total_orders integer not null default 0,
  total_spent integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.customers to authenticated;
grant all on public.customers to service_role;

alter table public.customers enable row level security;
create policy "admins read customers" on public.customers for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============ SETTINGS ============
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text not null default '+923000000000',
  store_name text not null default 'JerseyPK',
  free_shipping_above integer not null default 2000,
  shipping_cost integer not null default 200,
  singleton boolean not null default true unique
);

grant select on public.settings to anon, authenticated;
grant insert, update on public.settings to authenticated;
grant all on public.settings to service_role;

alter table public.settings enable row level security;
create policy "settings public read" on public.settings for select to anon, authenticated using (true);
create policy "admins write settings" on public.settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.settings (singleton) values (true);

-- ============ place_order RPC ============
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_payment_method text,
  p_items jsonb,
  p_subtotal integer,
  p_shipping integer,
  p_total integer
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Empty order';
  end if;

  insert into public.orders (customer_name, phone, city, address, postal_code, payment_method, items, subtotal, shipping, total)
  values (p_customer_name, p_phone, p_city, p_address, p_postal_code, p_payment_method, p_items, p_subtotal, p_shipping, p_total)
  returning id into v_order_id;

  -- decrement stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    update public.products
       set stock = greatest(0, stock - (v_item->>'quantity')::int)
     where id = (v_item->>'product_id')::uuid;
  end loop;

  -- upsert customer
  insert into public.customers (name, phone, city, total_orders, total_spent)
  values (p_customer_name, p_phone, p_city, 1, p_total)
  on conflict (phone) do update
    set total_orders = public.customers.total_orders + 1,
        total_spent = public.customers.total_spent + excluded.total_spent,
        name = excluded.name,
        city = excluded.city;

  return v_order_id;
end; $$;

grant execute on function public.place_order(text,text,text,text,text,text,jsonb,integer,integer,integer) to anon, authenticated;
