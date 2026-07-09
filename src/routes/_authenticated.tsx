import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/admin/login", search: { redirect: location.href } as any });
    }
    const { data } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) {
      throw redirect({ to: "/admin/login", search: { redirect: location.href } as any });
    }
  },
  component: () => <Outlet />,
});
