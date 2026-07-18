import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
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
import { TaggedForPicker } from "@/components/tagged-for-picker";
import { formatINR, shortDate, type BudgetCategory, type Transaction } from "@/data/wedding";
import type { UpdateExpenseInput } from "@/data/wedding-types";
import { useWeddingData } from "@/lib/wedding-data";
import { cn } from "@/lib/utils";

const NEW_CATEGORY_VALUE = "__new__";

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
  const {
    wedding,
    budgetCategories,
    transactions,
    addExpense,
    updateExpense,
    deleteExpense,
    createBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
  } = useWeddingData();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<BudgetCategory | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPlanned, setNewCategoryPlanned] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [taggedFor, setTaggedFor] = useState<string[]>([]);
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
    setCategoryId(budgetCategories[0]?.id ?? NEW_CATEGORY_VALUE);
    setNewCategoryName("");
    setNewCategoryPlanned("");
    setVendorName("");
    setDate(todayIso());
    setNote("");
    setTaggedFor([]);
    setError(null);
  };

  useEffect(() => {
    if (sheetOpen) {
      if (!categoryId) {
        setCategoryId(budgetCategories[0]?.id ?? NEW_CATEGORY_VALUE);
      }
    }
  }, [sheetOpen, categoryId, budgetCategories]);

  const handleSave = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }

    let resolvedCategoryId = categoryId;
    if (categoryId === NEW_CATEGORY_VALUE) {
      if (!newCategoryName.trim()) {
        setError("Category name is required");
        return;
      }
    } else if (!resolvedCategoryId) {
      setError("Select a category");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (categoryId === NEW_CATEGORY_VALUE) {
        const category = await createBudgetCategory({
          name: newCategoryName.trim(),
          planned: Number(newCategoryPlanned) || 0,
        });
        resolvedCategoryId = category.id;
      }

      await addExpense({
        amount: parsed,
        categoryId: resolvedCategoryId,
        vendorName: vendorName.trim() || undefined,
        date,
        note: note.trim() || undefined,
        taggedFor: taggedFor.length ? taggedFor : undefined,
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
            <div className="flex items-center gap-3">
              {activeCat ? (
                <button
                  onClick={() => setActiveCat(null)}
                  className="text-xs font-medium text-primary"
                >
                  Clear filter
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setCategorySheetOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add category
              </button>
            </div>
          </div>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {budgetCategories.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No budget categories yet.</p>
                <Button
                  className="mt-4"
                  size="sm"
                  variant="outline"
                  onClick={() => setCategorySheetOpen(true)}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add category
                </Button>
              </div>
            ) : (
              budgetCategories.map((c) => {
                const p = c.planned > 0 ? Math.min(100, Math.round((c.actual / c.planned) * 100)) : 0;
                const over = c.planned > 0 && c.actual > c.planned;
                const isActive = activeCat === c.id;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-stretch border-b border-border last:border-b-0",
                      isActive && "bg-muted/50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCat(isActive ? null : c.id)}
                      className="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              "font-medium",
                              over ? "text-[color:var(--destructive)]" : "text-foreground",
                            )}
                          >
                            {formatINR(c.actual)}
                          </span>
                          <span className="text-muted-foreground"> / {formatINR(c.planned)}</span>
                        </p>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Spent / planned</p>
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
                    <button
                      type="button"
                      onClick={() => setEditCategory(c)}
                      className="flex shrink-0 items-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
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
                <div
                  key={t.id}
                  className="flex items-stretch border-b border-border last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setEditTransaction(t)}
                    className="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{t.vendorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {shortDate(t.date)}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                        {t.taggedFor && t.taggedFor.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {t.taggedFor.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-foreground">
                        − {formatINR(t.amount)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTransaction(t)}
                    className="flex shrink-0 items-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    aria-label={`Edit ${t.vendorName}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
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
        <SheetContent side="bottom">
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
                  <SelectItem value={NEW_CATEGORY_VALUE}>Add new category…</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {categoryId === NEW_CATEGORY_VALUE ? (
              <Card className="space-y-3 rounded-2xl p-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category-name">Category name *</Label>
                  <Input
                    id="new-category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Gifts"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category-planned">Planned amount (₹)</Label>
                  <Input
                    id="new-category-planned"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    value={newCategoryPlanned}
                    onChange={(e) => setNewCategoryPlanned(e.target.value)}
                  />
                </div>
              </Card>
            ) : null}

            <TaggedForPicker value={taggedFor} onChange={setTaggedFor} />

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
      <CategoryAddSheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        onCreate={createBudgetCategory}
      />
      <CategoryEditSheet
        category={editCategory}
        onClose={() => setEditCategory(null)}
        onSave={updateBudgetCategory}
        onDelete={async (id) => {
          await deleteBudgetCategory(id);
          if (activeCat === id) setActiveCat(null);
        }}
      />
      <TransactionEditSheet
        transaction={editTransaction}
        budgetCategories={budgetCategories}
        onClose={() => setEditTransaction(null)}
        onSave={updateExpense}
        onDelete={deleteExpense}
      />
      <SetBudgetSheet open={budgetSheetOpen} onClose={() => setBudgetSheetOpen(false)} />
    </div>
  );
}

function CategoryAddSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; planned?: number }) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setPlanned("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        planned: Number(planned) || 0,
      });
      toast.success("Category added");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Add category</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Split your budget however you like — you can edit this later.
          </p>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gifts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-planned">Planned amount (₹)</Label>
            <Input
              id="category-planned"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

          <Button className="w-full" disabled={saving} onClick={handleSubmit}>
            {saving ? "Adding…" : "Add category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CategoryEditSheet({
  category,
  onClose,
  onSave,
  onDelete,
}: {
  category: BudgetCategory | null;
  onClose: () => void;
  onSave: (id: string, patch: { name?: string; planned?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = !!category;

  useEffect(() => {
    if (!category) return;
    setName(category.name);
    setPlanned(String(category.planned));
    setError(null);
  }, [category]);

  const handleSave = async () => {
    if (!category) return;
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(category.id, {
        name: name.trim(),
        planned: Number(planned) || 0,
      });
      toast.success("Category updated");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(category.id);
      toast.success("Category removed");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="bottom">
        {category ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-serif text-2xl">Edit category</SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Name</Label>
                <Input
                  id="edit-category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-planned">Planned amount (₹)</Label>
                <Input
                  id="edit-category-planned"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={planned}
                  onChange={(e) => setPlanned(e.target.value)}
                />
              </div>
              <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Spent so far</p>
                <p className="mt-0.5 font-medium text-foreground">{formatINR(category.actual)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Spent is calculated from logged expenses and vendor payments — edit those to change it.
                </p>
              </div>

              {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

              <Button className="w-full" disabled={saving || deleting} onClick={handleSave}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-[color:var(--destructive)]"
                disabled={saving || deleting}
                onClick={handleDelete}
              >
                {deleting ? "Removing…" : "Remove category"}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TransactionEditSheet({
  transaction,
  budgetCategories,
  onClose,
  onSave,
  onDelete,
}: {
  transaction: Transaction | null;
  budgetCategories: BudgetCategory[];
  onClose: () => void;
  onSave: (id: string, patch: UpdateExpenseInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [taggedFor, setTaggedFor] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = !!transaction;
  const vendorLinked = !!transaction?.vendorId;

  useEffect(() => {
    if (!transaction) return;
    setAmount(String(transaction.amount));
    setCategoryId(transaction.categoryId || budgetCategories[0]?.id || "");
    setVendorName(transaction.vendorName);
    setDate(transaction.date);
    setNote(transaction.note ?? "");
    setTaggedFor(transaction.taggedFor ?? []);
    setError(null);
    setRemoveConfirmOpen(false);
  }, [transaction, budgetCategories]);

  const handleSave = async () => {
    if (!transaction) return;
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
      await onSave(transaction.id, {
        amount: parsed,
        categoryId,
        vendorName: vendorLinked ? undefined : vendorName.trim() || undefined,
        date,
        note: note.trim() || undefined,
        taggedFor,
      });
      toast.success("Transaction updated");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(transaction.id);
      toast.success("Transaction removed");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete transaction");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setRemoveConfirmOpen(false);
          onClose();
        }
      }}
    >
      <SheetContent side="bottom">
        {transaction ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-serif text-2xl">Edit transaction</SheetTitle>
              {vendorLinked ? (
                <p className="text-sm text-muted-foreground">
                  Linked to a vendor payment — changes sync to the vendor record.
                </p>
              ) : null}
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-amount">Amount (₹)</Label>
                <Input
                  id="edit-expense-amount"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expense-category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="edit-expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expense-vendor">
                  {vendorLinked ? "Vendor" : "Paid to (optional)"}
                </Label>
                <Input
                  id="edit-expense-vendor"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  disabled={vendorLinked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expense-date">Date</Label>
                <Input
                  id="edit-expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expense-note">Note (optional)</Label>
                <Textarea
                  id="edit-expense-note"
                  placeholder="What was this for?"
                  className="min-h-20 rounded-2xl"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <TaggedForPicker value={taggedFor} onChange={setTaggedFor} />

              {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

              <Button className="w-full" disabled={saving || deleting} onClick={handleSave}>
                {saving ? "Saving…" : "Save changes"}
              </Button>

              <div className="border-t border-border pt-4">
                {removeConfirmOpen ? (
                  <Card className="rounded-2xl border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] p-4">
                    <p className="text-sm text-foreground">Remove this transaction?</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Category spend totals will update immediately.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={deleting}
                        onClick={() => setRemoveConfirmOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        disabled={deleting}
                        onClick={() => void handleDelete()}
                      >
                        {deleting ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <button
                    type="button"
                    className="w-full py-2 text-center text-sm font-medium text-[color:var(--destructive)]"
                    disabled={saving || deleting}
                    onClick={() => setRemoveConfirmOpen(true)}
                  >
                    Remove transaction
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
