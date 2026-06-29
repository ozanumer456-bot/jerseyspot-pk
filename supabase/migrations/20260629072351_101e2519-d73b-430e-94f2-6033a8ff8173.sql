ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS karachi_shipping integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS other_city_shipping integer NOT NULL DEFAULT 500;

UPDATE public.settings 
  SET whatsapp_number = '+923260035627',
      karachi_shipping = 300,
      other_city_shipping = 500
  WHERE whatsapp_number = '+923000000000' OR karachi_shipping IS NOT NULL;