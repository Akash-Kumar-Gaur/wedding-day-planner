import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScreenHeader } from "@/components/app-shell";
import { WEDDING, budgetCategories, transactions, formatINR, shortDate } from "@/data/wedding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — ShadiPlan" },
      { name: "description", content: "Budget, category spend, and every wedding transaction in one place." },
      { property: "og:title", content: "Wallet — ShadiPlan" },
      { property: "og:description", content: "Track spending against your wedding budget by category." },
    ],
  }),
  component: WalletScreen,
});

function WalletScreen() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const totalSpent = budgetCategories.reduce((s, c) => s + c.actual, 0);
  const totalPlanned = budgetCategories.reduce((s, c) => s + c.planned, 0);
  const pct = Math.min(100, Math.round((totalSpent / WEDDING.totalBudget) * 100));
  const overBudget = totalSpent > totalPlanned;

  const filteredTx = useMemo(
    () => (activeCat ? transactions.filter((t) => t.categoryId === activeCat) : transactions),
    [activeCat],
  );

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Wallet" />

      <div className="space-y-5 px-5 pt-5">
        <Card className="rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total spent</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-serif text-4xl text-foreground">{formatINR(totalSpent)}</p>
            <p className="text-sm text-muted-foreground">of {formatINR(WEDDING.totalBudget)}</p>
          </div>
          <Progress value={pct} className="mt-3 h-2 bg-secondary" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{pct}% committed</span>
            <span className={cn(overBudget && "text-[color:var(--destructive)]")}>
              Planned {formatINR(totalPlanned)}
            </span>
          </div>
        </Card>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-serif text-lg text-foreground">Categories</h2>
            {activeCat ? (
              <button
                onClick={() => setActiveCat(null)}
                className="text-xs font-medium text-primary"
              >
                Clear filter
              </button>
            ) : null}
          </div>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {budgetCategories.map((c) => {
              const p = Math.min(100, Math.round((c.actual / c.planned) * 100));
              const over = c.actual > c.planned;
              const isActive = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(isActive ? null : c.id)}
                  className={cn(
                    "block w-full px-4 py-3 text-left transition-colors hover:bg-muted/40",
                    isActive && "bg-muted/50",
                  )}
                >
                  <div className="flex items-baseline justify-between text-sm">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "font-medium",
                          over ? "text-[color:var(--destructive)]" : "text-foreground",
                        )}
                      >
                        {formatINR(c.actual)}
                      </span>{" "}
                      / {formatINR(c.planned)}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        over ? "bg-[color:var(--destructive)]" : "bg-primary",
                      )}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </Card>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-serif text-lg text-foreground">
              {activeCat ? "Filtered transactions" : "Recent transactions"}
            </h2>
          </div>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {filteredTx.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No transactions in this category yet.
              </p>
            ) : (
              filteredTx.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{shortDate(t.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    − {formatINR(t.amount)}
                  </p>
                </div>
              ))
            )}
          </Card>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}