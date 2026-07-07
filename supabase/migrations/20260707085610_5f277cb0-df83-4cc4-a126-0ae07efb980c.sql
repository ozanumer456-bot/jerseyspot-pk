
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT 'Premium quality, delivered across the country.',
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#00FF87',
  ADD COLUMN IF NOT EXISTS secondary_color text NOT NULL DEFAULT '#0F1420',
  ADD COLUMN IF NOT EXISTS logo_letter text NOT NULL DEFAULT 'K',
  ADD COLUMN IF NOT EXISTS hero_headline text NOT NULL DEFAULT 'Your Favourite Jersey Store',
  ADD COLUMN IF NOT EXISTS hero_subheading text NOT NULL DEFAULT 'Premium football jerseys — every club and national team kit, delivered to your doorstep with Cash on Delivery.',
  ADD COLUMN IF NOT EXISTS hero_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT 'support@kitverse.com',
  ADD COLUMN IF NOT EXISTS instagram_url text NOT NULL DEFAULT 'https://instagram.com/kitverse',
  ADD COLUMN IF NOT EXISTS facebook_url text NOT NULL DEFAULT 'https://facebook.com/kitverse';

ALTER TABLE public.settings ALTER COLUMN store_name SET DEFAULT 'KitVerse';

UPDATE public.settings SET store_name = 'KitVerse' WHERE store_name = 'JerseyPK' OR store_name IS NULL OR store_name = '';
