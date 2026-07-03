import {
  SUGGESTION_POOL,
  type SuggestionItem,
  type Tradition,
  type BudgetTier,
  type GuestTier,
  type DayTier,
} from "@/data/suggestion-pool";

export interface PlanAnswers {
  tradition: Tradition;
  budgetTier: BudgetTier;
  guestTier: GuestTier;
  dayTier: DayTier;
}

// Simple seeded PRNG (mulberry32) so the same answers + seed produce the same
// shuffle — reroll by bumping the seed via the "Shuffle again" button.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function matches<T extends string>(tag: T[] | "all", value: T): boolean {
  return tag === "all" || tag.includes(value);
}

function hashAnswers(answers: PlanAnswers, nonce: number): number {
  const str = `${answers.tradition}|${answers.budgetTier}|${answers.guestTier}|${answers.dayTier}|${nonce}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Picks a relevant, shuffled subset of suggestions per category based on the
 * user's answers. `nonce` changes on each "shuffle again" click to get a
 * different-but-still-relevant selection without re-asking questions.
 */
export function generateSuggestions(
  answers: PlanAnswers,
  opts: { perCategory?: number; nonce?: number; categories?: string[]; includeCommonlyMissed?: boolean } = {},
): { byCategory: Record<string, SuggestionItem[]>; commonlyMissed: SuggestionItem[] } {
  const perCategory = opts.perCategory ?? 4;
  const nonce = opts.nonce ?? 0;
  const rng = mulberry32(hashAnswers(answers, nonce));

  const relevant = SUGGESTION_POOL.filter(
    (item) =>
      matches(item.tradition, answers.tradition) &&
      matches(item.budgetTier, answers.budgetTier) &&
      matches(item.guestTier, answers.guestTier) &&
      matches(item.dayTier, answers.dayTier) &&
      (!opts.categories?.length || opts.categories.includes(item.category)),
  );

  const byCategory: Record<string, SuggestionItem[]> = {};
  for (const item of relevant) {
    if (item.commonlyMissed) continue;
    (byCategory[item.category] ??= []).push(item);
  }
  for (const category of Object.keys(byCategory)) {
    byCategory[category] = seededShuffle(byCategory[category], rng).slice(0, perCategory);
  }

  const commonlyMissed =
    opts.includeCommonlyMissed === false
      ? []
      : seededShuffle(
          relevant.filter((i) => i.commonlyMissed),
          rng,
        ).slice(0, opts.categories?.length ? 3 : 10);

  return { byCategory, commonlyMissed };
}

export function toBudgetTier(budgetRange: string): BudgetTier {
  if (budgetRange.startsWith("Under")) return "modest";
  if (budgetRange.includes("₹25–50") || budgetRange.includes("₹50 lakh")) return "mid";
  if (budgetRange.includes("₹1–2") || budgetRange.includes("₹2 crore")) return "premium";
  return "mid";
}

export function toGuestTier(guestCount: number): GuestTier {
  if (guestCount < 100) return "intimate";
  if (guestCount <= 300) return "medium";
  return "large";
}

export function toDayTier(days: number): DayTier {
  if (days <= 2) return "1-2";
  if (days <= 4) return "3-4";
  return "5+";
}

export type GeneratedSuggestions = ReturnType<typeof generateSuggestions>;
