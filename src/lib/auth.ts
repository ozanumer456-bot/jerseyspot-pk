import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminStore = { store_id: string; store_slug: string; store_name: string };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [adminStores, setAdminStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async (u: User | null) => {
      if (!u) {
        if (active) {
          setUser(null);
          setIsAdmin(false);
          setIsSuperadmin(false);
          setAdminStores([]);
          setLoading(false);
        }
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

      if (!active) return;
      setUser(u);
      setIsSuperadmin(!!superRow);
      setIsAdmin(!!superRow || adminRows.length > 0);
      setAdminStores(stores);
      setLoading(false);
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

  return { user, isAdmin, isSuperadmin, adminStores, loading };
}

export const signOut = () => supabase.auth.signOut();
