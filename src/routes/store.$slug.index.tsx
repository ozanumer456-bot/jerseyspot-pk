import { createFileRoute } from "@tanstack/react-router";
import { HomeBody } from "./index";

export const Route = createFileRoute("/store/$slug/")({
  component: HomeBody,
});
