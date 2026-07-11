import { createFileRoute } from "@tanstack/react-router";
import { ShopBody } from "./shop";

export const Route = createFileRoute("/store/$slug/shop")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) || "", category: (s.category as string) || "" }),
  component: () => {
    const { q, category } = Route.useSearch();
    return <ShopBody q={q} category={category} />;
  },
});
