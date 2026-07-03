import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScreenHeader } from "@/components/app-shell";
import { SetBudgetSheet } from "@/components/set-budget-sheet";
import { formatINR, shortDate } from "@/data/wedding";
import { useWeddingData } from "@/lib/wedding-data";
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function WalletScreen() {
  const { wedding, budgetCategories, transactions, addExpense } = useWeddingData();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSpent = budgetCategories.reduce((s, c) => s + c.actual, 0);
  const totalPlanned = budgetCategories.reduce((s, c) => s + c.planned, 0);
  const hasBudget = wedding?.totalBudget != null && wedding.totalBudget > 0;
  const totalBudget = wedding?.totalBudget ?? 0;
  const pct = hasBudget ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const overBudget = totalSpent > totalPlanned;

  const filteredTx = useMemo(
    () => (activeCat ? transactions.filter((t) => t.categoryId === activeCat) : transactions),
    [activeCat, transactions],
  );

  const resetForm = () => {
    setAmount("");
    setCategoryId(budgetCategories[0]?.id ?? "");
    setVendorName("");
    setDate(todayIso());
    setNote("");
    setError(null);
  };

  useEffect(() => {
    if (sheetOpen && !categoryId && budgetCategories[0]) {
      setCategoryId(budgetCategories[0].id);
    }
  }, [sheetOpen, categoryId, budgetCategories]);

  const handleSave = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addExpense({
        amount: parsed,
        categoryId,
        vendorName: vendorName.trim() || undefined,
        date,
        note: note.trim() || undefined,
      });
      toast.success("Expense logged");
      setSheetOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Wallet" />

      <div className="space-y-5 px-5 pt-5">
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
              <p className="mt-2 text-sm text-muted-foreground">
                Set your total budget to start tracking against a target.
              </p>
              <Button className="mt-4" size="sm" variant="outline" onClick={() => setBudgetSheetOpen(true)}>
                Set your budget
              </Button>
            </div>
          )}
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
            {budgetCategories.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No budget categories yet. Add an expense to get started.
              </p>
            ) : (
              budgetCategories.map((c) => {
                const p = c.planned > 0 ? Math.min(100, Math.round((c.actual / c.planned) * 100)) : 0;
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
              })
            )}
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
                    <p className="text-xs text-muted-foreground">
                      {shortDate(t.date)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">− {formatINR(t.amount)}</p>
                </div>
              ))
            )}
          </Card>
        </section>

        <div className="h-4" />
      </div>

      <button
        type="button"
        aria-label="Add expense"
        onClick={() => {
          resetForm();
          setSheetOpen(true);
        }}
        className="fixed bottom-24 right-[max(1rem,calc(50%-215px+1rem))] z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-2xl">Log expense</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Record spending that isn&apos;t tied to a tracked vendor.
            </p>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount (₹)</Label>
              <Input
                id="expense-amount"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {budgetCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  {budgetCategories.length === 0 ? (
                    <SelectItem value="misc" disabled>
                      No categories — set up your wedding first
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-vendor">Paid to (optional)</Label>
              <Input
                id="expense-vendor"
                placeholder="e.g. Local florist, cash purchase"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-note">Note (optional)</Label>
              <Textarea
                id="expense-note"
                placeholder="What was this for?"
                className="min-h-20 rounded-2xl"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

            <Button className="w-full" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save expense"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <SetBudgetSheet open={budgetSheetOpen} onClose={() => setBudgetSheetOpen(false)} />
    </div>
  );
}
