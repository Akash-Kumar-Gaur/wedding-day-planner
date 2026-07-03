import type { TimelineEvent } from "@/data/wedding-types";

export type InviteThemeId = "floral" | "minimal" | "royal" | "pastel";

export interface SavedInvite {
  id: string;
  weddingId: string;
  guestId: string | null;
  guestGroupId: string | null;
  eventIds: string[];
  theme: InviteThemeId;
}

export function buildEventSummary(
  selected: TimelineEvent[],
  totalEventCount: number,
): string {
  if (selected.length === 0) return "Wedding celebrations";
  if (selected.length === totalEventCount) return "All events";
  if (selected.length === 1) return selected[0].name;
  if (selected.length === 2) return `${selected[0].name} & ${selected[1].name}`;
  const names = selected.map((e) => e.name);
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function buildDateRange(_weddingDate: string, selected: TimelineEvent[]): string {
  if (selected.length === 0) {
    return new Date(_weddingDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const dates = selected
    .map((e) => parseDateOnly(e.eventDate))
    .sort((a, b) => a.getTime() - b.getTime());

  const first = dates[0];
  const last = dates[dates.length - 1];

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const fmtShort = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  if (first.getTime() === last.getTime()) return fmt(first);
  if (first.getFullYear() === last.getFullYear()) {
    return `${fmtShort(first)}–${fmtShort(last)} ${first.getFullYear()}`;
  }
  return `${fmt(first)} – ${fmt(last)}`;
}
