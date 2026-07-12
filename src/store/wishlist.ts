import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback, useMemo } from "react";
import { useCurrentStore } from "@/lib/store-context";

type Entry = { storeId: string; productId: string };

type State = {
  items: Entry[];
  _toggle: (storeId: string, id: string) => void;
};

const useRaw = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      _toggle: (storeId, productId) => {
        const has = get().items.some((e) => e.storeId === storeId && e.productId === productId);
        set({
          items: has
            ? get().items.filter((e) => !(e.storeId === storeId && e.productId === productId))
            : [...get().items, { storeId, productId }],
        });
      },
    }),
    { name: "multi-store-wishlist-v1" }
  )
);

export type WishView = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export function useWishlist<T = WishView>(selector?: (s: WishView) => T): T {
  const { storeId } = useCurrentStore();
  const sid = storeId ?? "__unknown__";
  const entries = useRaw((state) => state.items);
  const toggleRaw = useRaw((state) => state._toggle);

  const ids = useMemo(() => entries.filter((e) => e.storeId === sid).map((e) => e.productId), [entries, sid]);
  const toggle = useCallback((id: string) => toggleRaw(sid, id), [toggleRaw, sid]);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const view = useMemo<WishView>(() => ({ ids, toggle, has }), [ids, toggle, has]);

  return (selector ? selector(view) : (view as unknown as T)) as T;
}
