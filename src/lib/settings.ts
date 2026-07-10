import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore, useStoreQuery, DEFAULT_STORE_SLUG, FALLBACK_STORE, type StoreRow } from "./store-context";

export type Settings = StoreRow & {
  // Back-compat alias: some callers used `shipping_cost`; map to other_city_shipping.
  shipping_cost?: number;
};

export const DEFAULT_SETTINGS: Settings = { ...FALLBACK_STORE };

export function shippingForCity(city: string, s: Pick<Settings, "karachi_shipping" | "other_city_shipping">) {
  return city.trim().toLowerCase() === "karachi" ? s.karachi_shipping : s.other_city_shipping;
}

/**
 * Returns the current store's settings from context (which is fetched from the `stores` table).
 * Callers keep the previous shape.
 */
export function useSettings() {
  const { slug, store, loading } = useCurrentStore();
  const q = useStoreQuery(slug);
  const settings: Settings = (q.data ?? store) as Settings;
  return { settings, isLoading: loading || q.isLoading, refetch: q.refetch };
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${(phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;

export function useUpdateStore(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<StoreRow>) => {
      const { error } = await supabase.from("stores" as any).update(patch as any).eq("store_slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store", slug] });
      qc.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export { DEFAULT_STORE_SLUG };
