import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type {
  CreateExpenseInput,
  CreateGuestGroupInput,
  CreateGuestInput,
  CreateTimelineEventInput,
  CreateVendorInput,
  CreateWeddingInput,
  BudgetCategory,
  GuestGroup,
  PlanningTask,
  TimelineEvent,
  UpdateGuestInput,
  UpdateExpenseInput,
  Wedding,
  WeddingCollaborator,
} from "@/data/wedding-types";
import { useAuth } from "@/lib/auth";
import { isPostgrestSchemaError } from "@/lib/supabase-errors";
import { weddingRangePatchesForEvents } from "@/lib/lead-time-dates";
import { useRealtimeSync } from "@/lib/use-realtime-sync";
import type { PlanAnswers } from "@/lib/suggestion-engine";
import { generateSuggestions, getCommonlyMissedPoolItems, pickMoreCommonlyMissed } from "@/lib/suggestion-engine";
import { commonlyMissedItemsToPlanningInputs } from "@/lib/commonly-missed-tasks";
import { suggestionsToPendingInputs } from "@/lib/suggestion-pending";
import {
  WEDDING_LOAD_TIMEOUT_MS,
  type WeddingLoadState,
} from "@/lib/wedding-load-state";
import { createWeddingInvalidators } from "@/lib/wedding-invalidation";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";
import { useWeddingQueries } from "@/lib/use-wedding-queries";
import {
  createWedding,
  dismissPendingSuggestion,
  insertGuest,
  insertGuestGroup,
  insertBudgetCategory,
  updateBudgetCategory as updateBudgetCategoryRow,
  deleteBudgetCategory as deleteBudgetCategoryRow,
  insertPlanningTask,
  insertPlanningTasks,
  deletePlanningTask,
  insertTimelineEvent,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  insertVendor,
  inviteCollaborator,
  recordVendorPayment,
  removePendingSuggestion,
  syncPendingSuggestionsBatch,
  updatePendingSuggestion,
  updatePlanningTask,
  updateTimelineEvent,
  updateWedding,
  updateWeddingOnboardingMode,
  updateGuest,
  redistributeBudgetPlanned,
} from "@/lib/wedding-api";

type WeddingBundle = {
  wedding: ReturnType<typeof useWeddingQueries>["wedding"];
  isOwner: boolean;
  collaborators: ReturnType<typeof useWeddingQueries>["collaborators"];
  vendors: ReturnType<typeof useWeddingQueries>["vendors"];
  guestGroups: ReturnType<typeof useWeddingQueries>["guestGroups"];
  guests: ReturnType<typeof useWeddingQueries>["guests"];
  timelineEvents: ReturnType<typeof useWeddingQueries>["timelineEvents"];
  budgetCategories: ReturnType<typeof useWeddingQueries>["budgetCategories"];
  planningTasks: ReturnType<typeof useWeddingQueries>["planningTasks"];
  pendingSuggestions: ReturnType<typeof useWeddingQueries>["pendingSuggestions"];
  transactions: ReturnType<typeof useWeddingQueries>["transactions"];
};

