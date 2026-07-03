import { Pencil } from "lucide-react";
import type { BudgetCategory } from "@/data/wedding-types";
import { formatINR } from "@/data/wedding";
import { cn } from "@/lib/utils";

export function BudgetCategoryRow({
  category,
  isActive = false,
  onSelect,
  onEdit,
  readOnly = false,
}: {
  category: BudgetCategory;
  isActive?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const p =
    category.planned > 0 ? Math.min(100, Math.round((category.actual / category.planned) * 100)) : 0;
  const over = category.planned > 0 && category.actual > category.planned;

  return (
    <div
      className={cn(
        "flex items-stretch border-b border-border last:border-b-0",
        isActive && "bg-muted/50",
      )}
    >
      <div
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly ? undefined : 0}
        onClick={readOnly ? undefined : onSelect}
        onKeyDown={
          readOnly || !onSelect
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect();
                }
              }
        }
        className={cn(
          "min-w-0 flex-1 px-4 py-3 text-left",
          !readOnly && onSelect && "cursor-pointer transition-colors hover:bg-muted/40",
        )}
      >
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <p className="font-medium text-foreground">{category.name}</p>
          <p className="shrink-0 text-xs text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                over ? "text-[color:var(--destructive)]" : "text-foreground",
              )}
            >
              {formatINR(category.actual)}
            </span>
            <span className="text-muted-foreground"> / {formatINR(category.planned)}</span>
          </p>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Spent / planned</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full", over ? "bg-[color:var(--destructive)]" : "bg-primary")}
            style={{ width: `${p}%` }}
          />
        </div>
      </div>
      {!readOnly && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex shrink-0 items-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
