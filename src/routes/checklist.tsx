import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Shirt, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScreenHeader } from "@/components/app-shell";
import { timelineEvents } from "@/data/wedding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist — Wedding Ops" },
      { name: "description", content: "Day-by-day timeline of every ceremony, with venues and dress codes." },
      { property: "og:title", content: "Checklist — Wedding Ops" },
      { property: "og:description", content: "Multi-day wedding timeline, ceremony by ceremony." },
    ],
  }),
  component: ChecklistScreen,
});

const DAYS = [1, 2, 3, 4] as const;

function ChecklistScreen() {
  const [day, setDay] = useState<(typeof DAYS)[number]>(1);
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(timelineEvents.map((e) => [e.id, e.done])),
  );

  const dayEvents = useMemo(() => timelineEvents.filter((e) => e.day === day), [day]);
  const total = dayEvents.length;
  const complete = dayEvents.filter((e) => done[e.id]).length;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);

  return (
    <div>
      <ScreenHeader eyebrow="Wedding Ops" title="Checklist">
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        <Card className="rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-serif text-lg text-foreground">Day {day}</p>
            <p className="text-xs text-muted-foreground">
              {complete} of {total} done
            </p>
          </div>
          <Progress value={pct} className="mt-2 h-2 bg-secondary" />
        </Card>

        <ol className="relative space-y-3 pl-6">
          <span
            className="absolute bottom-2 left-2 top-2 w-px bg-border"
            aria-hidden
          />
          {dayEvents.map((e) => {
            const isDone = !!done[e.id];
            return (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[19px] top-4 grid h-4 w-4 place-items-center rounded-full border-2",
                    isDone
                      ? "border-[color:var(--success)] bg-[color:var(--success)]"
                      : "border-border bg-background",
                  )}
                >
                  {isDone ? (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  ) : null}
                </span>
                <Card
                  className={cn(
                    "rounded-2xl p-4 transition-opacity",
                    isDone && "opacity-70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-primary">
                        {e.time}
                      </p>
                      <p
                        className={cn(
                          "mt-1 font-serif text-base leading-snug text-foreground",
                          isDone && "line-through decoration-1",
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
                        checked={isDone}
                        onChange={(ev) => setDone((s) => ({ ...s, [e.id]: ev.target.checked }))}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-md border transition-colors",
                          isDone
                            ? "border-[color:var(--success)] bg-[color:var(--success)] text-primary-foreground"
                            : "border-border bg-background",
                        )}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                    </label>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>

        <div className="h-4" />
      </div>
    </div>
  );
}