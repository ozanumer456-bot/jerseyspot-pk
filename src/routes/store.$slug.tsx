import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store-context";

export const Route = createFileRoute("/store/$slug")({
  component: StoreLayout,
});

function StoreLayout() {
  const { slug } = Route.useParams();
  return (
    <StoreProvider slug={slug}>
      <Outlet />
    </StoreProvider>
  );
}
