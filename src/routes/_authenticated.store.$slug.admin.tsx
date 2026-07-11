import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store-context";
import { AdminBody } from "./_authenticated.admin";

export const Route = createFileRoute("/_authenticated/store/$slug/admin")({
  head: () => ({ meta: [{ title: "Store Admin" }] }),
  component: StoreAdminWrapper,
});

function StoreAdminWrapper() {
  const { slug } = Route.useParams();
  return (
    <StoreProvider slug={slug}>
      <AdminBody />
    </StoreProvider>
  );
}
