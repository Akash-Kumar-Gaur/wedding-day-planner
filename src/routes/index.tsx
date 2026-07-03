import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScreenHeader, StatusBadge } from "@/components/app-shell";
import { SetBudgetSheet } from "@/components/set-budget-sheet";
import { TimelineCreateSheet } from "@/components/timeline-create-sheet";
import {
  daysUntilWedding,
  formatINR,
  daysUntil,
  formatDate,
} from "@/data/wedding";
import { useWeddingPlan } from "@/lib/wedding-plan-store";
import { useWeddingData } from "@/lib/wedding-data";
import { formatShortDate } from "@/lib/lead-time-dates";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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

function sortTimelineEvents<T extends { eventDate: string; time: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const byDate = a.eventDate.localeCompare(b.eventDate);
    if (byDate !== 0) return byDate;
    return a.time.localeCompare(b.time);
  });
}

function Index() {
  const { wedding, vendors, guests, budgetCategories, timelineEvents, createTimelineEvent } =
    useWeddingData();
  const { hasPlan } = useWeddingPlan();
  const { signOut } = useAuth();
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = useMemo(() => {
    const sorted = sortTimelineEvents(timelineEvents);
    const incomplete = sorted.filter((e) => !e.done);
    const upcoming = incomplete.filter((e) => e.eventDate >= today);
    if (upcoming.length > 0) return upcoming.slice(0, 2);
    if (incomplete.length > 0) return incomplete.slice(0, 2);
    return sorted.slice(0, 2);
  }, [timelineEvents, today]);

  if (!wedding) {
    return null;
  }

  const days = daysUntilWedding(wedding.date);
  const paymentsDue = vendors.filter(
    (v) => v.status !== "Paid" && v.totalCost > v.advancePaid,
  ).length;
  const totalSpent = budgetCategories.reduce((s, c) => s + c.actual, 0);
  const hasBudget = wedding.totalBudget != null && wedding.totalBudget > 0;
  const pct = hasBudget
    ? Math.min(100, Math.round((totalSpent / wedding.totalBudget!) * 100))
    : 0;

  const upcomingVendors = vendors
    .filter((v) => v.status !== "Paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 2);

  const showAddEventPrompt = timelineEvents.length === 0;
  const hasNextUpItems = upcomingVendors.length > 0 || upcomingEvents.length > 0;

  return (
    <div>
      <ScreenHeader eyebrow={wedding.location} title={wedding.coupleNames}>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {wedding.location || "Your wedding"}
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
            {wedding.endDate && wedding.endDate !== wedding.date
              ? `${formatDate(wedding.date)} – ${formatDate(wedding.endDate)}`
              : formatDate(wedding.date)}{" "}
            · {wedding.location}
          </p>
        </Card>

        {!hasPlan ? (
          <Card className="rounded-2xl border-dashed p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-lg text-foreground">Smart checklist</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get tradition-specific tasks and commonly missed items before they become crises.
                </p>
              </div>
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            </div>
            <Link to="/plan" className="mt-4 inline-block">
              <Button size="sm">Personalize plan</Button>
            </Link>
          </Card>
        ) : null}

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
            {!showAddEventPrompt ? (
              <Link to="/checklist" className="text-xs font-medium text-primary">
                See all
              </Link>
            ) : null}
          </div>
          {showAddEventPrompt ? (
            <Card className="rounded-2xl border-dashed p-5">
              <p className="font-serif text-lg text-foreground">Nothing planned yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first event to get started.
              </p>
              <Button className="mt-4" size="sm" onClick={() => setAddEventOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add event
              </Button>
            </Card>
          ) : hasNextUpItems ? (
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
                      {formatShortDate(e.eventDate)} · {e.time} · {e.venue}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </Card>
          ) : null}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-serif text-lg text-foreground">Budget</h2>
            {hasBudget ? (
              <Link to="/wallet" className="text-xs font-medium text-primary">
                Details
              </Link>
            ) : null}
          </div>
          {hasBudget ? (
            <Card className="rounded-2xl p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-2xl text-foreground">{formatINR(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">of {formatINR(wedding.totalBudget!)}</p>
              </div>
              <Progress value={pct} className="mt-3 h-2 bg-secondary" />
              <p className="mt-2 text-xs text-muted-foreground">{pct}% of total budget committed</p>
            </Card>
          ) : (
            <Card className="rounded-2xl border-dashed p-5">
              <p className="text-sm text-muted-foreground">
                Set your total budget to start tracking.
              </p>
              <Button className="mt-4" size="sm" variant="outline" onClick={() => setBudgetSheetOpen(true)}>
                Set your budget
              </Button>
            </Card>
          )}
        </section>

        <button
          type="button"
          onClick={() => signOut()}
          className="mx-auto block pb-6 text-xs text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>

        <div className="h-4" />
      </div>

      <SetBudgetSheet open={budgetSheetOpen} onClose={() => setBudgetSheetOpen(false)} />
      <TimelineCreateSheet
        open={addEventOpen}
        defaultDate={wedding.date}
        onClose={() => setAddEventOpen(false)}
        onCreate={async (input) => {
          await createTimelineEvent(input);
          setAddEventOpen(false);
        }}
      />
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
