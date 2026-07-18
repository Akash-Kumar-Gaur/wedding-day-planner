import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPENSE_TAG_PRESETS } from "@/data/wedding-types";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function TaggedForPicker({ value, onChange }: Props) {
  const [customTag, setCustomTag] = useState("");

  const toggleTag = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const addCustomTag = () => {
    const next = customTag.trim();
    if (!next) return;
    if (!value.includes(next)) onChange([...value, next]);
    setCustomTag("");
  };

  const customOnly = value.filter((t) => !(EXPENSE_TAG_PRESETS as readonly string[]).includes(t));

  return (
    <div className="space-y-2">
      <Label>Tagged for</Label>
      <p className="text-xs text-muted-foreground">Who is this expense for?</p>
      <div className="flex flex-wrap gap-2">
        {EXPENSE_TAG_PRESETS.map((tag) => {
          const selected = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={selected}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selected
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              {tag}
            </button>
          );
        })}
        {customOnly.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            aria-pressed
            className="rounded-full border border-primary bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          placeholder="Custom name or role"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomTag();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="shrink-0 rounded-xl border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
