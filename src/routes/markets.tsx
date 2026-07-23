import { createFileRoute } from "@tanstack/react-router";
import { MarketsPage } from "@/components/markets/MarketsPage";

export const Route = createFileRoute("/markets")({
  component: MarketsPage,
});
