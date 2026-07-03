import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetCategoryRow } from "@/components/budget-category-row";
import type { BudgetCategory } from "@/data/wedding-types";
import { formatINR } from "@/data/wedding";
import { cn } from "@/lib/utils";

export function WalletBudgetSummary({
  totalSpent,
  totalBudget,
  totalPlanned,
  categories,
  readOnly = false,
  onAddCategory,
}: {
  totalSpent: number;
  totalBudget: number;
  totalPlanned: number;
  categories: BudgetCategory[];
  readOnly?: boolean;
  onAddCategory?: () => void;
}) {
  const hasBudget = totalBudget > 0;
  const pct = hasBudget ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const overBudget = hasBudget && totalPlanned > totalBudget;

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total spent</p>
        {hasBudget ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-serif text-4xl text-foreground">{formatINR(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">of {formatINR(totalBudget)}</p>
            </div>
            <Progress value={pct} className="mt-3 h-2 bg-secondary" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{pct}% committed</span>
              <span className={cn(overBudget && "text-[color:var(--destructive)]")}>
                Planned {formatINR(totalPlanned)}
              </span>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p className="font-serif text-4xl text-foreground">{formatINR(totalSpent)}</p>
          </div>
        )}
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="font-serif text-lg text-foreground">Categories</h2>
          {!readOnly && onAddCategory ? (
            <button
              type="button"
              onClick={onAddCategory}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add category
            </button>
          ) : null}
        </div>
        <Card className="divide-y divide-border rounded-2xl p-0">
          {categories.map((c) => (
            <BudgetCategoryRow key={c.id} category={c} readOnly={readOnly} />
          ))}
        </Card>
      </section>
    </div>
  );
}
