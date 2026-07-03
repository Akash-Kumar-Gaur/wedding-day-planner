import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { computeGuestHeadcounts } from "@/lib/guest-headcount";
import { useWeddingData } from "@/lib/wedding-data";

export function CateringHeadcountNote({ compact = false }: { compact?: boolean }) {
  const { guests } = useWeddingData();
  const { confirmedHeadcount, maxHeadcount } = useMemo(
    () => computeGuestHeadcounts(guests),
    [guests],
  );

  if (compact) {
    return (
      <p className="mt-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">{confirmedHeadcount} confirmed attending</span>
        {" · "}
        up to {maxHeadcount} if all RSVP yes
      </p>
    );
  }

  return (
    <Card className="rounded-2xl border-dashed bg-secondary/30 p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Guest headcount</p>
      <p className="mt-1 font-serif text-xl text-foreground">{confirmedHeadcount} confirmed attending</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Up to {maxHeadcount} if everyone RSVPs yes — use this when locking plates with your caterer.
      </p>
    </Card>
  );
}
