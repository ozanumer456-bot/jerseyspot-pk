import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => set({ ids: get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [...get().ids, id] }),
      has: (id) => get().ids.includes(id),
    }),
    { name: "jerseypk-wish" }
  )
);
