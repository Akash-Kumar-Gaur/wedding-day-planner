import { BedDouble, Car, Drumstick, Leaf, MailPlus, Sprout } from "lucide-react";
import { StatusBadge } from "@/components/app-shell";
import type { Guest, MealPref } from "@/data/wedding-types";
import { cn } from "@/lib/utils";

function MealMeta({ meal }: { meal: MealPref }) {
  const config =
    meal === "Non-veg"
      ? { icon: Drumstick, label: "Non-veg" }
      : meal === "Jain"
        ? { icon: Sprout, label: "Jain" }
        : { icon: Leaf, label: "Veg" };
  const Icon = config.icon;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{config.label}</span>
    </span>
  );
}

export function GuestRow({
  guest,
  onOpen,
  onInvite,
  readOnly = false,
}: {
  guest: Guest;
  onOpen?: () => void;
  onInvite?: () => void;
  readOnly?: boolean;
}) {
  const initials = guest.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        !readOnly && "transition-colors hover:bg-muted/40",
      )}
    >
      {readOnly ? (
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <GuestRowContent guest={guest} initials={initials} />
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <GuestRowContent guest={guest} initials={initials} />
        </button>
      )}
      <div className="flex shrink-0 flex-col items-end justify-center gap-2">
        <StatusBadge
          status={
            guest.rsvp === "Confirmed" ? "done" : guest.rsvp === "Declined" ? "declined" : "pending"
          }
        />
        {!readOnly && onInvite ? (
          <button
            type="button"
            aria-label={`Create invite for ${guest.name}`}
            onClick={onInvite}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <MailPlus className="h-4 w-4" />
          </button>
        ) : readOnly ? (
          <div
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground/50"
            aria-hidden
          >
            <MailPlus className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GuestRowContent({ guest, initials }: { guest: Guest; initials: string }) {
  return (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[15px] font-medium leading-tight text-foreground">
            {guest.name}
          </p>
          {guest.accompanyingCount > 0 ? (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{guest.accompanyingCount}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-[10px] text-xs text-muted-foreground">
          <MealMeta meal={guest.meal} />
          {guest.accommodation ? (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
              <BedDouble className="h-3 w-3 shrink-0" aria-hidden />
              <span>Room</span>
            </span>
          ) : null}
          {guest.transportNeeded ? (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
              <Car className="h-3 w-3 shrink-0" aria-hidden />
              <span>Transport</span>
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
