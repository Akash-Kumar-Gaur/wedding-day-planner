import type { Wedding } from "@/data/wedding-types";

export type WeddingLoadState =
  | { status: "loading" }
  | { status: "loaded"; wedding: Wedding }
  | { status: "empty" }
  | { status: "error"; message: string };

export const WEDDING_LOAD_TIMEOUT_MS = 8_000;
