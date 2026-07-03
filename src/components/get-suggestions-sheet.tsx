import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SuggestionReviewList } from "@/components/suggestion-review-list";
import type { PendingSuggestion } from "@/data/wedding-types";
import { loadPlanAnswers } from "@/lib/plan-answers";
import { generateSuggestions } from "@/lib/suggestion-engine";
import { suggestionsToPendingInputs } from "@/lib/suggestion-pending";
import { useWeddingData } from "@/lib/wedding-data";
import { useWeddingPlan } from "@/lib/wedding-plan-store";

type GetSuggestionsSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  categories?: string[];
  includeCommonlyMissed?: boolean;
  perCategory?: number;
};

export function GetSuggestionsSheet({
  open,
  onClose,
  title = "Suggestions",
  categories,
  includeCommonlyMissed = true,
  perCategory = 3,
}: GetSuggestionsSheetProps) {
  const { wedding, pendingSuggestions, loadCategorySuggestions, acceptSuggestion, dismissSuggestion, updatePendingDate } =
    useWeddingData();
  const { tradition } = useWeddingPlan();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const visible = pendingSuggestions.filter((item) => {
    if (item.status !== "pending") return false;
    if (!categories?.length) return true;
    return categories.includes(item.category);
  });

  useEffect(() => {
    if (!open || !wedding?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const answers = loadPlanAnswers(wedding.id, tradition);
        await loadCategorySuggestions({
          answers,
          categories,
          includeCommonlyMissed,
          perCategory,
          nonce,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load suggestions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, wedding?.id, tradition, categories, includeCommonlyMissed, perCategory, nonce, loadCategorySuggestions]);

  const handleAccept = async (
    suggestion: PendingSuggestion,
    patch: { task: string; suggestedDate: string },
  ) => {
    setBusyId(suggestion.id);
    try {
      await acceptSuggestion(suggestion.id, patch);
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (suggestion: PendingSuggestion) => {
    setBusyId(suggestion.id);
    try {
      await dismissSuggestion(suggestion.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">{title}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Review each suggestion — nothing is added until you accept it.
          </p>
        </SheetHeader>

        <div className="mt-5 space-y-4 pb-6">
          {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Finding ideas…</p>
          ) : (
            <SuggestionReviewList
              suggestions={visible}
              busyId={busyId}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onDateChange={(id, date) => updatePendingDate(id, date)}
            />
          )}

          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={() => setNonce((n) => n + 1)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Suggest more
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function previewCategorySuggestions(
  weddingDate: string,
  answers: Parameters<typeof generateSuggestions>[0],
  opts: Parameters<typeof generateSuggestions>[1],
) {
  const result = generateSuggestions(answers, opts);
  return suggestionsToPendingInputs(result, weddingDate, opts?.nonce ?? 0);
}
