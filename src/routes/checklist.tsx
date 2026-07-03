import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MapPin,
  Shirt,
  Check,
  AlertTriangle,
  Calendar,
  Clock,
  Pencil,
  Search,
  ChevronDown,
  Plus,
  Shuffle,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CateringHeadcountNote } from "@/components/catering-headcount-note";
import { TimelineCreateSheet } from "@/components/timeline-create-sheet";
import { TimePicker } from "@/components/time-picker";
import { ScreenHeader } from "@/components/app-shell";
import { GetSuggestionsSheet } from "@/components/get-suggestions-sheet";
import { GetSuggestionsLink, SectionEmptyState } from "@/components/get-suggestions-prompt";
import type { CommonlyMissedTask, PlanningTask, TimelineEvent } from "@/data/wedding-types";
import {
  formatShortDate,
  formatLongDate,
  timelineDayDates,
  dateTabLabel,
} from "@/lib/lead-time-dates";
import { formatDisplayTime, normalizeTimeForStorage, toTimeInputValue } from "@/lib/time-utils";
import { isCateringHeadcountTask } from "@/lib/guest-headcount";
import { loadPlanAnswers } from "@/lib/plan-answers";
import { useWeddingPlan } from "@/lib/wedding-plan-store";
import { useWeddingData } from "@/lib/wedding-data";
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

const VIEW_STORAGE_KEY = "shadiplan-checklist-view";
type ChecklistView = "timeline" | "tasks" | "missed";

const VIEW_TABS: { id: ChecklistView; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "tasks", label: "Tasks" },
  { id: "missed", label: "Commonly missed" },
];

function loadSavedView(): ChecklistView {
  if (typeof window === "undefined") return "timeline";
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  if (saved === "tasks" || saved === "missed" || saved === "timeline") return saved;
  return "timeline";
}

