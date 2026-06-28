import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  team: string;
  category: "Club" | "National" | "Retro" | "Training" | string;
  type: "Home" | "Away" | "Third" | string;
  price: number;
  salePrice?: number | null;
  image: string;
  sizes: string[];
  stock: number;
  description: string;
  isNew?: boolean;
  isSale?: boolean;
  rating: number;
};

export type DbProduct = {
  id: string;
  name: string;
  team: string;
  category: string;
  type: string;
  price: number;
  sale_price: number | null;
  sizes: string[];
  image_url: string;
  stock: number;
  is_new: boolean;
  is_sale: boolean;
  description: string;
  rating: number;
  created_at: string;
};

export const SIZES = ["S", "M", "L", "XL", "XXL"];
export const TYPES = ["Home", "Away", "Third"];

export const formatPKR = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=500&fit=crop";

export function mapProduct(d: DbProduct): Product {
  return {
    id: d.id,
    name: d.name,
    team: d.team,
    category: d.category,
    type: d.type,
    price: d.price,
    salePrice: d.sale_price ?? null,
    image: d.image_url || FALLBACK_IMG,
    sizes: d.sizes ?? [],
    stock: d.stock ?? 0,
    description: d.description ?? "",
    isNew: d.is_new,
    isSale: d.is_sale || (d.sale_price != null && d.sale_price < d.price),
    rating: d.rating ?? 4,
  };
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products" as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as DbProduct[]) ?? []).map(mapProduct);
}

async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as unknown as DbProduct) : null;
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts });
}

export function useProduct(id: string) {
  return useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id), enabled: !!id });
}
