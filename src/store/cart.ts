import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const id = `${item.productId}-${item.size}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set({ items: get().items.map((i) => i.id === id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i) });
        } else {
          set({ items: [...get().items, { ...item, id, quantity: item.quantity ?? 1 }] });
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQty: (id, qty) => set({ items: get().items.map((i) => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i) }),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "jerseypk-cart" }
  )
);
