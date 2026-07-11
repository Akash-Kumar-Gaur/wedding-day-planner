import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Plus, Shirt } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { TimelineEvent } from "@/data/wedding-types";
import { formatShortDate, distinctEventDates } from "@/lib/lead-time-dates";
import {
  deleteOutfitPlan,
  fetchOutfitPlans,
  OUTFIT_COLOR_PRESETS,
  OUTFIT_PERSON_PRESETS,
  type OutfitPlan,
  upsertOutfitPlan,
} from "@/lib/outfit-plans-api";
import { parseTimeToMinutes } from "@/lib/time-utils";
import { useWeddingData } from "@/lib/wedding-data";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/outfits")({
  head: () => ({
    meta: [
      { title: "Outfit planner — ShadiPlan" },
      { property: "og:title", content: "Outfit planner — ShadiPlan" },
    ],
  }),
  component: OutfitsScreen,
});

const CUSTOM_PERSON = "__custom__";

type EditTarget = {
  person: string;
  event: TimelineEvent;
  existing?: OutfitPlan;
};

function OutfitsScreen() {
  const { wedding, timelineEvents } = useWeddingData();
  const weddingId = wedding?.id;
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: weddingQueryKeys.outfitPlans(weddingId ?? ""),
    queryFn: () => fetchOutfitPlans(weddingId!),
    enabled: !!weddingId,
  });

  const [view, setView] = useState<"grid" | "clash">("clash");
  const [clashDate, setClashDate] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [people, setPeople] = useState<string[]>([...OUTFIT_PERSON_PRESETS]);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPerson, setNewPerson] = useState("");

  const plans = plansQuery.data ?? [];

  const eventDates = useMemo(() => distinctEventDates(timelineEvents), [timelineEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const date of eventDates) {
      map.set(
        date,
        timelineEvents
          .filter((e) => e.eventDate === date)
          .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)),
      );
    }
    return map;
  }, [timelineEvents, eventDates]);

  const activeClashDate = clashDate ?? eventDates[0] ?? null;

  const peopleFromPlans = useMemo(() => {
    const set = new Set(people);
    for (const p of plans) set.add(p.person);
    return [...set];
  }, [people, plans]);

  const planLookup = useMemo(() => {
    const map = new Map<string, OutfitPlan>();
    for (const p of plans) {
      map.set(`${p.person}::${p.timelineEventId}`, p);
    }
    return map;
  }, [plans]);

  const invalidate = () => {
    if (!weddingId) return;
    void queryClient.invalidateQueries({ queryKey: weddingQueryKeys.outfitPlans(weddingId) });
  };

  const upsertMutation = useMutation({
    mutationFn: (input: Parameters<typeof upsertOutfitPlan>[1]) => {
      if (!weddingId) throw new Error("No wedding");
      return upsertOutfitPlan(weddingId, input);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOutfitPlan(id),
    onSuccess: invalidate,
  });

  const clashOutfits = useMemo(() => {
    if (!activeClashDate) return [];
    const dayEvents = eventsByDate.get(activeClashDate) ?? [];
    const eventIds = new Set(dayEvents.map((e) => e.id));
    return plans
      .filter((p) => eventIds.has(p.timelineEventId) && p.color)
      .map((p) => ({
        plan: p,
        event: dayEvents.find((e) => e.id === p.timelineEventId)!,
      }))
      .filter((x) => x.event);
  }, [activeClashDate, eventsByDate, plans]);

  if (!wedding) return null;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Outfit planner">
        <p className="mt-1 text-sm text-muted-foreground">
          Plan looks per person and spot color clashes before the day.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={view === "clash" ? "default" : "outline"}
            onClick={() => setView("clash")}
          >
            Color clash
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => setView("grid")}
          >
            By event
          </Button>
        </div>

        {timelineEvents.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center">
            <Shirt className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Add timeline events first — outfits are planned per event.
            </p>
          </Card>
        ) : view === "clash" ? (
          <ClashView
            eventDates={eventDates}
            activeDate={activeClashDate}
            onSelectDate={setClashDate}
            outfits={clashOutfits}
            onEdit={(plan, event) =>
              setEditTarget({ person: plan.person, event, existing: plan })
            }
          />
        ) : (
          <GridView
            people={peopleFromPlans}
            eventsByDate={eventsByDate}
            planLookup={planLookup}
            onCellClick={(person, event, existing) =>
              setEditTarget({ person, event, existing })
            }
            onAddPerson={() => setAddPersonOpen(true)}
          />
        )}
      </div>

      <OutfitEditSheet
        target={editTarget}
        onClose={() => setEditTarget(null)}
        saving={upsertMutation.isPending || deleteMutation.isPending}
        onSave={async (input) => {
          await upsertMutation.mutateAsync(input);
          setEditTarget(null);
        }}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
          setEditTarget(null);
        }}
      />

      <Sheet open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <SheetContent side="bottom">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-xl">Add person</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Input
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              placeholder="e.g. Sister of Bride"
            />
            <Button
              className="w-full"
              disabled={!newPerson.trim()}
              onClick={() => {
                const name = newPerson.trim();
                if (!name) return;
                setPeople((prev) => (prev.includes(name) ? prev : [...prev, name]));
                setNewPerson("");
                setAddPersonOpen(false);
              }}
            >
              Add
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ClashView({
  eventDates,
  activeDate,
  onSelectDate,
  outfits,
  onEdit,
}: {
  eventDates: string[];
  activeDate: string | null;
  onSelectDate: (date: string) => void;
  outfits: { plan: OutfitPlan; event: TimelineEvent }[];
  onEdit: (plan: OutfitPlan, event: TimelineEvent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="selectable-scroll flex gap-2 overflow-x-auto pb-1">
        {eventDates.map((date, i) => (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeDate === date
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50",
            )}
          >
            Day {i + 1} · {formatShortDate(date)}
          </button>
        ))}
      </div>

      {outfits.length === 0 ? (
        <Card className="rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No colored outfits for this day yet. Switch to “By event” and tap a cell to add looks.
          </p>
        </Card>
      ) : (
        <>
          <p className="px-1 text-xs text-muted-foreground">
            Side-by-side swatches — near-identical colors jump out immediately.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {outfits.map(({ plan, event }) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => onEdit(plan, event)}
                className="overflow-hidden rounded-2xl border border-border bg-card text-left transition-shadow hover:shadow-md"
              >
                <div
                  className="h-28 w-full border-b border-border"
                  style={{ backgroundColor: plan.color }}
                  aria-hidden
                />
                <div className="space-y-1 p-3">
                  <p className="text-sm font-medium text-foreground">{plan.person}</p>
                  <p className="truncate text-xs text-muted-foreground">{event.name}</p>
                  {plan.outfitDescription ? (
                    <p className="line-clamp-2 text-xs text-foreground/80">{plan.outfitDescription}</p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GridView({
  people,
  eventsByDate,
  planLookup,
  onCellClick,
  onAddPerson,
}: {
  people: string[];
  eventsByDate: Map<string, TimelineEvent[]>;
  planLookup: Map<string, OutfitPlan>;
  onCellClick: (person: string, event: TimelineEvent, existing?: OutfitPlan) => void;
  onAddPerson: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" className="gap-1 text-primary" onClick={onAddPerson}>
          <Plus className="h-3.5 w-3.5" />
          Add person
        </Button>
      </div>

      {[...eventsByDate.entries()].map(([date, events], dayIndex) => (
        <section key={date}>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">
            Day {dayIndex + 1} · {formatShortDate(date)}
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden rounded-2xl p-0">
                <div className="border-b border-border bg-muted/40 px-4 py-2">
                  <p className="text-sm font-medium text-foreground">{event.name}</p>
                </div>
                <ul className="divide-y divide-border">
                  {people.map((person) => {
                    const existing = planLookup.get(`${person}::${event.id}`);
                    return (
                      <li key={person}>
                        <button
                          type="button"
                          onClick={() => onCellClick(person, event, existing)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                        >
                          <span
                            className={cn(
                              "h-8 w-8 shrink-0 rounded-full border border-border",
                              !existing?.color && "bg-muted",
                            )}
                            style={
                              existing?.color ? { backgroundColor: existing.color } : undefined
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground">{person}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {existing?.outfitDescription ||
                                existing?.jewellerOrDesigner ||
                                "Tap to add look"}
                            </span>
                          </span>
                          {existing ? (
                            <Badge variant="secondary" className="font-normal">
                              Set
                            </Badge>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function OutfitEditSheet({
  target,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  target: EditTarget | null;
  onClose: () => void;
  onSave: (input: {
    timelineEventId: string;
    person: string;
    outfitDescription?: string;
    color?: string;
    jewellerOrDesigner?: string;
    notes?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [personMode, setPersonMode] = useState<string>("");
  const [customPerson, setCustomPerson] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [designer, setDesigner] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = !!target;

  useEffect(() => {
    if (!target) return;
    const isPreset = (OUTFIT_PERSON_PRESETS as readonly string[]).includes(target.person);
    setPersonMode(isPreset ? target.person : CUSTOM_PERSON);
    setCustomPerson(isPreset ? "" : target.person);
    setDescription(target.existing?.outfitDescription ?? "");
    setColor(target.existing?.color ?? "");
    setDesigner(target.existing?.jewellerOrDesigner ?? "");
    setNotes(target.existing?.notes ?? "");
    setError(null);
  }, [target]);

  const resolvedPerson =
    personMode === CUSTOM_PERSON ? customPerson.trim() : personMode.trim() || target?.person || "";

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="bottom">
        {target ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {target.event.name}
              </p>
              <SheetTitle className="font-serif text-2xl">Outfit details</SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label>Person</Label>
                <Select value={personMode || target.person} onValueChange={setPersonMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTFIT_PERSON_PRESETS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_PERSON}>Custom…</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {personMode === CUSTOM_PERSON ? (
                <div className="space-y-2">
                  <Label>Custom name</Label>
                  <Input value={customPerson} onChange={(e) => setCustomPerson(e.target.value)} />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {OUTFIT_COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => setColor(c.hex)}
                      className={cn(
                        "h-9 w-full rounded-lg border-2 transition-transform",
                        color === c.hex
                          ? "scale-105 border-primary ring-2 ring-primary/30"
                          : "border-border",
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#hex or leave blank"
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Outfit description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Red lehenga with gold border"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Jeweller / designer</Label>
                <Input
                  value={designer}
                  onChange={(e) => setDesigner(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

              <Button
                className="w-full"
                disabled={saving}
                onClick={async () => {
                  if (!resolvedPerson) {
                    setError("Person is required");
                    return;
                  }
                  setError(null);
                  await onSave({
                    timelineEventId: target.event.id,
                    person: resolvedPerson,
                    outfitDescription: description || undefined,
                    color: color || undefined,
                    jewellerOrDesigner: designer || undefined,
                    notes: notes || undefined,
                  });
                }}
              >
                {saving ? "Saving…" : "Save outfit"}
              </Button>

              {target.existing ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[color:var(--destructive)]"
                  disabled={saving}
                  onClick={() => void onDelete(target.existing!.id)}
                >
                  Remove outfit
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
