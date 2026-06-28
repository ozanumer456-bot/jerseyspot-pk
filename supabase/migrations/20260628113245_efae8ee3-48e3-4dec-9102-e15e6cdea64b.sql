
revoke execute on function public.grant_admin_for_allowlisted_email() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
-- has_role still needed by RLS (runs as definer); authenticated may call it via policies.
-- place_order intentionally callable by anon for guest checkout.
