import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_ACCOMPANYING = 10;

type AccompanyingCountStepperProps = {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
};

export function AccompanyingCountStepper({
  value,
  onChange,
  id = "accompanying-count",
  className,
}: AccompanyingCountStepperProps) {
  const clamped = Math.min(MAX_ACCOMPANYING, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>Accompanying guests</Label>
      <p className="text-xs text-muted-foreground">
        Spouse, kids, or plus-ones not listed separately.
      </p>
      <div className="flex items-center justify-between rounded-2xl border border-border px-3 py-2">
        <span className="text-sm text-foreground">Bringing anyone with them?</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={clamped <= 0}
            onClick={() => onChange(Math.max(0, clamped - 1))}
            aria-label="Decrease accompanying guests"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span
            id={id}
            className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums"
            aria-live="polite"
          >
            {clamped}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={clamped >= MAX_ACCOMPANYING}
            onClick={() => onChange(Math.min(MAX_ACCOMPANYING, clamped + 1))}
            aria-label="Increase accompanying guests"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