type WeddingDataContextValue = WeddingBundle & {
  loadState: WeddingLoadState;
  needsOnboarding: boolean;
  isOwner: boolean;
  collaborators: WeddingCollaborator[];
  hasPlan: boolean;
  pendingReviewCount: number;
  retry: () => Promise<void>;
  createWeddingAndRefresh: (input: CreateWeddingInput) => Promise<Wedding>;
  saveWeddingBasics: (input: CreateWeddingInput) => Promise<Wedding>;
  setWeddingBudget: (totalBudget: number) => Promise<void>;
  setOnboardingMode: (mode: "manual" | "ai") => Promise<void>;
  setTimelineDone: (id: string, done: boolean) => Promise<void>;
  updateTimelineEventDetails: (
    id: string,
    patch: Partial<Pick<TimelineEvent, "time" | "name" | "venue" | "dressCode" | "eventDate">>,
  ) => Promise<void>;
  createTimelineEvent: (input: CreateTimelineEventInput) => Promise<void>;
  updatePlanningTaskDetails: (
    id: string,
    patch: Partial<Pick<PlanningTask, "done" | "suggestedDate" | "eventTime" | "venue" | "task">>,
  ) => Promise<void>;
  createPlanningTask: (input: Omit<PlanningTask, "id">) => Promise<void>;
  deletePlanningTaskById: (id: string) => Promise<void>;
  seedCommonlyMissedTasks: (answers: PlanAnswers | null) => Promise<void>;
  addMoreCommonlyMissedTasks: (answers: PlanAnswers | null, nonce: number) => Promise<void>;
  loadCategorySuggestions: (opts: {
    answers: PlanAnswers;
    categories?: string[];
    includeCommonlyMissed?: boolean;
    perCategory?: number;
    nonce?: number;
  }) => Promise<void>;
  saveSuggestionReviewBatch: (
    answers: PlanAnswers,
    opts?: { nonce?: number; perCategory?: number },
  ) => Promise<void>;
  acceptSuggestion: (
    id: string,
    patch: { task: string; suggestedDate: string },
  ) => Promise<void>;
  dismissSuggestion: (id: string) => Promise<void>;
  updatePendingDate: (id: string, suggestedDate: string) => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<void>;
  updateExpense: (id: string, patch: UpdateExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  createBudgetCategory: (input: { name: string; planned?: number }) => Promise<BudgetCategory>;
  updateBudgetCategory: (
    id: string,
    patch: { name?: string; planned?: number },
  ) => Promise<void>;
  deleteBudgetCategory: (id: string) => Promise<void>;
  createVendor: (input: CreateVendorInput) => Promise<void>;
  createGuestGroup: (input: CreateGuestGroupInput) => Promise<GuestGroup>;
  createGuest: (input: CreateGuestInput) => Promise<void>;
  updateGuestDetails: (id: string, patch: UpdateGuestInput) => Promise<void>;
  markVendorPaid: (vendorId: string) => Promise<void>;
  inviteCollaborator: (email: string) => Promise<WeddingCollaborator>;
  refresh: () => Promise<void>;
};

const WeddingDataContext = createContext<WeddingDataContextValue | null>(null);

function errorMessage(error: unknown): string {
  if (isPostgrestSchemaError(error)) {
    const e = error as { message?: string };
    const tableMatch = e.message?.match(/table 'public\.([^']+)'/);
    const table = tableMatch?.[1];
    if (table) {
      return `The "${table}" table isn't available yet. Apply pending Supabase migrations (see supabase/migrations/), then try again.`;
    }
    return "A required database table is missing. Apply pending Supabase migrations (start with supabase/migrations/001_initial.sql), then try again.";
  }
  if (error instanceof Error) return error.message;
  return "Could not load your wedding. Please try again.";
}

