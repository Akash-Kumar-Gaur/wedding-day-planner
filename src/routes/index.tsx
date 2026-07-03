import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  CalendarClock,
  Users,
  Store,
  AlertCircle,
  ChevronRight,
  Camera,
  Utensils,
  Sparkles,
  Music,
  Bus,
  Shirt,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScreenHeader, StatusBadge } from "@/components/app-shell";
import {
  WEDDING,
  daysUntilWedding,
  vendors,
  guests,
  budgetCategories,
  timelineEvents,
  formatINR,
  daysUntil,
} from "@/data/wedding";

export const Route = createFileRoute("/")({
  component: Index,
});

const CATEGORY_ICON: Record<string, typeof Camera> = {
  Venue: Building2,
  Catering: Utensils,
  Photography: Camera,
  Decor: Sparkles,
  Music: Music,
  Transport: Bus,
  Attire: Shirt,
  Other: Store,
};

function Index() {
  const days = daysUntilWedding();
  const paymentsDue = vendors.filter(
    (v) => v.status !== "Paid" && v.totalCost > v.advancePaid,
  ).length;
  const totalSpent = budgetCategories.reduce((s, c) => s + c.actual, 0);
  const pct = Math.min(100, Math.round((totalSpent / WEDDING.totalBudget) * 100));

  const upcomingVendors = vendors
    .filter((v) => v.status !== "Paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 2);
  const upcomingEvents = timelineEvents.filter((e) => !e.done).slice(0, 2);

  return (
    <div>
      <ScreenHeader eyebrow={WEDDING.location} title={WEDDING.coupleNames}>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Wedding ops · 4 days, 3 venues
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        <Card className="overflow-hidden rounded-2xl border-0 bg-primary p-6 text-primary-foreground shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] opacity-75">Counting down</p>
              <p className="mt-3 font-serif text-5xl leading-none">{days}</p>
              <p className="mt-2 text-sm opacity-90">days until the big day</p>
            </div>
            <div className="rounded-full bg-primary-foreground/15 p-2.5">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs opacity-80">
            Saturday, 14 November 2026 · The Leela Palace, Udaipur
          </p>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Store} label="Vendors" value={vendors.length.toString()} />
          <StatTile icon={Users} label="Guests" value={guests.length.toString()} />
          <StatTile
            icon={AlertCircle}
            label="Due soon"
            value={paymentsDue.toString()}
            tone={paymentsDue > 0 ? "warning" : "neutral"}
          />
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-serif text-lg text-foreground">Next up</h2>
            <Link to="/checklist" className="text-xs font-medium text-primary">
              See all
            </Link>
          </div>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {upcomingVendors.map((v) => {
              const Icon = CATEGORY_ICON[v.category] ?? Store;
              const due = daysUntil(v.dueDate);
              return (
                <Link
                  key={v.id}
                  to="/vendors"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Balance {formatINR(v.totalCost - v.advancePaid)} · due in {due}d
                    </p>
                  </div>
                  <StatusBadge status={v.status === "Confirmed" ? "done" : "pending"} />
                </Link>
              );
            })}
            {upcomingEvents.map((e) => (
              <Link
                key={e.id}
                to="/checklist"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Day {e.day} · {e.time} · {e.venue}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </Card>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-serif text-lg text-foreground">Budget</h2>
            <Link to="/wallet" className="text-xs font-medium text-primary">
              Details
            </Link>
          </div>
          <Card className="rounded-2xl p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-2xl text-foreground">{formatINR(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">of {formatINR(WEDDING.totalBudget)}</p>
            </div>
            <Progress value={pct} className="mt-3 h-2 bg-secondary" />
            <p className="mt-2 text-xs text-muted-foreground">{pct}% of total budget committed</p>
          </Card>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof Store;
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <Card className="rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <div
          className={
            tone === "warning"
              ? "grid h-7 w-7 place-items-center rounded-full bg-[color-mix(in_oklab,var(--warning)_25%,transparent)] text-[color:oklch(0.42_0.13_65)]"
              : "grid h-7 w-7 place-items-center rounded-full bg-secondary text-secondary-foreground"
          }
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 font-serif text-2xl leading-none text-foreground">{value}</p>
    </Card>
  );
}