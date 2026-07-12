import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback, useMemo } from "react";
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
  const rawItems = useCartRaw((state) => state.items);
  const addRaw = useCartRaw((state) => state._add);
  const remove = useCartRaw((state) => state._remove);
  const updateQty = useCartRaw((state) => state._updateQty);
  const clearRaw = useCartRaw((state) => state._clearStore);

  const items = useMemo(() => rawItems.filter((i) => i.storeId === sid), [rawItems, sid]);
  const add = useCallback<CartView["add"]>((item) => addRaw({ ...item, storeId: sid }), [addRaw, sid]);
  const clear = useCallback(() => clearRaw(sid), [clearRaw, sid]);
  const subtotal = useCallback(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const count = useCallback(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const view = useMemo<CartView>(() => ({ items, add, remove, updateQty, clear, subtotal, count }), [items, add, remove, updateQty, clear, subtotal, count]);

  return (selector ? selector(view) : (view as unknown as T)) as T;
}
