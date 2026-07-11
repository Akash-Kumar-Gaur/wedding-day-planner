import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Gift as GiftIcon, Plus, X } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/data/wedding";
import {
  deleteGift,
  fetchGifts,
  insertGift,
  updateGift,
  type Gift,
} from "@/lib/gifts-api";
import { useWeddingData } from "@/lib/wedding-data";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gifts")({
  head: () => ({
    meta: [
      { title: "Gift tracker — ShadiPlan" },
      { property: "og:title", content: "Gift tracker — ShadiPlan" },
    ],
  }),
  component: GiftsScreen,
});

type Filter = "all" | "thanks_pending";

function GiftsScreen() {
  const { wedding, guests } = useWeddingData();
  const weddingId = wedding?.id;
  const queryClient = useQueryClient();

  const giftsQuery = useQuery({
    queryKey: weddingQueryKeys.gifts(weddingId ?? ""),
    queryFn: () => fetchGifts(weddingId!),
    enabled: !!weddingId,
  });

  const [filter, setFilter] = useState<Filter>("thanks_pending");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [giverName, setGiverName] = useState("");
  const [guestId, setGuestId] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guestQuery, setGuestQuery] = useState("");

  const gifts = giftsQuery.data ?? [];

  const filtered = useMemo(() => {
    if (filter === "thanks_pending") return gifts.filter((g) => !g.thankYouSent);
    return gifts;
  }, [filter, gifts]);

  const guestSuggestions = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    if (!q) return guests.slice(0, 6);
    return guests.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
  }, [guests, guestQuery]);

  const invalidate = () => {
    if (!weddingId) return;
    void queryClient.invalidateQueries({ queryKey: weddingQueryKeys.gifts(weddingId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof insertGift>[1]) => {
      if (!weddingId) throw new Error("No wedding");
      return insertGift(weddingId, input);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateGift>[2] }) => {
      if (!weddingId) throw new Error("No wedding");
      return updateGift(weddingId, id, patch);
    },
    onMutate: async ({ id, patch }) => {
      if (!weddingId) return {};
      const key = weddingQueryKeys.gifts(weddingId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Gift[]>(key);
      queryClient.setQueryData<Gift[]>(key, (old) =>
        (old ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (!weddingId || !context?.previous) return;
      queryClient.setQueryData(weddingQueryKeys.gifts(weddingId), context.previous);
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!weddingId) throw new Error("No wedding");
      return deleteGift(weddingId, id);
    },
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setGiverName("");
    setGuestId(undefined);
    setAmount("");
    setDescription("");
    setNotes("");
    setGuestQuery("");
    setError(null);
  };

  const handleCreate = async () => {
    if (!giverName.trim()) {
      setError("Giver name is required");
      return;
    }
    const parsedAmount = amount.trim() ? Number(amount) : undefined;
    if (amount.trim() && (!parsedAmount || parsedAmount <= 0)) {
      setError("Enter a valid amount");
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        giverName: giverName.trim(),
        guestId,
        amount: parsedAmount,
        giftDescription: description.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      resetForm();
      setSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save gift");
    }
  };

  if (!wedding) return null;

  const pendingCount = gifts.filter((g) => !g.thankYouSent).length;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Gift tracker">
        <p className="mt-1 text-sm text-muted-foreground">
          Track cash and gifts — and who still needs a thank-you.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={filter === "thanks_pending" ? "default" : "outline"}
            onClick={() => setFilter("thanks_pending")}
          >
            Thank you pending{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
        </div>

        {giftsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading gifts…</p>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center">
            <GiftIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {filter === "thanks_pending" && gifts.length > 0
                ? "All thank-yous sent — nice work."
                : "No gifts logged yet."}
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-border rounded-2xl p-0">
            {filtered.map((gift) => (
              <div key={gift.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{gift.giverName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {gift.amount != null ? formatINR(gift.amount) : null}
                    {gift.amount != null && gift.giftDescription ? " · " : null}
                    {gift.giftDescription || (gift.amount == null ? "Non-cash gift" : null)}
                  </p>
                  {gift.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{gift.notes}</p>
                  ) : null}
                  <label className="mt-2 flex items-center gap-2 text-xs text-foreground">
                    <Switch
                      checked={gift.thankYouSent}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: gift.id, patch: { thankYouSent: checked } })
                      }
                    />
                    Thank you sent
                  </label>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remove gift from ${gift.giverName}`}
                  onClick={() => deleteMutation.mutate(gift.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </Card>
        )}

        <Button className="w-full gap-2" onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4" />
          Add gift
        </Button>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) resetForm();
        }}
      >
        <SheetContent side="bottom">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-2xl">Add gift</SheetTitle>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Giver name *</Label>
              <Input
                value={giverName}
                onChange={(e) => {
                  setGiverName(e.target.value);
                  setGuestQuery(e.target.value);
                  setGuestId(undefined);
                }}
                placeholder="Search guests or type a name"
              />
              {guestSuggestions.length > 0 && !guestId ? (
                <ul className="max-h-36 overflow-y-auto rounded-xl border border-border">
                  {guestSuggestions.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-muted/50",
                          giverName === g.name && "bg-muted/40",
                        )}
                        onClick={() => {
                          setGiverName(g.name);
                          setGuestId(g.id);
                          setGuestQuery(g.name);
                        }}
                      >
                        {g.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {guestId ? (
                <p className="text-xs text-muted-foreground">Linked to guest list</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Optional for non-cash"
              />
            </div>

            <div className="space-y-2">
              <Label>Gift description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Silver frame"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => void handleCreate()}
            >
              {createMutation.isPending ? "Saving…" : "Save gift"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
