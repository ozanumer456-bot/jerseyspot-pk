import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Settings = {
  id: string;
  store_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  logo_letter: string;
  hero_headline: string;
  hero_subheading: string;
  hero_image_url: string;
  whatsapp_number: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  free_shipping_above: number;
  shipping_cost: number;
  karachi_shipping: number;
  other_city_shipping: number;
};

export const DEFAULT_SETTINGS: Settings = {
  id: "",
  store_name: "KitVerse",
  tagline: "Premium quality, delivered across the country.",
  primary_color: "#00FF87",
  secondary_color: "#0F1420",
  logo_letter: "K",
  hero_headline: "Your Favourite Jersey Store",
  hero_subheading:
    "Premium football jerseys — every club and national team kit, delivered to your doorstep with Cash on Delivery.",
  hero_image_url: "",
  whatsapp_number: "+923260035627",
  email: "support@kitverse.com",
  instagram_url: "https://instagram.com/kitverse",
  facebook_url: "https://facebook.com/kitverse",
  free_shipping_above: 2000,
  shipping_cost: 500,
  karachi_shipping: 300,
  other_city_shipping: 500,
};

export function shippingForCity(
  city: string,
  s: Pick<Settings, "karachi_shipping" | "other_city_shipping">,
) {
  return city.trim().toLowerCase() === "karachi" ? s.karachi_shipping : s.other_city_shipping;
}

async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings" as any)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_SETTINGS, ...((data as unknown) as Partial<Settings>) };
}

export function useSettings() {
  const q = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  return { settings: q.data ?? DEFAULT_SETTINGS, ...q };
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${(phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
