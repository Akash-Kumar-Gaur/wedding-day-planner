import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Shuffle, ChevronRight, PenLine, ListChecks } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { SuggestionReviewList } from "@/components/suggestion-review-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tradition } from "@/data/suggestion-pool";
import type { PendingSuggestion } from "@/data/wedding-types";
import { savePlanAnswers } from "@/lib/plan-answers";
import { useWeddingData } from "@/lib/wedding-data";
import {
  toBudgetTier,
  toDayTier,
  toGuestTier,
  type PlanAnswers,
} from "@/lib/suggestion-engine";
import { useWeddingPlan } from "@/lib/wedding-plan-store";

export const Route = createFileRoute("/plan")({
  validateSearch: (search: Record<string, unknown>) => ({
    onboarding:
      search.onboarding === true ||
      search.onboarding === "true" ||
      search.onboarding === 1 ||
      search.onboarding === "1",
    review:
      search.review === true ||
      search.review === "true" ||
      search.review === 1 ||
      search.review === "1",
  }),
  head: () => ({
    meta: [
      { title: "Personalize — ShadiPlan" },
      { name: "description", content: "Set up your wedding — add items yourself or get guided suggestions." },
      { property: "og:title", content: "Personalize — ShadiPlan" },
    ],
  }),
  component: PlanScreen,
});

const TRADITIONS: Tradition[] = [
  "North Indian Hindu",
  "South Indian",
  "Punjabi",
  "Bengali",
  "Destination",
  "Custom",
];

const BUDGET_RANGES = [
  "Under ₹25 lakh",
  "₹25–50 lakh",
  "₹50 lakh – ₹1 crore",
  "₹1–2 crore",
  "₹2 crore+",
];

type Phase = "basics" | "fork" | "questionnaire" | "review";

