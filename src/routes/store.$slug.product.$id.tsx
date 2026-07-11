import { createFileRoute } from "@tanstack/react-router";
import { ProductBody } from "./product.$id";

export const Route = createFileRoute("/store/$slug/product/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <ProductBody id={id} />;
  },
});
