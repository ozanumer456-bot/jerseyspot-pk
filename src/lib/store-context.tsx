import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoreRow = {
  id: string;
  store_slug: string;
  owner_email: string | null;
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
  karachi_shipping: number;
  other_city_shipping: number;
  free_shipping_above: number;
  status: string;
  created_at: string;
};

export const DEFAULT_STORE_SLUG = "kitverse";

export const FALLBACK_STORE: StoreRow = {
  id: "",
  store_slug: DEFAULT_STORE_SLUG,
  owner_email: null,
  store_name: "KitVerse",
  tagline: "Premium quality, delivered across the country.",
  primary_color: "#00FF87",
  secondary_color: "#0F1420",
  logo_letter: "K",
  hero_headline: "Your Favourite Jersey Store",
  hero_subheading: "Premium football jerseys — delivered to your doorstep with Cash on Delivery.",
  hero_image_url: "",
  whatsapp_number: "+923260035627",
  email: "support@kitverse.com",
  instagram_url: "",
  facebook_url: "",
  karachi_shipping: 300,
  other_city_shipping: 500,
  free_shipping_above: 10000,
  status: "active",
  created_at: "",
};

async function fetchStoreBySlug(slug: string): Promise<StoreRow | null> {
  const { data, error } = await supabase
    .from("stores" as any)
    .select("*")
    .eq("store_slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as StoreRow) ?? null;
}

export function useStoreQuery(slug: string) {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: () => fetchStoreBySlug(slug),
  });
}

type Ctx = {
  slug: string;
  store: StoreRow;
  storeId: string | null;
  loading: boolean;
  refetch: () => Promise<unknown>;
};

const StoreCtx = createContext<Ctx | null>(null);

const DEFAULT_CONTEXT: Ctx = {
  slug: DEFAULT_STORE_SLUG,
  store: FALLBACK_STORE,
  storeId: null,
  loading: false,
  refetch: () => Promise.resolve(null),
};

export function StoreProvider({ slug, children }: { slug?: string; children: ReactNode }) {
  const effectiveSlug = slug || DEFAULT_STORE_SLUG;
  const q = useStoreQuery(effectiveSlug);
  const storeId = q.data?.id ?? null;
  const refetch = useCallback(() => q.refetch(), [q.refetch]);
  const value = useMemo<Ctx>(() => {
    const store = q.data ?? { ...FALLBACK_STORE, store_slug: effectiveSlug };
    return { slug: effectiveSlug, store, storeId, loading: q.isLoading, refetch };
  }, [effectiveSlug, q.data, storeId, q.isLoading, refetch]);

  const lastDebugValue = useRef<Ctx | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const previous = lastDebugValue.current;
    const changed = previous
      ? {
          slug: previous.slug !== value.slug,
          storeId: previous.storeId !== value.storeId,
          loading: previous.loading !== value.loading,
          storeRef: previous.store !== value.store,
          refetchRef: previous.refetch !== value.refetch,
        }
      : "initial";
    console.log("[StoreProvider] context value changed", {
      changed,
      slug: value.slug,
      storeId: value.storeId,
      loading: value.loading,
      storeName: value.store.store_name,
    });
    lastDebugValue.current = value;
  }, [value.slug, value.storeId, value.loading, value.store, value.refetch]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useCurrentStore(): Ctx {
  const c = useContext(StoreCtx);
  if (c) return c;
  return DEFAULT_CONTEXT;
}

export function useStoreSlug() {
  return useCurrentStore().slug;
}

/** Prepend the correct store prefix to a top-level path. Default store → path as-is. */
export function useStorePath() {
  const slug = useStoreSlug();
  return useCallback((path: string) => {
    if (!path.startsWith("/")) path = "/" + path;
    if (slug === DEFAULT_STORE_SLUG) return path;
    if (path === "/") return `/store/${slug}`;
    return `/store/${slug}${path}`;
  }, [slug]);
}

export function storePath(slug: string, path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  if (slug === DEFAULT_STORE_SLUG) return path;
  if (path === "/") return `/store/${slug}`;
  return `/store/${slug}${path}`;
}