function ChecklistScreen() {
  const {
    wedding,
    timelineEvents,
    setTimelineDone,
    updateTimelineEventDetails,
    createTimelineEvent,
    deletePlanningTaskById,
    createPlanningTask,
    addMoreCommonlyMissedTasks,
  } = useWeddingData();
  const {
    commonlyMissedTasks,
    planningTasks,
    tradition,
    toggleCommonlyMissedDone,
    togglePlanningDone,
    updatePlanningTaskDetails,
  } = useWeddingPlan();

  const [view, setView] = useState<ChecklistView>(loadSavedView);
  const weddingDays = useMemo(() => {
    if (!wedding?.date) return [];
    return timelineDayDates(wedding.date, wedding.endDate ?? wedding.date, timelineEvents);
  }, [wedding?.date, wedding?.endDate, timelineEvents]);
  const [selectedDate, setSelectedDate] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [openTask, setOpenTask] = useState<PlanningTask | null>(null);
  const [openEvent, setOpenEvent] = useState<TimelineEvent | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [createMissedOpen, setCreateMissedOpen] = useState(false);
  const [missedSuggestNonce, setMissedSuggestNonce] = useState(0);
  const [suggestingMore, setSuggestingMore] = useState(false);

  const planAnswers = useMemo(() => {
    if (!wedding?.id) return null;
    if (wedding.onboardingMode === "manual") return null;
    return loadPlanAnswers(wedding.id, tradition);
  }, [wedding?.id, wedding?.onboardingMode, tradition]);

  useEffect(() => {
    if (!selectedDate && weddingDays.length) {
      setSelectedDate(weddingDays[0]);
    } else if (selectedDate && weddingDays.length && !weddingDays.includes(selectedDate)) {
      setSelectedDate(weddingDays[0]);
    }
  }, [weddingDays, selectedDate]);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const dayEvents = useMemo(
    () => timelineEvents.filter((e) => e.eventDate === selectedDate),
    [timelineEvents, selectedDate],
  );
  const total = dayEvents.length;
  const complete = dayEvents.filter((e) => e.done).length;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    if (!q) return planningTasks;
    return planningTasks.filter(
      (t) =>
        t.task.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    );
  }, [planningTasks, taskSearch]);

  const tasksByCategory = useMemo(() => {
    const map = new Map<string, PlanningTask[]>();
    for (const task of filteredTasks) {
      const list = map.get(task.category) ?? [];
      list.push(task);
      map.set(task.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTasks]);

  const defaultOpenCategories = useMemo(
    () => tasksByCategory.slice(0, 2).map(([name]) => name),
    [tasksByCategory],
  );

  const tabLabel = (date: string, index: number) => dateTabLabel(date, index);

  const missedPending = commonlyMissedTasks.filter((t) => !t.done);
  const missedDone = commonlyMissedTasks.filter((t) => t.done);

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Checklist">
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-1 gap-1 rounded-full bg-secondary/60 p-1">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "flex-1 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors",
                  view === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        {view === "timeline" ? (
          <TimelineView
            weddingDays={weddingDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            tabLabel={tabLabel}
            dayEvents={dayEvents}
            complete={complete}
            total={total}
            pct={pct}
            onToggleDone={setTimelineDone}
            onOpenEvent={setOpenEvent}
            onAddEvent={() => setAddEventOpen(true)}
          />
        ) : null}

        {view === "tasks" ? (
          <TasksView
            taskSearch={taskSearch}
            onSearchChange={setTaskSearch}
            tasksByCategory={tasksByCategory}
            defaultOpenCategories={defaultOpenCategories}
            onToggleDone={togglePlanningDone}
            onEditTask={setOpenTask}
            onGetSuggestions={() => setSuggestionsOpen(true)}
          />
        ) : null}

        {view === "missed" ? (
          <MissedView
            pending={missedPending}
            completed={missedDone}
            suggestingMore={suggestingMore}
            onToggleDone={toggleCommonlyMissedDone}
            onRemove={(id) => deletePlanningTaskById(id)}
            onSuggestMore={async () => {
              setSuggestingMore(true);
              try {
                const nextNonce = missedSuggestNonce + 1;
                await addMoreCommonlyMissedTasks(planAnswers, nextNonce);
                setMissedSuggestNonce(nextNonce);
              } finally {
                setSuggestingMore(false);
              }
            }}
            onAddTask={() => setCreateMissedOpen(true)}
            onEditTask={(item) =>
              setOpenTask({
                id: item.id,
                task: item.task,
                leadTime: item.leadTime,
                category: item.category ?? "",
                done: item.done,
                commonlyMissed: true,
                suggestedDate: item.suggestedDate ?? "",
                eventTime: item.eventTime,
                venue: item.venue,
              })
            }
          />
        ) : null}

        <div className="h-4" />
      </div>

      <PlanningTaskSheet
        task={openTask}
        onClose={() => setOpenTask(null)}
        onSave={async (id, patch) => {
          await updatePlanningTaskDetails(id, patch);
          setOpenTask(null);
        }}
      />

      <TimelineEventSheet
        event={openEvent}
        onClose={() => setOpenEvent(null)}
        onSave={async (id, patch) => {
          await updateTimelineEventDetails(id, patch);
          setOpenEvent(null);
        }}
      />

      <TimelineCreateSheet
        open={addEventOpen}
        defaultDate={selectedDate || wedding?.date || ""}
        onClose={() => setAddEventOpen(false)}
        onCreate={async (input) => {
          await createTimelineEvent(input);
          setAddEventOpen(false);
          setSelectedDate(input.eventDate);
        }}
      />

      <CommonlyMissedCreateSheet
        open={createMissedOpen}
        defaultDate={wedding?.date ?? ""}
        onClose={() => setCreateMissedOpen(false)}
        onCreate={async (input) => {
          await createPlanningTask({
            task: input.task,
            leadTime: "1mo",
            category: "Other",
            commonlyMissed: true,
            done: false,
            suggestedDate: input.suggestedDate ?? "",
            eventTime: input.eventTime,
            venue: input.venue,
          });
          setCreateMissedOpen(false);
        }}
      />

      <GetSuggestionsSheet
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        title="Checklist suggestions"
        includeCommonlyMissed={false}
      />
    </div>
  );
}

function TimelineView({
  weddingDays,
  selectedDate,
  setSelectedDate,
  tabLabel,
  dayEvents,
  complete,
  total,
  pct,
  onToggleDone,
  onOpenEvent,
  onAddEvent,
}: {
  weddingDays: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  tabLabel: (date: string, index: number) => string;
  dayEvents: TimelineEvent[];
  complete: number;
  total: number;
  pct: number;
  onToggleDone: (id: string, done: boolean) => void;
  onOpenEvent: (e: TimelineEvent) => void;
  onAddEvent: () => void;
}) {
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

  const selectedDayIndex = weddingDays.indexOf(selectedDate);

  return (
    <section className="space-y-3">
      <div className="day-tabs-scroll flex gap-2 pb-1 mb-2">
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

      {dayEvents.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-6 text-center">
          <p className="font-serif text-lg text-foreground">
            Nothing planned for {formatLongDate(selectedDate)} yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add ceremonies and events for this day — nothing appears until you create it.
          </p>
          <Button className="mt-4" onClick={onAddEvent}>
            Add event
          </Button>
        </Card>
      ) : (
        <>
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
                "cursor-pointer rounded-2xl p-4 transition-opacity hover:bg-muted/30",
                e.done && "opacity-70",
              )}
              onClick={() => onOpenEvent(e)}
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
              </div>
            </Card>
          </li>
        ))}
        </ol>
        <button
          type="button"
          onClick={onAddEvent}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
        >
          <Plus className="h-4 w-4" />
          Add event
        </button>
        </>
      )}
    </section>
  );
}

