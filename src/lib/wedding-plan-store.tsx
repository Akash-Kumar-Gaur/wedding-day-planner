import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Tradition } from "@/data/suggestion-pool";
import type { CommonlyMissedTask, PlanningTask } from "@/data/wedding-types";
import { useWeddingData } from "@/lib/wedding-data";

type WeddingPlanContextValue = {
  tradition: Tradition | null;
  planningTasks: PlanningTask[];
  commonlyMissedTasks: CommonlyMissedTask[];
  hasPlan: boolean;
  setTradition: (tradition: Tradition) => void;
  togglePlanningDone: (id: string, done: boolean) => Promise<void>;
  toggleCommonlyMissedDone: (id: string, done: boolean) => Promise<void>;
  updatePlanningTaskDetails: (
    id: string,
    patch: Partial<Pick<PlanningTask, "suggestedDate" | "eventTime" | "venue" | "task">>,
  ) => Promise<void>;
};

const WeddingPlanContext = createContext<WeddingPlanContextValue | null>(null);

function loadTradition(key: string): Tradition | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(key) as Tradition | null) ?? null;
}

function saveTradition(key: string, tradition: Tradition) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, tradition);
}

export function WeddingPlanProvider({
  children,
  weddingId,
}: {
  children: ReactNode;
  weddingId: string | null;
}) {
  const { planningTasks, hasPlan, updatePlanningTaskDetails } = useWeddingData();

  const traditionKey = weddingId
    ? `shadiplan-tradition-${weddingId}`
    : "shadiplan-tradition-pending";

  const [tradition, setTraditionState] = useState<Tradition | null>(() => loadTradition(traditionKey));

  useEffect(() => {
    setTraditionState(loadTradition(traditionKey));
  }, [traditionKey]);

  const setTradition = useCallback(
    (next: Tradition) => {
      saveTradition(traditionKey, next);
      setTraditionState(next);
    },
    [traditionKey],
  );

  const commonlyMissedTasks = useMemo<CommonlyMissedTask[]>(
    () =>
      planningTasks
        .filter((t) => t.commonlyMissed)
        .map((t) => ({
          id: t.id,
          task: t.task,
          leadTime: t.leadTime,
          category: t.category,
          reason: t.reason,
          done: t.done,
          suggestedDate: t.suggestedDate,
          eventTime: t.eventTime,
          venue: t.venue,
        })),
    [planningTasks],
  );

  const regularPlanningTasks = useMemo(
    () => planningTasks.filter((t) => !t.commonlyMissed),
    [planningTasks],
  );

  const togglePlanningDone = useCallback(
    async (id: string, done: boolean) => {
      await updatePlanningTaskDetails(id, { done });
    },
    [updatePlanningTaskDetails],
  );

  const toggleCommonlyMissedDone = useCallback(
    async (id: string, done: boolean) => {
      await updatePlanningTaskDetails(id, { done });
    },
    [updatePlanningTaskDetails],
  );

  const value = useMemo<WeddingPlanContextValue>(
    () => ({
      tradition,
      planningTasks: regularPlanningTasks,
      commonlyMissedTasks,
      hasPlan,
      setTradition,
      togglePlanningDone,
      toggleCommonlyMissedDone,
      updatePlanningTaskDetails,
    }),
    [
      commonlyMissedTasks,
      hasPlan,
      regularPlanningTasks,
      setTradition,
      toggleCommonlyMissedDone,
      togglePlanningDone,
      tradition,
      updatePlanningTaskDetails,
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
