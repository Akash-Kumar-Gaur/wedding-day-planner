import type { Tradition } from "@/data/suggestion-pool";
import type { PlanAnswers } from "@/lib/suggestion-engine";

const DEFAULT_ANSWERS: PlanAnswers = {
  tradition: "North Indian Hindu",
  budgetTier: "mid",
  guestTier: "medium",
  dayTier: "3-4",
};

export function planAnswersStorageKey(weddingId: string) {
  return `shadiplan-plan-answers-${weddingId}`;
}

export function loadPlanAnswers(weddingId: string | null, tradition: Tradition | null): PlanAnswers {
  if (typeof window === "undefined" || !weddingId) {
    return { ...DEFAULT_ANSWERS, tradition: tradition ?? DEFAULT_ANSWERS.tradition };
  }
  const raw = localStorage.getItem(planAnswersStorageKey(weddingId));
  if (!raw) {
    return { ...DEFAULT_ANSWERS, tradition: tradition ?? DEFAULT_ANSWERS.tradition };
  }
  try {
    const parsed = JSON.parse(raw) as PlanAnswers;
    return {
      ...DEFAULT_ANSWERS,
      ...parsed,
      tradition: tradition ?? parsed.tradition ?? DEFAULT_ANSWERS.tradition,
    };
  } catch {
    return { ...DEFAULT_ANSWERS, tradition: tradition ?? DEFAULT_ANSWERS.tradition };
  }
}

export function savePlanAnswers(weddingId: string, answers: PlanAnswers) {
  if (typeof window === "undefined") return;
  localStorage.setItem(planAnswersStorageKey(weddingId), JSON.stringify(answers));
}
