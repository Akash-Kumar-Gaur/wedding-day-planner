// Formatting helpers and re-exports. Live data comes from Supabase via useWeddingData().

export type {
  BudgetCategory,
  CommonlyMissedTask,
  CreateWeddingInput,
  Guest,
  GuestGroup,
  MealPref,
  PlanningTask,
  RsvpStatus,
  TimelineEvent,
  Transaction,
  Vendor,
  VendorCategory,
  VendorStatus,
  Wedding,
} from "@/data/wedding-types";

export const formatINR = (n: number): string =>
  "₹" + new Intl.NumberFormat("en-IN").format(n);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const daysUntil = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

export const daysUntilWedding = (weddingDate: string): number => {
  const target = new Date(weddingDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
};
