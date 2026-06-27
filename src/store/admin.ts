import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_PRODUCTS, type Product } from "@/lib/products";

export type Order = {
  id: string;
  customer: { name: string; phone: string; city: string; address: string; postal: string };
  items: { productId: string; name: string; size: string; quantity: number; price: number }[];
  total: number;
  payment: "COD" | "EasyPaisa" | "JazzCash";
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered";
  createdAt: number;
};

type AdminState = {
  authed: boolean;
  products: Product[];
  orders: Order[];
  login: (pw: string) => boolean;
  logout: () => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
};

export const useAdmin = create<AdminState>()(
  persist(
    (set, get) => ({
      authed: false,
      products: SAMPLE_PRODUCTS,
      orders: [],
      login: (pw) => {
        if (pw === "admin123") { set({ authed: true }); return true; }
        return false;
      },
      logout: () => set({ authed: false }),
      addProduct: (p) => set({ products: [...get().products, p] }),
      updateProduct: (id, p) => set({ products: get().products.map((x) => x.id === id ? { ...x, ...p } : x) }),
      deleteProduct: (id) => set({ products: get().products.filter((x) => x.id !== id) }),
      addOrder: (o) => set({ orders: [o, ...get().orders] }),
      updateOrderStatus: (id, status) => set({ orders: get().orders.map((o) => o.id === id ? { ...o, status } : o) }),
    }),
    { name: "jerseypk-admin", partialize: (s) => ({ products: s.products, orders: s.orders }) }
  )
);
