import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCurrentStore } from "@/lib/store-context";

export type CartItem = {
  id: string;
  storeId: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
};

type State = {
  items: CartItem[];
  _add: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  _remove: (id: string) => void;
  _updateQty: (id: string, qty: number) => void;
  _clearStore: (storeId: string) => void;
};

export const useCartRaw = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      _add: (item) => {
        const id = `${item.storeId}:${item.productId}-${item.size}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i)) });
        } else {
          set({ items: [...get().items, { ...item, id, quantity: item.quantity ?? 1 }] });
        }
      },
      _remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      _updateQty: (id, qty) => set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)) }),
      _clearStore: (storeId) => set({ items: get().items.filter((i) => i.storeId !== storeId) }),
    }),
    { name: "multi-store-cart-v1" }
  )
);

export type CartView = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id" | "quantity" | "storeId"> & { quantity?: number }) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

/**
 * Store-scoped cart view. All existing components can keep `useCart((s)=>s.count())`.
 */
export function useCart<T = CartView>(selector?: (s: CartView) => T): T {
  const { storeId } = useCurrentStore();
  const sid = storeId ?? "__unknown__";
  return useCartRaw((state) => {
    const items = state.items.filter((i) => i.storeId === sid);
    const view: CartView = {
      items,
      add: (item) => state._add({ ...item, storeId: sid }),
      remove: state._remove,
      updateQty: state._updateQty,
      clear: () => state._clearStore(sid),
      subtotal: () => items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => items.reduce((s, i) => s + i.quantity, 0),
    };
    return (selector ? selector(view) : (view as unknown as T)) as T;
  });
}
