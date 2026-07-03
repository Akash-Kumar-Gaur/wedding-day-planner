import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Shirt, Check, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/app-shell";
import { LEAD_TIME_LABELS, type LeadTime } from "@/data/checklist-templates";
import { useWeddingPlan } from "@/lib/wedding-plan-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist — ShadiPlan" },
      { name: "description", content: "Day-by-day timeline of every ceremony, with venues and dress codes." },
      { property: "og:title", content: "Checklist — ShadiPlan" },
      { property: "og:description", content: "Multi-day wedding timeline, ceremony by ceremony." },
    ],
  }),
  component: ChecklistScreen,
});

const DAYS = [1, 2, 3, 4] as const;
const LEAD_ORDER: LeadTime[] = ["12mo", "9mo", "6mo", "3mo", "1mo", "1wk"];

function ChecklistScreen() {
  const {
    timelineEvents,
    commonlyMissedTasks,
    planningTasks,
    hasPlan,
    toggleTimelineDone,
    toggleCommonlyMissedDone,
    togglePlanningDone,
  } = useWeddingPlan();

  const [day, setDay] = useState<(typeof DAYS)[number]>(1);

  const dayEvents = useMemo(
    () => timelineEvents.filter((e) => e.day === day),
    [timelineEvents, day],
  );
  const total = dayEvents.length;
  const complete = dayEvents.filter((e) => e.done).length;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);

  const missedComplete = commonlyMissedTasks.filter((t) => t.done).length;
  const missedTotal = commonlyMissedTasks.length;

  const planningByLead = useMemo(() => {
    const groups = new Map<LeadTime, typeof planningTasks>();
    for (const lead of LEAD_ORDER) {
      const items = planningTasks.filter((t) => !t.commonlyMissed && t.leadTime === lead);
      if (items.length) groups.set(lead, items);
    }
    return groups;
  }, [planningTasks]);

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Checklist">
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                  day === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                Day {d}
              </button>
            ))}
          </div>
          {!hasPlan ? (
            <Link to="/plan">
              <Button size="sm" variant="outline" className="shrink-0 text-xs">
                Set up
              </Button>
            </Link>
          ) : null}
        </div>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        {!hasPlan ? (
          <Card className="rounded-2xl border-dashed p-5 text-center">
            <p className="font-serif text-lg text-foreground">No checklist yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalize by tradition to surface tasks first-time planners often miss.
            </p>
            <Link to="/plan" className="mt-4 inline-block">
              <Button>Build my checklist</Button>
            </Link>
          </Card>
        ) : null}

        {commonlyMissedTasks.length > 0 ? (
          <section>
            <Card className="rounded-2xl border-[color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] p-4">
              <div className="mb-3 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:oklch(0.42_0.13_65)]" />
                <div>
                  <p className="font-serif text-base text-foreground">Easy to miss</p>
                  <p className="text-xs text-muted-foreground">
                    {missedComplete} of {missedTotal} handled — these trip up even experienced families
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {commonlyMissedTasks.map((item) => (
                  <MissedTaskRow
                    key={item.id}
                    task={item.task}
                    meta={LEAD_TIME_LABELS[item.leadTime as LeadTime] ?? item.leadTime}
                    reason={item.reason}
                    done={item.done}
                    onToggle={(done) => toggleCommonlyMissedDone(item.id, done)}
                  />
                ))}
              </ul>
            </Card>
          </section>
        ) : null}

        {planningByLead.size > 0 ? (
          <section className="space-y-3">
            <h2 className="px-1 font-serif text-lg text-foreground">Pre-wedding planning</h2>
            {[...planningByLead.entries()].map(([lead, tasks]) => (
              <Card key={lead} className="rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {LEAD_TIME_LABELS[lead]}
                </p>
                <ul className="mt-2 space-y-2">
                  {tasks.map((item) => (
                    <MissedTaskRow
                      key={item.id}
                      task={item.task}
                      meta={item.category}
                      done={item.done}
                      onToggle={(done) => togglePlanningDone(item.id, done)}
                    />
                  ))}
                </ul>
              </Card>
            ))}
          </section>
        ) : null}

        <section>
          <Card className="rounded-2xl p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-lg text-foreground">Day {day}</p>
              <p className="text-xs text-muted-foreground">
                {complete} of {total} done
              </p>
            </div>
            <Progress value={pct} className="mt-2 h-2 bg-secondary" />
          </Card>

          <ol className="relative mt-3 space-y-3 pl-6">
            <span className="absolute bottom-2 left-2 top-2 w-px bg-border" aria-hidden />
            {dayEvents.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[19px] top-4 grid h-4 w-4 place-items-center rounded-full border-2",
                    e.done
                      ? "border-[color:var(--success)] bg-[color:var(--success)]"
                      : "border-border bg-background",
                  )}
                >
                  {e.done ? (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  ) : null}
                </span>
                <Card className={cn("rounded-2xl p-4 transition-opacity", e.done && "opacity-70")}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-primary">{e.time}</p>
                      <p
                        className={cn(
                          "mt-1 font-serif text-base leading-snug text-foreground",
                          e.done && "line-through decoration-1",
                        )}
                      >
                        {e.name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {e.venue}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Shirt className="h-3 w-3" /> {e.dressCode}
                        </span>
                      </div>
                    </div>
                    <label className="mt-1 inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={e.done}
                        onChange={(ev) => toggleTimelineDone(e.id, ev.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-md border transition-colors",
                          e.done
                            ? "border-[color:var(--success)] bg-[color:var(--success)] text-primary-foreground"
                            : "border-border bg-background",
                        )}
                      >
                        {e.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                    </label>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}

function MissedTaskRow({
  task,
  meta,
  reason,
  done,
  onToggle,
}: {
  task: string;
  meta: string;
  reason?: string;
  done: boolean;
  onToggle: (done: boolean) => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-background/70 p-3">
      <label className="mt-0.5 inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => onToggle(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-md border transition-colors",
            done
              ? "border-[color:var(--success)] bg-[color:var(--success)] text-primary-foreground"
              : "border-border bg-background",
          )}
        >
          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
      </label>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-foreground", done && "line-through opacity-70")}>{task}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meta}</p>
        {reason ? <p className="mt-1 text-xs text-muted-foreground">{reason}</p> : null}
      </div>
    </li>
  );
}
