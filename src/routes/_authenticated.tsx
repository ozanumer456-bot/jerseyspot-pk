import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } as any });
    }
    const { data } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["admin", "superadmin"]);
    if (!data || (data as any[]).length === 0) {
      throw redirect({ to: "/auth", search: { redirect: location.href } as any });
    }
  },
  component: () => <Outlet />,
});