function TasksView({
  taskSearch,
  onSearchChange,
  tasksByCategory,
  defaultOpenCategories,
  onToggleDone,
  onEditTask,
  onGetSuggestions,
}: {
  taskSearch: string;
  onSearchChange: (q: string) => void;
  tasksByCategory: [string, PlanningTask[]][];
  defaultOpenCategories: string[];
  onToggleDone: (id: string, done: boolean) => void;
  onEditTask: (task: PlanningTask) => void;
  onGetSuggestions: () => void;
}) {
  const isEmpty = tasksByCategory.length === 0;

  if (isEmpty && !taskSearch) {
    return (
      <SectionEmptyState
        title="No planning tasks yet"
        titleClassName="text-sm font-medium"
        description="Add tasks yourself or browse suggestions — nothing is added until you accept it."
        onGetSuggestions={onGetSuggestions}
      />
    );
  }

  if (isEmpty) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No tasks match your search.</p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={taskSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks"
          className="h-10 rounded-full border-border bg-secondary/60 pl-9 text-sm"
        />
      </div>

      <Accordion
        type="multiple"
        defaultValue={defaultOpenCategories}
        key={defaultOpenCategories.join(",")}
        className="space-y-2"
      >
        {tasksByCategory.map(([category, tasks]) => {
          const pending = tasks.filter((t) => !t.done);
          const completed = tasks.filter((t) => t.done);
          return (
            <AccordionItem
              key={category}
              value={category}
              className="overflow-hidden rounded-2xl border border-border bg-card px-4"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {category}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {tasks.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <CategoryTaskList
                  pending={pending}
                  completed={completed}
                  onToggleDone={onToggleDone}
                  onEditTask={onEditTask}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <div className="pt-1 text-center">
        <GetSuggestionsLink onClick={onGetSuggestions} />
      </div>
    </section>
  );
}

function CategoryTaskList({
  pending,
  completed,
  onToggleDone,
  onEditTask,
}: {
  pending: PlanningTask[];
  completed: PlanningTask[];
  onToggleDone: (id: string, done: boolean) => void;
  onEditTask: (task: PlanningTask) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <ul className="space-y-2">
      {pending.map((item) => (
        <TaskRow
          key={item.id}
          task={item.task}
          meta={item.category}
          date={item.suggestedDate}
          time={item.eventTime}
          venue={item.venue}
          done={item.done}
          onToggle={(done) => onToggleDone(item.id, done)}
          onEdit={() => onEditTask(item)}
          footer={isCateringHeadcountTask(item.task) ? <CateringHeadcountNote compact /> : undefined}
        />
      ))}
      {pending.length === 0 && completed.length > 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">All tasks in this category are done.</p>
      ) : null}
      {completed.length > 0 ? (
        <li>
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showCompleted && "rotate-180")}
            />
            Completed ({completed.length})
          </button>
          {showCompleted ? (
            <ul className="mt-2 space-y-2">
              {completed.map((item) => (
                <TaskRow
                  key={item.id}
                  task={item.task}
                  meta={item.category}
                  date={item.suggestedDate}
                  time={item.eventTime}
                  venue={item.venue}
                  done={item.done}
                  onToggle={(done) => onToggleDone(item.id, done)}
                  onEdit={() => onEditTask(item)}
                  footer={isCateringHeadcountTask(item.task) ? <CateringHeadcountNote compact /> : undefined}
                />
              ))}
            </ul>
          ) : null}
        </li>
      ) : null}
    </ul>
  );
}

function MissedView({
  pending,
  completed,
  suggestingMore,
  onToggleDone,
  onRemove,
  onSuggestMore,
  onAddTask,
  onEditTask,
}: {
  pending: CommonlyMissedTask[];
  completed: CommonlyMissedTask[];
  suggestingMore: boolean;
  onToggleDone: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
  onSuggestMore: () => Promise<void>;
  onAddTask: () => void;
  onEditTask: (item: CommonlyMissedTask) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const missedTotal = pending.length + completed.length;
  const missedComplete = completed.length;

  if (missedTotal === 0) {
    return (
      <section className="space-y-3">
        <Card className="rounded-2xl border-dashed p-6 text-center">
          <p className="font-serif text-lg text-foreground">Nothing here right now</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Suggest reminders from our pool or add your own — easy-to-forget items belong here.
          </p>
        </Card>
        <MissedViewActions
          suggestingMore={suggestingMore}
          onSuggestMore={onSuggestMore}
          onAddTask={onAddTask}
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <Card className="rounded-2xl border-[color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] p-4">
        <div className="mb-3 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:oklch(0.42_0.13_65)]" />
          <div>
            <p className="font-serif text-base text-foreground">Easy to miss</p>
            <p className="text-xs text-muted-foreground">
              {missedComplete} of {missedTotal} handled — remove anything that doesn&apos;t apply
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {pending.map((item) => (
            <TaskRow
              key={item.id}
              task={item.task}
              meta={item.leadTime}
              date={item.suggestedDate}
              time={item.eventTime}
              venue={item.venue}
              reason={item.reason}
              done={item.done}
              onToggle={(done) => onToggleDone(item.id, done)}
              onEdit={() => onEditTask(item)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
          {completed.length > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                className="flex w-full items-center gap-2 rounded-xl bg-background/70 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", showCompleted && "rotate-180")}
                />
                Completed ({completed.length})
              </button>
              {showCompleted ? (
                <ul className="mt-2 space-y-2">
                  {completed.map((item) => (
                    <TaskRow
                      key={item.id}
                      task={item.task}
                      meta={item.leadTime}
                      date={item.suggestedDate}
                      time={item.eventTime}
                      venue={item.venue}
                      reason={item.reason}
                      done={item.done}
                      onToggle={(done) => onToggleDone(item.id, done)}
                      onEdit={() => onEditTask(item)}
                      onRemove={() => onRemove(item.id)}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      </Card>
      <MissedViewActions
        suggestingMore={suggestingMore}
        onSuggestMore={onSuggestMore}
        onAddTask={onAddTask}
      />
    </section>
  );
}

function MissedViewActions({
  suggestingMore,
  onSuggestMore,
  onAddTask,
}: {
  suggestingMore: boolean;
  onSuggestMore: () => Promise<void>;
  onAddTask: () => void;
}) {
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        disabled={suggestingMore}
        onClick={() => void onSuggestMore()}
      >
        <Shuffle className="mr-2 h-4 w-4" />
        {suggestingMore ? "Finding ideas…" : "Suggest more"}
      </Button>
      <Button variant="outline" className="w-full" onClick={onAddTask}>
        <Plus className="mr-2 h-4 w-4" />
        Add task
      </Button>
    </div>
  );
}

function TaskRow({
  task,
  meta,
  date,
  time,
  venue,
  reason,
  done,
  onToggle,
  onEdit,
  onRemove,
  footer,
}: {
  task: string;
  meta: string;
  date?: string;
  time?: string;
  venue?: string;
  reason?: string;
  done: boolean;
  onToggle: (done: boolean) => void;
  onEdit: () => void;
  onRemove?: () => void;
  footer?: ReactNode;
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
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className={cn("text-sm text-foreground", done && "line-through opacity-70")}>{task}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meta}</p>
        {date || time || venue ? (
          <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
            {date ? <span>{formatShortDate(date)}</span> : null}
            {time ? <span>{formatDisplayTime(time)}</span> : null}
            {venue ? <span>{venue}</span> : null}
          </p>
        ) : (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary">
            <Pencil className="h-3 w-3" /> Add date & venue
          </p>
        )}
        {reason ? <p className="mt-1 text-xs text-muted-foreground">{reason}</p> : null}
        {footer}
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </li>
  );
}

function CommonlyMissedCreateSheet({
  open,
  defaultDate,
  onClose,
  onCreate,
}: {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onCreate: (input: {
    task: string;
    suggestedDate?: string;
    eventTime?: string;
    venue?: string;
  }) => Promise<void>;
}) {
  const [task, setTask] = useState("");
  const [suggestedDate, setSuggestedDate] = useState(defaultDate);
  const [eventTime, setEventTime] = useState("");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTask("");
      setSuggestedDate(defaultDate);
      setEventTime("");
      setVenue("");
    }
  }, [open, defaultDate]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Add reminder</SheetTitle>
          <p className="text-sm text-muted-foreground">Something easy to forget that isn&apos;t in our list.</p>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="missed-task">Task</Label>
            <Input
              id="missed-task"
              placeholder="e.g. Insure bridal jewelry"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="missed-date" className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Due date
            </Label>
            <Input
              id="missed-date"
              type="date"
              value={suggestedDate}
              onChange={(e) => setSuggestedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="missed-time" className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Time (optional)
            </Label>
            <TimePicker
              id="missed-time"
              value={eventTime}
              onChange={setEventTime}
              allowEmpty
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="missed-venue" className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Venue (optional)
            </Label>
            <Input
              id="missed-venue"
              placeholder="Where, if relevant"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={saving || !task.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onCreate({
                  task: task.trim(),
                  suggestedDate: suggestedDate || undefined,
                  eventTime: normalizeTimeForStorage(eventTime) || undefined,
                  venue: venue || undefined,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Adding…" : "Add task"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PlanningTaskSheet({
  task,
  onClose,
  onSave,
}: {
  task: PlanningTask | null;
  onClose: () => void;
  onSave: (
    id: string,
    patch: Partial<Pick<PlanningTask, "suggestedDate" | "eventTime" | "venue" | "task">>,
  ) => Promise<void>;
}) {
  const [suggestedDate, setSuggestedDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);

  const open = !!task;
  const taskId = task?.id;

  useEffect(() => {
    if (!task) return;
    setSuggestedDate(task.suggestedDate ?? "");
    setEventTime(toTimeInputValue(task.eventTime));
    setVenue(task.venue ?? "");
  }, [task]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="bottom">
        {task ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{task.category}</p>
              <SheetTitle className="font-serif text-xl leading-snug">{task.task}</SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-date" className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </Label>
                <Input
                  id="task-date"
                  type="date"
                  value={suggestedDate}
                  onChange={(e) => setSuggestedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-time" className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Time
                </Label>
                <TimePicker
                  id="task-time"
                  value={eventTime}
                  onChange={setEventTime}
                  allowEmpty
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-venue" className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Venue
                </Label>
                <Input
                  id="task-venue"
                  placeholder="Venue name"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={saving}
                onClick={async () => {
                  if (!taskId) return;
                  setSaving(true);
                  try {
                    await onSave(taskId, {
                      suggestedDate: suggestedDate || undefined,
                      eventTime: normalizeTimeForStorage(eventTime) || undefined,
                      venue: venue || undefined,
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TimelineEventSheet({
  event,
  onClose,
  onSave,
}: {
  event: TimelineEvent | null;
  onClose: () => void;
  onSave: (
    id: string,
    patch: Partial<Pick<TimelineEvent, "time" | "venue" | "eventDate" | "name">>,
  ) => Promise<void>;
}) {
  const [eventDate, setEventDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);

  const open = !!event;
  const eventId = event?.id;

  useEffect(() => {
    if (!event) return;
    setEventDate(event.eventDate ?? "");
    setTime(toTimeInputValue(event.time));
    setVenue(event.venue);
  }, [event]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="bottom">
        {event ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {event.eventDate ? formatShortDate(event.eventDate) : "Timeline event"}
              </p>
              <SheetTitle className="font-serif text-2xl">{event.name}</SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-date" className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time" className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Time
                </Label>
                <TimePicker id="event-time" value={time} onChange={setTime} allowEmpty />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-venue" className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Venue
                </Label>
                <Input
                  id="event-venue"
                  placeholder="Venue name"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={saving}
                onClick={async () => {
                  if (!eventId) return;
                  setSaving(true);
                  try {
                    await onSave(eventId, {
                      eventDate: eventDate || undefined,
                      time: normalizeTimeForStorage(time) || undefined,
                      venue: venue || undefined,
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
