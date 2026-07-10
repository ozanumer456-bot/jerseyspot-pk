
-- 1. stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug text UNIQUE NOT NULL,
  owner_email text,
  store_name text NOT NULL DEFAULT 'My Store',
  tagline text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#00FF87',
  secondary_color text NOT NULL DEFAULT '#0F1420',
  logo_letter text NOT NULL DEFAULT 'S',
  hero_headline text NOT NULL DEFAULT 'Welcome',
  hero_subheading text NOT NULL DEFAULT '',
  hero_image_url text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  karachi_shipping integer NOT NULL DEFAULT 300,
  other_city_shipping integer NOT NULL DEFAULT 500,
  free_shipping_above integer NOT NULL DEFAULT 10000,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

INSERT INTO public.stores (
  store_slug, owner_email, store_name, tagline, primary_color, secondary_color, logo_letter,
  hero_headline, hero_subheading, hero_image_url, whatsapp_number, email, instagram_url,
  facebook_url, karachi_shipping, other_city_shipping, free_shipping_above, status
)
SELECT 'kitverse', 'humza.merch@gmail.com', store_name, tagline, primary_color, secondary_color,
  logo_letter, hero_headline, hero_subheading, hero_image_url, whatsapp_number, email,
  instagram_url, facebook_url, karachi_shipping, other_city_shipping, free_shipping_above, 'active'
FROM public.settings LIMIT 1;

ALTER TABLE public.products ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.products SET store_id = (SELECT id FROM public.stores WHERE store_slug='kitverse');
UPDATE public.orders SET store_id = (SELECT id FROM public.stores WHERE store_slug='kitverse');
UPDATE public.customers SET store_id = (SELECT id FROM public.stores WHERE store_slug='kitverse');

ALTER TABLE public.products ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN store_id SET NOT NULL;

CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_customers_store ON public.customers(store_id);

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE public.customers ADD CONSTRAINT customers_store_phone_key UNIQUE (store_id, phone);

ALTER TABLE public.user_roles ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.user_roles
   SET store_id = (SELECT id FROM public.stores WHERE store_slug='kitverse')
 WHERE role = 'admin' AND store_id IS NULL;

INSERT INTO public.user_roles (user_id, role, store_id)
SELECT u.id, 'superadmin'::public.app_role, NULL
FROM auth.users u
WHERE lower(u.email) = 'humza.merch@gmail.com'
  AND u.email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='superadmin')
$$;

CREATE OR REPLACE FUNCTION public.has_store_role(_user_id uuid, _store_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id=_user_id AND role=_role AND store_id=_store_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='superadmin'
  )
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_for_allowlisted_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.email_confirmed_at IS NOT NULL
     AND lower(new.email) = 'humza.merch@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, store_id)
    VALUES (new.id, 'superadmin', NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role, store_id)
  SELECT new.id, 'admin', s.id
    FROM public.stores s
   WHERE lower(s.owner_email) = lower(new.email)
     AND new.email_confirmed_at IS NOT NULL
  ON CONFLICT DO NOTHING;

  RETURN new;
END; $$;

-- Restrict SECURITY DEFINER helpers to authenticated (lint 0028/0029)
REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_store_role(uuid, uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_store_role(uuid, uuid, app_role) TO authenticated;

CREATE POLICY "anyone reads active stores" ON public.stores FOR SELECT
  USING (status = 'active' OR public.is_superadmin(auth.uid())
         OR public.has_store_role(auth.uid(), id, 'admin'));
CREATE POLICY "superadmin manages stores" ON public.stores FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));
CREATE POLICY "store admin updates own store" ON public.stores FOR UPDATE
  USING (public.has_store_role(auth.uid(), id, 'admin'))
  WITH CHECK (public.has_store_role(auth.uid(), id, 'admin'));

DROP POLICY IF EXISTS "products public read" ON public.products;
DROP POLICY IF EXISTS "admins write products" ON public.products;
CREATE POLICY "public reads active store products" ON public.products FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.status='active')
         OR public.has_store_role(auth.uid(), store_id, 'admin'));
CREATE POLICY "store admin writes products" ON public.products FOR ALL
  USING (public.has_store_role(auth.uid(), store_id, 'admin'))
  WITH CHECK (public.has_store_role(auth.uid(), store_id, 'admin'));

DROP POLICY IF EXISTS "admins read orders" ON public.orders;
DROP POLICY IF EXISTS "admins update orders" ON public.orders;
CREATE POLICY "store admin reads orders" ON public.orders FOR SELECT
  USING (public.has_store_role(auth.uid(), store_id, 'admin'));
CREATE POLICY "store admin updates orders" ON public.orders FOR UPDATE
  USING (public.has_store_role(auth.uid(), store_id, 'admin'))
  WITH CHECK (public.has_store_role(auth.uid(), store_id, 'admin'));

DROP POLICY IF EXISTS "admins read customers" ON public.customers;
CREATE POLICY "store admin reads customers" ON public.customers FOR SELECT
  USING (public.has_store_role(auth.uid(), store_id, 'admin'));

CREATE OR REPLACE FUNCTION public.place_order(
  p_store_id uuid,
  p_customer_name text, p_phone text, p_city text, p_address text, p_postal_code text,
  p_payment_method text, p_items jsonb,
  p_subtotal integer, p_shipping integer, p_total integer
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Empty order'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id=p_store_id AND status='active') THEN
    RAISE EXCEPTION 'Store not active';
  END IF;

  INSERT INTO public.orders (store_id, customer_name, phone, city, address, postal_code, payment_method, items, subtotal, shipping, total)
  VALUES (p_store_id, p_customer_name, p_phone, p_city, p_address, p_postal_code, p_payment_method, p_items, p_subtotal, p_shipping, p_total)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE public.products
       SET stock = greatest(0, stock - (v_item->>'quantity')::int)
     WHERE id = (v_item->>'product_id')::uuid AND store_id = p_store_id;
  END LOOP;

  INSERT INTO public.customers (store_id, name, phone, city, total_orders, total_spent)
  VALUES (p_store_id, p_customer_name, p_phone, p_city, 1, p_total)
  ON CONFLICT (store_id, phone) DO UPDATE
    SET total_orders = public.customers.total_orders + 1,
        total_spent = public.customers.total_spent + excluded.total_spent,
        name = excluded.name, city = excluded.city;

  RETURN v_order_id;
END; $$;

DROP FUNCTION IF EXISTS public.place_order(text, text, text, text, text, text, jsonb, integer, integer, integer);
