import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { MarketsPage } from "@/components/markets/MarketsPage";

// `q` is shared with the header's search box, so a search from anywhere in
// the app lands on a linkable, refresh-safe URL.
const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/markets")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Markets" }] }),
  component: MarketsPage,
});
