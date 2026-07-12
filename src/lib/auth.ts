import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminStore = { store_id: string; store_slug: string; store_name: string };

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  adminStores: AdminStore[];
  loading: boolean;
};

const EMPTY_AUTH_STATE: AuthState = {
  user: null,
  isAdmin: false,
  isSuperadmin: false,
  adminStores: [],
  loading: true,
};

function sameStores(a: AdminStore[], b: AdminStore[]) {
  return a.length === b.length && a.every((store, i) => (
    store.store_id === b[i]?.store_id &&
    store.store_slug === b[i]?.store_slug &&
    store.store_name === b[i]?.store_name
  ));
}

function sameAuthState(a: AuthState, b: AuthState) {
  return a.user?.id === b.user?.id &&
    a.isAdmin === b.isAdmin &&
    a.isSuperadmin === b.isSuperadmin &&
    a.loading === b.loading &&
    sameStores(a.adminStores, b.adminStores);
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(EMPTY_AUTH_STATE);

  useEffect(() => {
    let active = true;
    const commit = (next: AuthState) => {
      if (!active) return;
      setState((prev) => sameAuthState(prev, next) ? prev : next);
    };

    const check = async (u: User | null) => {
      if (!u) {
        commit({ ...EMPTY_AUTH_STATE, loading: false });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles" as any)
        .select("role, store_id")
        .eq("user_id", u.id);
      const rows = (roles as any[]) ?? [];
      const superRow = rows.find((r) => r.role === "superadmin");
      const adminRows = rows.filter((r) => r.role === "admin" && r.store_id);

      let stores: AdminStore[] = [];
      if (superRow) {
        const { data } = await supabase.from("stores" as any).select("id, store_slug, store_name");
        stores = ((data as any[]) ?? []).map((s) => ({ store_id: s.id, store_slug: s.store_slug, store_name: s.store_name }));
      } else if (adminRows.length) {
        const ids = adminRows.map((r) => r.store_id);
        const { data } = await supabase.from("stores" as any).select("id, store_slug, store_name").in("id", ids);
        stores = ((data as any[]) ?? []).map((s) => ({ store_id: s.id, store_slug: s.store_slug, store_name: s.store_name }));
      }

      commit({
        user: u,
        isSuperadmin: !!superRow,
        isAdmin: !!superRow || adminRows.length > 0,
        adminStores: stores,
        loading: false,
      });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => check(data.session?.user ?? null));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return useMemo(() => state, [state]);
}

export const signOut = () => supabase.auth.signOut();
