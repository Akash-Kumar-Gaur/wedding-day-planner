import { HOURS_12, parseTime12Parts, toTime24, type TimePeriod } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type TimePickerProps = {
  id?: string;
  value: string;
  onChange: (time24: string) => void;
  /** When true, empty value shows a default display but does not emit until the user changes a control. */
  allowEmpty?: boolean;
  defaultTime?: string;
  className?: string;
};

export function TimePicker({
  id,
  value,
  onChange,
  allowEmpty = false,
  defaultTime = "19:00",
  className,
}: TimePickerProps) {
  const displayValue = value || (allowEmpty ? "" : defaultTime);
  const { hour12, minute, period } = parseTime12Parts(displayValue || defaultTime, defaultTime);

  const emit = (nextHour12: number, nextMinute: string, nextPeriod: TimePeriod) => {
    onChange(toTime24(nextHour12, nextMinute, nextPeriod));
  };

  return (
    <div id={id} className={cn("flex items-center gap-2", className)}>
      <select
        aria-label="Hour"
        className={selectClass}
        value={String(hour12)}
        onChange={(e) => emit(Number(e.target.value), minute, period)}
      >
        {HOURS_12.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <select
        aria-label="Minutes"
        className={cn(selectClass, "flex-none basis-[5.5rem]")}
        value={minute}
        onChange={(e) => emit(hour12, e.target.value, period)}
      >
        <option value="00">:00</option>
        <option value="30">:30</option>
      </select>

      <div
        className="flex h-9 shrink-0 overflow-hidden rounded-md border border-input shadow-sm"
        role="group"
        aria-label="AM or PM"
      >
        {(["AM", "PM"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={cn(
              "px-3 text-sm font-medium transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-foreground hover:bg-muted/50",
            )}
            aria-pressed={period === p}
            onClick={() => emit(hour12, minute, p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