function PlanScreen() {
  const navigate = useNavigate();
  const { onboarding, review } = Route.useSearch();
  const {
    wedding,
    needsOnboarding,
    saveWeddingBasics,
    setOnboardingMode,
    saveSuggestionReviewBatch,
    pendingSuggestions,
    pendingReviewCount,
    acceptSuggestion,
    dismissSuggestion,
    updatePendingDate,
  } = useWeddingData();
  const { setTradition } = useWeddingPlan();

  const isOnboarding = onboarding || needsOnboarding;

  const [coupleNames, setCoupleNames] = useState("");
  const [location, setLocation] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetSkipped, setBudgetSkipped] = useState(true);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [tradition, setTraditionLocal] = useState<Tradition>("North Indian Hindu");
  const [days, setDays] = useState("4");
  const [guestCount, setGuestCount] = useState("250");
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [phase, setPhase] = useState<Phase>("basics");
  const [nonce, setNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wedding) {
      setCoupleNames(wedding.coupleNames);
      setLocation(wedding.location);
      setWeddingDate(wedding.date);
      setEndDate(wedding.endDate);
      if (wedding.totalBudget != null) {
        setBudgetSkipped(false);
        setBudgetAmount(String(wedding.totalBudget));
      } else {
        setBudgetSkipped(true);
        setBudgetAmount("");
      }
    }
  }, [wedding]);

  useEffect(() => {
    if (review || pendingReviewCount > 0) {
      setPhase("review");
    }
  }, [review, pendingReviewCount]);

  const answers: PlanAnswers = useMemo(
    () => ({
      tradition,
      budgetTier: toBudgetTier(budgetRange),
      guestTier: toGuestTier(Number(guestCount) || 100),
      dayTier: toDayTier(Number(days) || 4),
    }),
    [tradition, budgetRange, guestCount, days],
  );

  const basicsValid =
    coupleNames.trim().length > 0 &&
    location.trim().length > 0 &&
    weddingDate.length > 0 &&
    endDate.length > 0 &&
    endDate >= weddingDate &&
    (budgetSkipped || Number(budgetAmount) > 0);

  const pending = pendingSuggestions.filter((p) => p.status === "pending");

  const saveBasics = async () => {
    if (!basicsValid) return;
    const input = {
      coupleNames: coupleNames.trim(),
      location: location.trim(),
      weddingDate,
      endDate,
      totalBudget: budgetSkipped ? null : Number(budgetAmount),
    };
    const saved = await saveWeddingBasics(input);
    return saved.id;
  };

  const handleBasicsContinue = async () => {
    if (submitting || !basicsValid) return;
    setError(null);
    setSubmitting(true);
    try {
      await saveBasics();
      setPhase("fork");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your wedding.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManual = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await saveBasics();
      await setOnboardingMode("manual");
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAi = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await saveBasics();
      await setOnboardingMode("ai");
      setPhase("questionnaire");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReview = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const weddingId = wedding?.id ?? (await saveBasics());
      if (!weddingId) throw new Error("Wedding not saved");
      setTradition(tradition);
      savePlanAnswers(weddingId, answers);
      await saveSuggestionReviewBatch(answers, { nonce: 0 });
      setNonce(0);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate suggestions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShuffle = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const nextNonce = nonce + 1;
      await saveSuggestionReviewBatch(answers, { nonce: nextNonce });
      setNonce(nextNonce);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not shuffle suggestions.");
    } finally {
      setSubmitting(false);
    }
  };

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
    <div>
      <ScreenHeader
        eyebrow="ShadiPlan"
        title={
          phase === "review"
            ? "Review suggestions"
            : isOnboarding
              ? "Set up your wedding"
              : "Personalize your plan"
        }
      >
        <p className="mt-1 text-xs text-muted-foreground">
          {phase === "basics"
            ? "Start with the essentials — couple, dates, and location."
            : phase === "fork"
              ? "Choose how you'd like to build your plan."
              : phase === "questionnaire"
                ? "A few details help us surface relevant ideas — nothing is added until you accept it."
                : "Accept, edit, or dismiss each suggestion. Real dates only — edit before accepting if needed."}
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        {phase === "basics" ? (
          <>
            <Card className="space-y-4 rounded-2xl p-5">
              <div className="space-y-2">
                <Label htmlFor="couple">Couple names</Label>
                <Input
                  id="couple"
                  placeholder="Aanya & Rohan"
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Udaipur, Rajasthan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={weddingDate}
                    onChange={(e) => {
                      setWeddingDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    min={weddingDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              {weddingDate && endDate && endDate < weddingDate ? (
                <p className="text-sm text-[color:var(--destructive)]">
                  End date must be on or after the start date.
                </p>
              ) : null}
              <div className="space-y-2">
                <Label>Total budget</Label>
                {budgetSkipped ? (
                  <p className="text-sm text-muted-foreground">
                    Skip for now — you can set it later from Home or Wallet.
                  </p>
                ) : (
                  <Input
                    type="number"
                    min={1}
                    placeholder="Total in ₹"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                  />
                )}
                <button
                  type="button"
                  className="text-sm font-medium text-primary"
                  onClick={() => {
                    setBudgetSkipped((skipped) => !skipped);
                    setBudgetAmount("");
                  }}
                >
                  {budgetSkipped ? "Set a budget now" : "I'll set this later"}
                </button>
              </div>
            </Card>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

            <Button className="w-full pb-4" onClick={handleBasicsContinue} disabled={!basicsValid || submitting}>
              {submitting ? "Saving…" : "Continue"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : null}

        {phase === "fork" ? (
          <>
            <Card className="rounded-2xl p-5">
              <p className="font-serif text-lg text-foreground">How would you like to get started?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can always ask for suggestions later from any screen.
              </p>
            </Card>

            <div className="grid gap-3 pb-4">
              <button
                type="button"
                onClick={handleManual}
                disabled={submitting}
                className="rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:bg-muted/40"
              >
                <PenLine className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">I&apos;ll add things myself</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with a blank slate. Add vendors, guests, and checklist items when you&apos;re ready.
                </p>
              </button>

              <button
                type="button"
                onClick={handleStartAi}
                disabled={submitting}
                className="rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:bg-muted/40"
              >
                <Sparkles className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">Help me get started</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Answer a few questions, then review suggestions one at a time before anything is added.
                </p>
              </button>
            </div>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}
          </>
        ) : null}

        {phase === "questionnaire" ? (
          <>
            <Card className="space-y-4 rounded-2xl p-5">
              <div className="space-y-2">
                <Label htmlFor="tradition">Wedding tradition</Label>
                <Select value={tradition} onValueChange={(v) => setTraditionLocal(v as Tradition)}>
                  <SelectTrigger id="tradition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADITIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="days">Event days</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={7}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests">Guest count (approx.)</Label>
                  <Input
                    id="guests"
                    type="number"
                    min={20}
                    step={10}
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget range</Label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                  <SelectTrigger id="budget">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

            <Button className="w-full pb-4" onClick={handleGenerateReview} disabled={submitting}>
              <ListChecks className="mr-2 h-4 w-4" />
              {submitting ? "Preparing…" : "Show suggestions to review"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setPhase("fork")}>
              Back
            </Button>
          </>
        ) : null}

        {phase === "review" ? (
          <>
            <Card className="rounded-2xl p-5">
              <p className="font-serif text-lg text-foreground">
                {pending.length} suggestion{pending.length === 1 ? "" : "s"} to review
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing appears in your checklist until you tap Accept.
              </p>
            </Card>

            <SuggestionReviewList
              suggestions={pending}
              busyId={busyId}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onDateChange={(id, date) => updatePendingDate(id, date)}
            />

            <div className="space-y-3 pb-4">
              <Button className="w-full" variant="outline" onClick={handleShuffle} disabled={submitting}>
                <Shuffle className="mr-2 h-4 w-4" />
                {submitting ? "Shuffling…" : "Suggest more"}
              </Button>
              <Button className="w-full" onClick={() => navigate({ to: "/" })}>
                Go to home
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => setPhase("questionnaire")}>
                Edit questionnaire answers
              </Button>
            </div>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
