import type { GuestHeadcountSummary } from "@/lib/guest-headcount";

export function GuestHeadcountSummaryCard({ headcounts }: { headcounts: GuestHeadcountSummary }) {
  return (
    <div className="space-y-2 rounded-xl bg-secondary/60 px-3 py-3 text-center text-sm">
      <p>
        <span className="font-medium text-foreground">{headcounts.invitedRecords} invited</span>
        <span className="text-muted-foreground"> · </span>
        <span className="font-medium text-foreground">{headcounts.maxHeadcount} total guests</span>
      </p>
      <p>
        <span className="font-medium text-[color:var(--success)]">
          {headcounts.confirmedRecords} confirmed
        </span>
        <span className="text-muted-foreground"> · </span>
        <span className="font-medium text-[color:var(--success)]">
          {headcounts.confirmedHeadcount} attending
        </span>
      </p>
      {headcounts.pendingRecords > 0 ? (
        <p className="text-xs text-muted-foreground">{headcounts.pendingRecords} RSVP pending</p>
      ) : null}
    </div>
  );
}
