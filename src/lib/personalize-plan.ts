import type { LeadTime } from "@/data/checklist-templates";

export interface PlanFormInput {
  tradition: string;
  days: number;
  venues: number;
  guestCount: number;
  budgetRange: string;
}

export interface PersonalizedPlan {
  vendors: Array<{ category: string; suggestedBudgetShare: number; note: string }>;
  timelineSuggestions: Array<{ day: number; time: string; name: string; note: string }>;
  commonlyMissed: Array<{ task: string; leadTime: LeadTime; reason: string }>;
}

const SYSTEM_PROMPT = `You are an expert Indian wedding planner assistant for ShadiPlan.
Return ONLY valid JSON matching this exact shape — no markdown fences, no preamble, no commentary:
{
  "vendors": [{ "category": string, "suggestedBudgetShare": number, "note": string }],
  "timelineSuggestions": [{ "day": number, "time": string, "name": string, "note": string }],
  "commonlyMissed": [{ "task": string, "leadTime": "12mo"|"9mo"|"6mo"|"3mo"|"1mo"|"1wk", "reason": string }]
}
suggestedBudgetShare values must be percentages (0-100) that sum to roughly 100.
day must be 1-4. time is 24h "HH:MM".
Focus on tasks commonly missed by first-time planners for the given tradition.`;

export function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parsePersonalizedPlan(text: string): PersonalizedPlan {
  const parsed = JSON.parse(stripJsonFences(text)) as PersonalizedPlan;
  if (!Array.isArray(parsed.vendors) || !Array.isArray(parsed.timelineSuggestions) || !Array.isArray(parsed.commonlyMissed)) {
    throw new Error("Response missing required arrays");
  }
  return parsed;
}

export async function personalizePlanWithAI(input: PlanFormInput): Promise<PersonalizedPlan> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Personalize a wedding plan for:
- Tradition: ${input.tradition}
- Event days: ${input.days}
- Venues/cities: ${input.venues}
- Guest count: ${input.guestCount}
- Budget range: ${input.budgetRange}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `AI request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new Error("AI response had no text content");
  }

  return parsePersonalizedPlan(text);
}
