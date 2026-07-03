import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useWeddingData } from "@/lib/wedding-data";

export function SetBudgetSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { wedding, setWeddingBudget } = useWeddingData();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(wedding?.totalBudget != null ? String(wedding.totalBudget) : "");
      setError(null);
    }
  }, [open, wedding?.totalBudget]);

  const parsed = Number(amount);
  const valid = parsed > 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Set total budget</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-budget">Total budget (₹)</Label>
            <Input
              id="total-budget"
              type="number"
              min={1}
              placeholder="e.g. 5000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This is your overall wedding budget — category splits can be adjusted in Wallet.
            </p>
          </div>
          {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}
          <Button
            className="w-full"
            disabled={saving || !valid}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                await setWeddingBudget(parsed);
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not save budget");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save budget"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
