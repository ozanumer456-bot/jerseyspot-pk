import { createFileRoute } from "@tanstack/react-router";
import { CartBody } from "./cart";

export const Route = createFileRoute("/store/$slug/cart")({
  component: CartBody,
});