export function WeddingDataProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [timedOut, setTimedOut] = useState(false);

  const enabled = status === "authenticated" && !!user;

  const queries = useWeddingQueries(user?.id, user?.email ?? "", enabled);

  const inv = useMemo(
    () => createWeddingInvalidators(queryClient, user?.id, queries.weddingId),
    [queryClient, user?.id, queries.weddingId],
  );

  useEffect(() => {
    if (!enabled || !queries.isPending) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), WEDDING_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, queries.isPending, user?.id]);

  const loadState = useMemo((): WeddingLoadState => {
    if (timedOut && queries.isPending) {
      return {
        status: "error",
        message: "Taking longer than expected. Check your connection and try again.",
      };
    }
    if (queries.isError) {
      return { status: "error", message: errorMessage(queries.error) };
    }
    if (queries.isPending) {
      return { status: "loading" };
    }
    if (queries.isSuccess && queries.wedding) {
      return { status: "loaded", wedding: queries.wedding };
    }
    if (queries.isSuccess && !queries.wedding) {
      return { status: "empty" };
    }
    return { status: "loading" };
  }, [
    timedOut,
    queries.isPending,
    queries.isError,
    queries.isSuccess,
    queries.wedding,
    queries.error,
  ]);

  const needsOnboarding = loadState.status === "empty";
  const rangeSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const wedding = queries.wedding;
    const events = queries.timelineEvents;
    if (!wedding || !events.length) return;

    const patches = weddingRangePatchesForEvents(wedding, events);
    if (!patches.weddingDate && !patches.endDate) return;

    const key = `${wedding.id}:${wedding.date}:${wedding.endDate}:${events.map((e) => e.id).join()}`;
    if (rangeSyncKeyRef.current === key) return;
    rangeSyncKeyRef.current = key;

    updateWedding(wedding.id, patches)
      .then(() => inv.meta())
      .catch(() => {
        rangeSyncKeyRef.current = null;
      });
  }, [queries.wedding, queries.timelineEvents, inv]);

  useEffect(() => {
    if (!needsOnboarding) return;
    if (pathname === "/plan" || pathname === "/login") return;
    navigate({ to: "/plan", search: { onboarding: true } });
  }, [needsOnboarding, pathname, navigate]);

  const retry = useCallback(async () => {
    setTimedOut(false);
    await queries.refetchMeta();
    await queries.refetchTables();
  }, [queries.refetchMeta, queries.refetchTables]);

  const createMutation = useMutation({
    mutationFn: (input: CreateWeddingInput) => createWedding(user!.id, input),
    onSuccess: () => {
      void inv.all();
    },
  });

  const bundle: WeddingBundle = {
    wedding: queries.wedding,
    isOwner: queries.isOwner,
    collaborators: queries.collaborators,
    vendors: queries.vendors,
    guestGroups: queries.guestGroups,
    guests: queries.guests,
    timelineEvents: queries.timelineEvents,
    budgetCategories: queries.budgetCategories,
    planningTasks: queries.planningTasks,
    pendingSuggestions: queries.pendingSuggestions,
    transactions: queries.transactions,
  };

  const hasPlan = bundle.planningTasks.length > 0;
  const pendingReviewCount = bundle.pendingSuggestions.filter((p) => p.status === "pending").length;

  useRealtimeSync(queries.weddingId);

  const value: WeddingDataContextValue = {
    ...bundle,
    loadState,
    needsOnboarding,
    isOwner: bundle.isOwner,
    collaborators: bundle.collaborators,
    hasPlan,
    pendingReviewCount,
    retry,
    createWeddingAndRefresh: async (input) => createMutation.mutateAsync(input),
    saveWeddingBasics: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (weddingId) {
        const updated = await updateWedding(weddingId, input);
        await inv.meta();
        return updated;
      }
      return createMutation.mutateAsync(input);
    },
    setWeddingBudget: async (totalBudget) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateWedding(weddingId, { totalBudget });
      const totalPlanned = bundle.budgetCategories.reduce((s, c) => s + c.planned, 0);
      if (totalPlanned === 0 && bundle.budgetCategories.length > 0) {
        await redistributeBudgetPlanned(weddingId, totalBudget, bundle.budgetCategories);
      }
      await inv.meta();
      await inv.budgetCategories();
    },
    setOnboardingMode: async (mode) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateWeddingOnboardingMode(weddingId, mode);
      await inv.meta();
    },
    setTimelineDone: async (id, done) => {
      await updateTimelineEvent(id, { done });
      await inv.timelineEvents();
    },
    updateTimelineEventDetails: async (id, patch) => {
      await updateTimelineEvent(id, patch);
      await inv.timelineEvents();
    },
    createTimelineEvent: async (input) => {
      const wedding = bundle.wedding;
      const weddingId = wedding?.id;
      if (!weddingId || !wedding) throw new Error("No wedding loaded");
      await insertTimelineEvent(weddingId, input);
      const end = wedding.endDate || wedding.date;
      const patches: Partial<CreateWeddingInput> = {};
      if (input.eventDate < wedding.date) patches.weddingDate = input.eventDate;
      if (input.eventDate > end) patches.endDate = input.eventDate;
      if (Object.keys(patches).length) await updateWedding(weddingId, patches);
      await inv.timelineEvents();
      if (Object.keys(patches).length) await inv.meta();
    },
    updatePlanningTaskDetails: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) return;
      await updatePlanningTask(weddingId, id, patch);
      await inv.planningTasks();
    },
    createPlanningTask: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await insertPlanningTask(weddingId, input);
      await inv.planningTasks();
    },
    deletePlanningTaskById: async (id) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await deletePlanningTask(weddingId, id);
      await inv.planningTasks();
    },
    seedCommonlyMissedTasks: async (answers) => {
      const weddingId = bundle.wedding?.id;
      const weddingDate = bundle.wedding?.date;
      if (!weddingId || !weddingDate) throw new Error("Wedding date required");
      const alreadySeeded = bundle.planningTasks.some((t) => t.commonlyMissed);
      if (alreadySeeded) return;
      const items = commonlyMissedItemsToPlanningInputs(
        getCommonlyMissedPoolItems(answers),
        weddingDate,
      );
      if (!items.length) return;
      await insertPlanningTasks(weddingId, items);
      await inv.planningTasks();
    },
    addMoreCommonlyMissedTasks: async (answers, nonce) => {
      const weddingId = bundle.wedding?.id;
      const weddingDate = bundle.wedding?.date;
      if (!weddingId || !weddingDate) throw new Error("Wedding date required");
      const existingTexts = bundle.planningTasks
        .filter((t) => t.commonlyMissed)
        .map((t) => t.task);
      const picks = pickMoreCommonlyMissed(answers, existingTexts, nonce);
      const items = commonlyMissedItemsToPlanningInputs(picks, weddingDate);
      if (!items.length) return;
      await insertPlanningTasks(weddingId, items);
      await inv.planningTasks();
    },
    loadCategorySuggestions: async ({
      answers,
      categories,
      includeCommonlyMissed = true,
      perCategory = 3,
      nonce = 0,
    }) => {
      const weddingId = bundle.wedding?.id;
      const weddingDate = bundle.wedding?.date;
      if (!weddingId || !weddingDate) throw new Error("Wedding date required");
      const usedPoolIds = bundle.pendingSuggestions.map((p) => p.poolItemId);
      const result = generateSuggestions(answers, {
        categories,
        includeCommonlyMissed: false,
        perCategory,
        nonce,
        excludePoolItemIds: usedPoolIds,
      });
      const items = suggestionsToPendingInputs(result, weddingDate, nonce);
      const fresh = await syncPendingSuggestionsBatch(weddingId, items, {
        categories,
        usedPoolItemIds: usedPoolIds,
      });
      queryClient.setQueryData(weddingQueryKeys.pendingSuggestions(weddingId), fresh);
    },
    saveSuggestionReviewBatch: async (answers, opts = {}) => {
      const weddingId = bundle.wedding?.id;
      const weddingDate = bundle.wedding?.date;
      if (!weddingId || !weddingDate) throw new Error("Wedding date required");
      const nonce = opts.nonce ?? 0;
      const usedPoolIds = bundle.pendingSuggestions.map((p) => p.poolItemId);
      const result = generateSuggestions(answers, {
        nonce,
        perCategory: opts.perCategory ?? 4,
        includeCommonlyMissed: false,
        excludePoolItemIds: usedPoolIds,
      });
      const items = suggestionsToPendingInputs(result, weddingDate, nonce);
      const fresh = await syncPendingSuggestionsBatch(weddingId, items, {
        usedPoolItemIds: usedPoolIds,
      });
      queryClient.setQueryData(weddingQueryKeys.pendingSuggestions(weddingId), fresh);
    },
    acceptSuggestion: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      const pending = bundle.pendingSuggestions.find((p) => p.id === id);
      if (!pending) throw new Error("Suggestion not found");
      await insertPlanningTask(weddingId, {
        task: patch.task,
        leadTime: pending.leadTime,
        category: pending.category,
        commonlyMissed: pending.commonlyMissed,
        done: false,
        suggestedDate: patch.suggestedDate,
      });
      await removePendingSuggestion(id);
      await inv.pendingSuggestions();
      await inv.planningTasks();
    },
    dismissSuggestion: async (id) => {
      await dismissPendingSuggestion(id);
      await inv.pendingSuggestions();
    },
    updatePendingDate: async (id, suggestedDate) => {
      await updatePendingSuggestion(id, { suggestedDate });
      await inv.pendingSuggestions();
    },
    addExpense: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding to add expense to");
      await insertTransaction(weddingId, input);
      await inv.wallet();
    },
    updateExpense: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateTransaction(weddingId, id, patch);
      await inv.wallet();
    },
    deleteExpense: async (id) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await deleteTransaction(weddingId, id);
      await inv.wallet();
    },
    createBudgetCategory: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      const category = await insertBudgetCategory(weddingId, input);
      await inv.budgetCategories();
      return category;
    },
    updateBudgetCategory: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateBudgetCategoryRow(weddingId, id, patch);
      await inv.budgetCategories();
    },
    deleteBudgetCategory: async (id) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await deleteBudgetCategoryRow(weddingId, id);
      await inv.budgetCategories();
    },
    createVendor: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await insertVendor(weddingId, input, bundle.budgetCategories);
      await inv.vendors();
      await inv.budgetCategories();
    },
    createGuestGroup: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      const group = await insertGuestGroup(weddingId, input);
      await inv.guestGroups();
      return group;
    },
    createGuest: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await insertGuest(weddingId, input);
      await inv.guests();
    },
    updateGuestDetails: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateGuest(weddingId, id, patch);
      await inv.guests();
    },
    markVendorPaid: async (vendorId) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      const vendor = bundle.vendors.find((v) => v.id === vendorId);
      if (!vendor) throw new Error("Vendor not found");
      const balance = vendor.totalCost - vendor.advancePaid;
      if (balance <= 0) return;
      const categoryId =
        bundle.budgetCategories.find((c) => c.name === vendor.category)?.id ??
        bundle.budgetCategories[0]?.id;
      if (!categoryId) throw new Error("No budget category available");
      const today = new Date().toISOString().slice(0, 10);
      await recordVendorPayment(weddingId, vendor, categoryId, balance, today);
      await inv.wallet();
    },
    inviteCollaborator: async (email) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      const collaborator = await inviteCollaborator(weddingId, email);
      await inv.collaborators();
      return collaborator;
    },
    refresh: async () => {
      setTimedOut(false);
      await inv.all();
    },
  };

  return <WeddingDataContext.Provider value={value}>{children}</WeddingDataContext.Provider>;
}

export function useWeddingData() {
  const ctx = useContext(WeddingDataContext);
  if (!ctx) {
    throw new Error("useWeddingData must be used within WeddingDataProvider");
  }
  return ctx;
}
