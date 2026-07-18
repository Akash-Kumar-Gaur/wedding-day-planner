import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Pencil, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PendingSuggestion } from "@/data/wedding-types";
import { formatShortDate } from "@/lib/lead-time-dates";
import { cn } from "@/lib/utils";

type SuggestionReviewListProps = {
  suggestions: PendingSuggestion[];
  onAccept: (
    suggestion: PendingSuggestion,
    patch: { task: string; suggestedDate: string },
  ) => Promise<void>;
  onDismiss: (suggestion: PendingSuggestion) => Promise<void>;
  onDateChange?: (id: string, suggestedDate: string) => void;
  busyId?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function SuggestionReviewList({
  suggestions,
  onAccept,
  onDismiss,
  onDateChange,
  busyId,
  emptyTitle = "All caught up",
  emptyDescription = "No pending suggestions. Add items manually or suggest more.",
}: SuggestionReviewListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PendingSuggestion[]>();
    for (const item of suggestions) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [suggestions]);

  if (!suggestions.length) {
    return (
      <Card className="rounded-2xl border-dashed p-6 text-center">
        <p className="font-serif text-lg text-foreground">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([category, items]) => (
        <section key={category} className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{category}</p>
          {items.map((item) => (
            <SuggestionReviewCard
              key={item.id}
              suggestion={item}
              busy={busyId === item.id}
              onAccept={onAccept}
              onDismiss={onDismiss}
              onDateChange={onDateChange}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function SuggestionReviewCard({
  suggestion,
  busy,
  onAccept,
  onDismiss,
  onDateChange,
}: {
  suggestion: PendingSuggestion;
  busy: boolean;
  onAccept: SuggestionReviewListProps["onAccept"];
  onDismiss: SuggestionReviewListProps["onDismiss"];
  onDateChange?: SuggestionReviewListProps["onDateChange"];
}) {
  const [editing, setEditing] = useState(false);
  const [task, setTask] = useState(suggestion.task);
  const [suggestedDate, setSuggestedDate] = useState(suggestion.suggestedDate);

  useEffect(() => {
    setTask(suggestion.task);
    setSuggestedDate(suggestion.suggestedDate);
    setEditing(false);
  }, [suggestion.id, suggestion.task, suggestion.suggestedDate]);

  const handleDateChange = (value: string) => {
    setSuggestedDate(value);
    onDateChange?.(suggestion.id, value);
  };

  return (
    <Card className={cn("rounded-2xl p-4", suggestion.commonlyMissed && "border-amber-200/80")}>
      {suggestion.commonlyMissed ? (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-amber-700">
          Commonly missed
        </p>
      ) : null}

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`task-${suggestion.id}`}>Task</Label>
            <Textarea
              id={`task-${suggestion.id}`}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`date-${suggestion.id}`} className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Due date
            </Label>
            <DatePicker
              id={`date-${suggestion.id}`}
              value={suggestedDate}
              onChange={handleDateChange}
              placeholder="Select date"
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={busy || !task.trim() || !suggestedDate}
              onClick={async () => {
                await onAccept(suggestion, { task: task.trim(), suggestedDate });
                setEditing(false);
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-foreground">{task}</p>
          <div className="mt-3 space-y-2">
            <Label htmlFor={`inline-date-${suggestion.id}`} className="text-xs text-muted-foreground">
              Suggested date · {suggestedDate ? formatShortDate(suggestedDate) : "Pick a date"}
            </Label>
            <DatePicker
              id={`inline-date-${suggestion.id}`}
              value={suggestedDate}
              onChange={handleDateChange}
              placeholder="Select date"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || !suggestedDate}
              onClick={() => onAccept(suggestion, { task: task.trim(), suggestedDate })}
            >
              Accept
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit then accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onDismiss(suggestion)}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Dismiss
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
