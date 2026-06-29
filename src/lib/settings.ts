import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Settings = {
  id: string;
  whatsapp_number: string;
  store_name: string;
  free_shipping_above: number;
  shipping_cost: number;
  karachi_shipping: number;
  other_city_shipping: number;
};

export const DEFAULT_SETTINGS: Settings = {
  id: "",
  whatsapp_number: "+923260035627",
  store_name: "JerseyPK",
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
  return ((data as unknown) as Settings) ?? DEFAULT_SETTINGS;
}

export function useSettings() {
  const q = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  return { settings: q.data ?? DEFAULT_SETTINGS, ...q };
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${(phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
