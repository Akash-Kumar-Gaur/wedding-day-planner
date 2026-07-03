import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getTemplateFor,
  type LeadTime,
  type WeddingTradition,
} from "@/data/checklist-templates";
import type {
  CommonlyMissedTask,
  PlanningTask,
  TimelineEvent,
  VendorCategory,
} from "@/data/wedding";
import { timelineEvents as defaultTimelineEvents } from "@/data/wedding";
import type { PersonalizedPlan, PlanFormInput } from "@/lib/personalize-plan";

const STORAGE_KEY = "shadiplan-wedding-plan";

type StoredPlan = {
  tradition: WeddingTradition | null;
  timelineEvents: TimelineEvent[];
  planningTasks: PlanningTask[];
  commonlyMissedTasks: CommonlyMissedTask[];
  aiVendorNotes: string[];
};

function loadStoredPlan(): StoredPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPlan) : null;
  } catch {
    return null;
  }
}

function saveStoredPlan(plan: StoredPlan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function templateToPlanningTasks(tradition: WeddingTradition): {
  planningTasks: PlanningTask[];
  commonlyMissedTasks: CommonlyMissedTask[];
} {
  const items = getTemplateFor(tradition);
  const planningTasks: PlanningTask[] = items.map((item) => ({
    id: item.id,
    task: item.task,
    leadTime: item.leadTime,
    category: item.category,
    done: false,
    commonlyMissed: item.commonlyMissed,
  }));
  const commonlyMissedTasks: CommonlyMissedTask[] = items
    .filter((item) => item.commonlyMissed)
    .map((item) => ({
      id: `cm-${item.id}`,
      task: item.task,
      leadTime: item.leadTime,
      category: item.category,
      done: false,
    }));
  return { planningTasks, commonlyMissedTasks };
}

function mapAiCategory(category: string): VendorCategory {
  const normalized = category.trim();
  const allowed: VendorCategory[] = [
    "Venue",
    "Catering",
    "Photography",
    "Decor",
    "Transport",
    "Music",
    "Attire",
    "Other",
  ];
  const match = allowed.find((c) => c.toLowerCase() === normalized.toLowerCase());
  return match ?? "Other";
}

type WeddingPlanContextValue = {
  tradition: WeddingTradition | null;
  timelineEvents: TimelineEvent[];
  planningTasks: PlanningTask[];
  commonlyMissedTasks: CommonlyMissedTask[];
  aiVendorNotes: string[];
  hasPlan: boolean;
  applyStandardChecklist: (tradition: WeddingTradition) => void;
  applyPersonalizedPlan: (plan: PersonalizedPlan, input: PlanFormInput) => void;
  toggleTimelineDone: (id: string, done: boolean) => void;
  togglePlanningDone: (id: string, done: boolean) => void;
  toggleCommonlyMissedDone: (id: string, done: boolean) => void;
};

const WeddingPlanContext = createContext<WeddingPlanContextValue | null>(null);

export function WeddingPlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredPlan>(() => {
    const stored = loadStoredPlan();
    return (
      stored ?? {
        tradition: null,
        timelineEvents: defaultTimelineEvents.map((e) => ({ ...e })),
        planningTasks: [],
        commonlyMissedTasks: [],
        aiVendorNotes: [],
      }
    );
  });

  const persist = useCallback((next: StoredPlan) => {
    setState(next);
    saveStoredPlan(next);
  }, []);

  const applyStandardChecklist = useCallback(
    (tradition: WeddingTradition) => {
      const { planningTasks, commonlyMissedTasks } = templateToPlanningTasks(tradition);
      persist({
        tradition,
        timelineEvents: defaultTimelineEvents.map((e) => ({ ...e })),
        planningTasks,
        commonlyMissedTasks,
        aiVendorNotes: [],
      });
    },
    [persist],
  );

  const applyPersonalizedPlan = useCallback(
    (plan: PersonalizedPlan, input: PlanFormInput) => {
      const tradition = input.tradition as WeddingTradition;
      const { planningTasks, commonlyMissedTasks: templateMissed } =
        templateToPlanningTasks(tradition);

      const aiMissed: CommonlyMissedTask[] = plan.commonlyMissed.map((item, index) => ({
        id: `ai-cm-${index}`,
        task: item.task,
        leadTime: item.leadTime,
        reason: item.reason,
        done: false,
      }));

      const mergedMissed = [...templateMissed];
      for (const item of aiMissed) {
        if (!mergedMissed.some((m) => m.task.toLowerCase() === item.task.toLowerCase())) {
          mergedMissed.push(item);
        }
      }

      const maxDay = Math.min(4, Math.max(1, input.days)) as 1 | 2 | 3 | 4;
      const aiTimeline: TimelineEvent[] = plan.timelineSuggestions
        .filter((s) => s.day >= 1 && s.day <= maxDay)
        .map((s, index) => ({
          id: `ai-t-${index}`,
          day: Math.min(4, s.day) as 1 | 2 | 3 | 4,
          time: s.time,
          name: s.name,
          venue: "TBD",
          dressCode: "As per event",
          done: false,
        }));

      const aiVendorNotes = plan.vendors.map(
        (v) =>
          `${mapAiCategory(v.category)}: ${v.note} (suggested ${v.suggestedBudgetShare}% of budget)`,
      );

      persist({
        tradition,
        timelineEvents: [...defaultTimelineEvents.map((e) => ({ ...e })), ...aiTimeline],
        planningTasks,
        commonlyMissedTasks: mergedMissed,
        aiVendorNotes,
      });
    },
    [persist],
  );

  const toggleTimelineDone = useCallback(
    (id: string, done: boolean) => {
      persist({
        ...state,
        timelineEvents: state.timelineEvents.map((e) => (e.id === id ? { ...e, done } : e)),
      });
    },
    [persist, state],
  );

  const togglePlanningDone = useCallback(
    (id: string, done: boolean) => {
      const task = state.planningTasks.find((t) => t.id === id);
      persist({
        ...state,
        planningTasks: state.planningTasks.map((t) => (t.id === id ? { ...t, done } : t)),
        commonlyMissedTasks: task?.commonlyMissed
          ? state.commonlyMissedTasks.map((t) =>
              t.id === `cm-${id}` ? { ...t, done } : t,
            )
          : state.commonlyMissedTasks,
      });
    },
    [persist, state],
  );

  const toggleCommonlyMissedDone = useCallback(
    (id: string, done: boolean) => {
      const baseId = id.startsWith("cm-") ? id.slice(3) : null;
      persist({
        ...state,
        commonlyMissedTasks: state.commonlyMissedTasks.map((t) =>
          t.id === id ? { ...t, done } : t,
        ),
        planningTasks: baseId
          ? state.planningTasks.map((t) => (t.id === baseId ? { ...t, done } : t))
          : state.planningTasks,
      });
    },
    [persist, state],
  );

  const value = useMemo<WeddingPlanContextValue>(
    () => ({
      tradition: state.tradition,
      timelineEvents: state.timelineEvents,
      planningTasks: state.planningTasks,
      commonlyMissedTasks: state.commonlyMissedTasks,
      aiVendorNotes: state.aiVendorNotes,
      hasPlan: state.planningTasks.length > 0 || state.commonlyMissedTasks.length > 0,
      applyStandardChecklist,
      applyPersonalizedPlan,
      toggleTimelineDone,
      togglePlanningDone,
      toggleCommonlyMissedDone,
    }),
    [
      applyPersonalizedPlan,
      applyStandardChecklist,
      state,
      toggleCommonlyMissedDone,
      togglePlanningDone,
      toggleTimelineDone,
    ],
  );

  return <WeddingPlanContext.Provider value={value}>{children}</WeddingPlanContext.Provider>;
}

export function useWeddingPlan() {
  const ctx = useContext(WeddingPlanContext);
  if (!ctx) {
    throw new Error("useWeddingPlan must be used within WeddingPlanProvider");
  }
  return ctx;
}

export type { LeadTime };
