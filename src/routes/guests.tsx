import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Leaf, Drumstick, BedDouble, Bus, Phone, Mail, StickyNote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScreenHeader, StatusBadge } from "@/components/app-shell";
import { guests as guestsData, guestGroups, type Guest, type RsvpStatus } from "@/data/wedding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/guests")({
  head: () => ({
    meta: [
      { title: "Guests — Wedding Ops" },
      { name: "description", content: "Track RSVPs, meal preferences, and accommodation for every wedding guest." },
      { property: "og:title", content: "Guests — Wedding Ops" },
      { property: "og:description", content: "Guest list, RSVPs and logistics in one place." },
    ],
  }),
  component: GuestsScreen,
});

type Filter = "all" | RsvpStatus;

function GuestsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openGuest, setOpenGuest] = useState<Guest | null>(null);

  const total = guestsData.length;
  const confirmed = guestsData.filter((g) => g.rsvp === "Confirmed").length;
  const pending = guestsData.filter((g) => g.rsvp === "Pending").length;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return guestsData.filter((g) => {
      if (filter !== "all" && g.rsvp !== filter) return false;
      if (query && !g.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filter, q]);

  const grouped = useMemo(() => {
    return guestGroups
      .map((group) => ({ group, members: filtered.filter((g) => g.groupId === group.id) }))
      .filter((x) => x.members.length > 0);
  }, [filtered]);

  return (
    <div>
      <ScreenHeader eyebrow="Wedding Ops" title="Guests">
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Invited" value={total} />
          <MiniStat label="Confirmed" value={confirmed} tone="good" />
          <MiniStat label="Pending" value={pending} tone="warn" />
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guests"
            className="h-10 rounded-full border-border bg-secondary/60 pl-9 text-sm"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip active={filter === "Pending"} onClick={() => setFilter("Pending")}>RSVP pending</Chip>
          <Chip active={filter === "Confirmed"} onClick={() => setFilter("Confirmed")}>Confirmed</Chip>
          <Chip active={filter === "Declined"} onClick={() => setFilter("Declined")}>Declined</Chip>
        </div>
      </ScreenHeader>

      <div className="space-y-6 px-5 pt-5">
        {grouped.map(({ group, members }) => (
          <section key={group.id}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="font-serif text-lg text-foreground">{group.name}</h2>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {group.side} side
              </span>
            </div>
            <Card className="divide-y divide-border rounded-2xl p-0">
              {members.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setOpenGuest(g)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {g.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {g.meal === "Non-veg" ? (
                        <Drumstick className="h-3 w-3" />
                      ) : (
                        <Leaf className="h-3 w-3" />
                      )}
                      <span>{g.meal}</span>
                      {g.accommodation ? (
                        <span className="inline-flex items-center gap-0.5">
                          <BedDouble className="h-3 w-3" /> Room
                        </span>
                      ) : null}
                      {g.transportNeeded ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Bus className="h-3 w-3" /> Transport
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <StatusBadge
                    status={
                      g.rsvp === "Confirmed" ? "done" : g.rsvp === "Declined" ? "declined" : "pending"
                    }
                  />
                </button>
              ))}
            </Card>
          </section>
        ))}

        {grouped.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">No guests match.</p>
        ) : null}

        <div className="h-4" />
      </div>

      <GuestSheet guest={openGuest} onClose={() => setOpenGuest(null)} />
    </div>
  );
}

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "good" | "warn" }) {
  const color =
    tone === "good"
      ? "text-[color:var(--success)]"
      : tone === "warn"
        ? "text-[color:oklch(0.42_0.13_65)]"
        : "text-foreground";
  return (
    <div className="rounded-xl bg-secondary/60 px-2 py-2">
      <p className={cn("font-serif text-xl leading-none", color)}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function GuestSheet({ guest, onClose }: { guest: Guest | null; onClose: () => void }) {
  const group = guest ? guestGroups.find((g) => g.id === guest.groupId) : null;
  return (
    <Sheet open={!!guest} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        {guest ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {group?.name} · {group?.side} side
              </p>
              <SheetTitle className="font-serif text-2xl">{guest.name}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-4 text-sm">
              <Card className="space-y-3 rounded-2xl p-4">
                {guest.phone ? (
                  <Row icon={Phone} label="Phone" value={guest.phone} />
                ) : null}
                {guest.email ? (
                  <Row icon={Mail} label="Email" value={guest.email} />
                ) : null}
                <Row
                  icon={guest.meal === "Non-veg" ? Drumstick : Leaf}
                  label="Meal preference"
                  value={guest.meal}
                />
                <Row
                  icon={BedDouble}
                  label="Accommodation"
                  value={guest.accommodation ? "Room assigned" : "Not required"}
                />
                <Row
                  icon={Bus}
                  label="Transport"
                  value={guest.transportNeeded ? "Airport pickup" : "Not required"}
                />
              </Card>

              {guest.notes ? (
                <Card className="rounded-2xl p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                    <StickyNote className="h-3 w-3" /> Notes
                  </div>
                  <p className="text-sm text-foreground">{guest.notes}</p>
                </Card>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}