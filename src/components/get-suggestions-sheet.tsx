import { useEffect, useRef, useState } from "react";
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

  // Stable string dep — inline `categories={[...]}` from parents is a new array every render.
  const categoriesKey = categories?.length ? [...categories].sort().join("|") : "";
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const visible = pendingSuggestions.filter((item) => {
    if (item.status !== "pending") return false;
    if (!categories?.length) return true;
    return categories.includes(item.category);
  });

  const loadSuggestionsRef = useRef(loadCategorySuggestions);
  loadSuggestionsRef.current = loadCategorySuggestions;
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !wedding?.id) {
      if (!open) loadedKeyRef.current = null;
      return;
    }

    const loadKey = `${wedding.id}|${nonce}|${categoriesKey}|${perCategory}|${includeCommonlyMissed}|${tradition}`;
    if (loadedKeyRef.current === loadKey) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const answers = loadPlanAnswers(wedding.id, tradition);
        await loadSuggestionsRef.current({
          answers,
          categories: categoriesRef.current,
          includeCommonlyMissed,
          perCategory,
          nonce,
        });
        if (!cancelled) loadedKeyRef.current = loadKey;
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
  }, [open, wedding?.id, tradition, categoriesKey, includeCommonlyMissed, perCategory, nonce]);

  const showLoading = loading && visible.length === 0;

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
          {showLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Finding ideas…</p>
          ) : (
            <SuggestionReviewList
              suggestions={visible}
              busyId={busyId}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onDateChange={(id, date) => updatePendingDate(id, date)}
              emptyTitle={
                categories?.length
                  ? "No more suggestions for this category"
                  : "No more suggestions right now"
              }
              emptyDescription={
                categories?.length
                  ? "You've already seen every idea we have here. Add items manually, or try another section."
                  : "You've already seen every idea we have. Add items manually instead."
              }
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
