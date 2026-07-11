import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Printer, Share2 } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TimelineEvent } from "@/data/wedding-types";
import { fetchEventSongs, groupSongsByMoment } from "@/lib/event-songs-api";
import { dateTabLabel, distinctEventDates } from "@/lib/lead-time-dates";
import { formatDisplayTime, parseTimeToMinutes } from "@/lib/time-utils";
import { useWeddingData } from "@/lib/wedding-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/run-sheet")({
  head: () => ({
    meta: [
      { title: "Run sheet — ShadiPlan" },
      { property: "og:title", content: "Run sheet — ShadiPlan" },
    ],
  }),
  component: RunSheetScreen,
});

function RunSheetScreen() {
  const { wedding, timelineEvents } = useWeddingData();
  const eventDates = useMemo(() => distinctEventDates(timelineEvents), [timelineEvents]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const activeDate = selectedDate ?? eventDates[0] ?? null;

  const dayEvents = useMemo(() => {
    if (!activeDate) return [];
    return timelineEvents
      .filter((e) => e.eventDate === activeDate)
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [timelineEvents, activeDate]);

  const songsQuery = useQuery({
    queryKey: ["run-sheet-songs", dayEvents.map((e) => e.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        dayEvents.map(async (event) => [event.id, await fetchEventSongs(event.id)] as const),
      );
      return Object.fromEntries(entries) as Record<string, Awaited<ReturnType<typeof fetchEventSongs>>>;
    },
    enabled: dayEvents.length > 0,
  });

  const songsByEvent = songsQuery.data ?? {};

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const text = buildPlainTextRunSheet(
      wedding?.coupleNames ?? "Wedding",
      activeDate,
      dayEvents,
      songsByEvent,
    );
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Run sheet — ${wedding?.coupleNames ?? "Wedding"}`,
          text,
        });
        return;
      } catch {
        // fall through
      }
    }
    await navigator.clipboard.writeText(text);
  };

  if (!wedding) return null;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Run sheet">
        <p className="mt-1 text-sm text-muted-foreground print:hidden">
          Minute-by-minute schedule for vendors and coordinators.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        <div className="selectable-scroll flex gap-2 overflow-x-auto pb-1 print:hidden">
          {eventDates.map((date, i) => (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                activeDate === date
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {dateTabLabel(date, i)}
            </button>
          ))}
        </div>

        {dayEvents.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">No events on this day.</p>
          </Card>
        ) : (
          <div className="run-sheet-print space-y-1">
            <div className="mb-4 hidden print:block">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Run sheet</p>
              <h1 className="font-serif text-2xl text-foreground">{wedding.coupleNames}</h1>
              <p className="text-sm text-muted-foreground">
                {activeDate
                  ? dateTabLabel(activeDate, eventDates.indexOf(activeDate))
                  : null}{" "}
                · {wedding.location}
              </p>
            </div>

            <ol className="space-y-0 divide-y divide-border rounded-2xl border border-border bg-card">
              {dayEvents.map((event) => {
                const songs = songsByEvent[event.id] ?? [];
                const grouped = groupSongsByMoment(songs);
                return (
                  <li key={event.id} className="px-4 py-3">
                    <div className="flex gap-3">
                      <p className="w-20 shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatDisplayTime(event.time) || "TBC"}
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.venue || "Venue TBC"}
                          {event.dressCode ? ` · ${event.dressCode}` : ""}
                        </p>
                        {grouped.length > 0 ? (
                          <ul className="mt-2 space-y-1.5 border-l-2 border-border pl-3">
                            {grouped.map(({ moment, songs: momentSongs }) => (
                              <li key={moment}>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  {moment}
                                </p>
                                {momentSongs.map((s) => (
                                  <p key={s.id} className="text-xs text-foreground">
                                    {s.songName}
                                    {s.artist ? ` — ${s.artist}` : ""}
                                  </p>
                                ))}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="flex gap-2 print:hidden">
          <Button
            className="flex-1 gap-2"
            variant="outline"
            disabled={dayEvents.length === 0}
            onClick={() => void handleShare()}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={dayEvents.length === 0}
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildPlainTextRunSheet(
  coupleNames: string,
  date: string | null,
  events: TimelineEvent[],
  songsByEvent: Record<string, Awaited<ReturnType<typeof fetchEventSongs>>>,
): string {
  const lines = [`${coupleNames} — Run sheet`, date ?? "", ""];
  for (const event of events) {
    lines.push(
      `${formatDisplayTime(event.time) || "TBC"} — ${event.name} — ${event.venue || "Venue TBC"}`,
    );
    const songs = songsByEvent[event.id] ?? [];
    for (const group of groupSongsByMoment(songs)) {
      lines.push(`  ${group.moment}:`);
      for (const s of group.songs) {
        lines.push(`    • ${s.songName}${s.artist ? ` — ${s.artist}` : ""}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
