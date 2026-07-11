import { createFileRoute } from "@tanstack/react-router";
import { CheckoutBody } from "./checkout";

export const Route = createFileRoute("/store/$slug/checkout")({
  component: CheckoutBody,
});
