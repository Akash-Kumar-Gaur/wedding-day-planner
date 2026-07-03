import { useMemo, useState } from "react";
import { Check, MapPin, Shirt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TimelineEvent } from "@/data/wedding-types";
import { formatLongDate, formatShortDate } from "@/lib/lead-time-dates";
import { formatDisplayTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

export function TimelineDayTabs({
  weddingDays,
  eventsByDate,
  tabLabel,
  readOnly = false,
  onOpenEvent,
  onToggleDone,
}: {
  weddingDays: string[];
  eventsByDate: Record<string, TimelineEvent[]>;
  tabLabel: (date: string, index: number) => string;
  readOnly?: boolean;
  onOpenEvent?: (event: TimelineEvent) => void;
  onToggleDone?: (id: string, done: boolean) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(weddingDays[0] ?? "");

  const dayEvents = useMemo(
    () => eventsByDate[selectedDate] ?? [],
    [eventsByDate, selectedDate],
  );

  const complete = dayEvents.filter((e) => e.done).length;
  const total = dayEvents.length;
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
  const selectedDayIndex = weddingDays.indexOf(selectedDate);

  if (!weddingDays.length) {
    return (
      <Card className="rounded-2xl border-dashed p-6 text-center">
        <p className="font-serif text-lg text-foreground">Set your wedding dates</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a start and end date during setup to see your day-by-day timeline.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="day-tabs-scroll mb-2 flex gap-2 pb-1">
        {weddingDays.map((date, index) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selectedDate === date
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {tabLabel(date, index)}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-base leading-snug text-foreground">
            {selectedDayIndex >= 0
              ? tabLabel(selectedDate, selectedDayIndex)
              : formatLongDate(selectedDate)}
          </p>
          {total > 0 ? (
            <p className="shrink-0 text-xs text-muted-foreground">
              {complete} of {total} done
            </p>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "event" : "events"}
        </p>
        {total > 0 ? <Progress value={pct} className="mt-2 h-2 bg-secondary" /> : null}
      </Card>

      <ol className="relative space-y-3 pl-6">
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
            <Card
              className={cn(
                "rounded-2xl p-4",
                !readOnly && onOpenEvent && "cursor-pointer transition-opacity hover:bg-muted/30",
                e.done && "opacity-70",
              )}
              onClick={readOnly ? undefined : () => onOpenEvent?.(e)}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-primary">
                    {formatDisplayTime(e.time)}
                    {e.eventDate ? ` · ${formatShortDate(e.eventDate)}` : ""}
                  </p>
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
                      <MapPin className="h-3 w-3" /> {e.venue || "Add venue"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Shirt className="h-3 w-3" /> {e.dressCode}
                    </span>
                  </div>
                </div>
                {!readOnly && onToggleDone ? (
                  <label
                    className="mt-1 inline-flex cursor-pointer items-center"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={e.done}
                      onChange={(ev) => onToggleDone(e.id, ev.target.checked)}
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
                ) : null}
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
