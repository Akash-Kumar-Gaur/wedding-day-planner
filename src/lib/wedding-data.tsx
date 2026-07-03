import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type {
  CreateExpenseInput,
  CreateGuestGroupInput,
  CreateGuestInput,
  CreateTimelineEventInput,
  CreateVendorInput,
  CreateWeddingInput,
  GuestGroup,
  PlanningTask,
  TimelineEvent,
  UpdateGuestInput,
  Wedding,
} from "@/data/wedding-types";
import { useAuth } from "@/lib/auth";
import { isPostgrestSchemaError } from "@/lib/supabase-errors";
import { weddingRangePatchesForEvents } from "@/lib/lead-time-dates";
import type { PlanAnswers } from "@/lib/suggestion-engine";
import { generateSuggestions } from "@/lib/suggestion-engine";
import { suggestionsToPendingInputs } from "@/lib/suggestion-pending";
import {
  WEDDING_LOAD_TIMEOUT_MS,
  type WeddingLoadState,
} from "@/lib/wedding-load-state";
import {
  createWedding,
  dismissPendingSuggestion,
  insertGuest,
  insertGuestGroup,
  insertPlanningTask,
  insertTimelineEvent,
  insertTransaction,
  insertVendor,
  loadWeddingBundle,
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

type WeddingBundle = Awaited<ReturnType<typeof loadWeddingBundle>>;

type WeddingDataContextValue = WeddingBundle & {
  loadState: WeddingLoadState;
  needsOnboarding: boolean;
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
  createVendor: (input: CreateVendorInput) => Promise<void>;
  createGuestGroup: (input: CreateGuestGroupInput) => Promise<GuestGroup>;
  createGuest: (input: CreateGuestInput) => Promise<void>;
  updateGuestDetails: (id: string, patch: UpdateGuestInput) => Promise<void>;
  markVendorPaid: (vendorId: string) => Promise<void>;
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

  const query = useQuery({
    queryKey: ["wedding-bundle", user?.id],
    queryFn: () => loadWeddingBundle(user!.id),
    enabled,
    retry: (failureCount, error) =>
      !isPostgrestSchemaError(error) && failureCount < 2,
    refetchOnWindowFocus: (q) => {
      if (q.state.error && isPostgrestSchemaError(q.state.error)) return false;
      return true;
    },
  });

  useEffect(() => {
    if (!enabled || !query.isPending) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), WEDDING_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, query.isPending, user?.id]);

  const loadState = useMemo((): WeddingLoadState => {
    if (timedOut && query.isPending) {
      return {
        status: "error",
        message: "Taking longer than expected. Check your connection and try again.",
      };
    }
    if (query.isError) {
      return { status: "error", message: errorMessage(query.error) };
    }
    if (query.isPending) {
      return { status: "loading" };
    }
    if (query.isSuccess && query.data.wedding) {
      return { status: "loaded", wedding: query.data.wedding };
    }
    if (query.isSuccess && !query.data.wedding) {
      return { status: "empty" };
    }
    return { status: "loading" };
  }, [
    timedOut,
    query.isPending,
    query.isError,
    query.isSuccess,
    query.data,
    query.error,
  ]);

  const needsOnboarding = loadState.status === "empty";
  const rangeSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const wedding = query.data?.wedding;
    const events = query.data?.timelineEvents ?? [];
    if (!wedding || !events.length) return;

    const patches = weddingRangePatchesForEvents(wedding, events);
    if (!patches.weddingDate && !patches.endDate) return;

    const key = `${wedding.id}:${wedding.date}:${wedding.endDate}:${events.map((e) => e.id).join()}`;
    if (rangeSyncKeyRef.current === key) return;
    rangeSyncKeyRef.current = key;

    updateWedding(wedding.id, patches)
      .then(() => queryClient.invalidateQueries({ queryKey: ["wedding-bundle", user?.id] }))
      .catch(() => {
        rangeSyncKeyRef.current = null;
      });
  }, [query.data?.wedding, query.data?.timelineEvents, user?.id, queryClient]);

  useEffect(() => {
    if (!needsOnboarding) return;
    if (pathname === "/plan" || pathname === "/login") return;
    navigate({ to: "/plan", search: { onboarding: true } });
  }, [needsOnboarding, pathname, navigate]);

  const retry = useCallback(async () => {
    setTimedOut(false);
    await query.refetch();
  }, [query]);

  const createMutation = useMutation({
    mutationFn: (input: CreateWeddingInput) => createWedding(user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-bundle", user?.id] });
    },
  });

  const bundle: WeddingBundle = query.data ?? {
    wedding: null,
    vendors: [],
    guestGroups: [],
    guests: [],
    timelineEvents: [],
    budgetCategories: [],
    planningTasks: [],
    pendingSuggestions: [],
    transactions: [],
  };

  const hasPlan = bundle.planningTasks.length > 0;
  const pendingReviewCount = bundle.pendingSuggestions.filter((p) => p.status === "pending").length;

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["wedding-bundle", user?.id] });
  }, [queryClient, user?.id]);

  const value: WeddingDataContextValue = {
    ...bundle,
    loadState,
    needsOnboarding,
    hasPlan,
    pendingReviewCount,
    retry,
    createWeddingAndRefresh: async (input) => createMutation.mutateAsync(input),
    saveWeddingBasics: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (weddingId) {
        const updated = await updateWedding(weddingId, input);
        await invalidate();
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
      await invalidate();
    },
    setOnboardingMode: async (mode) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateWeddingOnboardingMode(weddingId, mode);
      await invalidate();
    },
    setTimelineDone: async (id, done) => {
      await updateTimelineEvent(id, { done });
      await invalidate();
    },
    updateTimelineEventDetails: async (id, patch) => {
      await updateTimelineEvent(id, patch);
      await invalidate();
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
      await invalidate();
    },
    updatePlanningTaskDetails: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) return;
      await updatePlanningTask(weddingId, id, patch);
      await invalidate();
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
      const result = generateSuggestions(answers, {
        categories,
        includeCommonlyMissed,
        perCategory,
        nonce,
      });
      const items = suggestionsToPendingInputs(result, weddingDate, nonce);
      await syncPendingSuggestionsBatch(weddingId, items, { categories });
      await invalidate();
    },
    saveSuggestionReviewBatch: async (answers, opts = {}) => {
      const weddingId = bundle.wedding?.id;
      const weddingDate = bundle.wedding?.date;
      if (!weddingId || !weddingDate) throw new Error("Wedding date required");
      const nonce = opts.nonce ?? 0;
      const result = generateSuggestions(answers, { nonce, perCategory: opts.perCategory ?? 4 });
      const items = suggestionsToPendingInputs(result, weddingDate, nonce);
      await syncPendingSuggestionsBatch(weddingId, items);
      await invalidate();
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
      await invalidate();
    },
    dismissSuggestion: async (id) => {
      await dismissPendingSuggestion(id);
      await invalidate();
    },
    updatePendingDate: async (id, suggestedDate) => {
      await updatePendingSuggestion(id, { suggestedDate });
      await invalidate();
    },
    addExpense: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding to add expense to");
      await insertTransaction(weddingId, input);
      await invalidate();
    },
    createVendor: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await insertVendor(weddingId, input, bundle.budgetCategories);
      await invalidate();
    },
    createGuestGroup: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      const group = await insertGuestGroup(weddingId, input);
      await invalidate();
      return group;
    },
    createGuest: async (input) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await insertGuest(weddingId, input);
      await invalidate();
    },
    updateGuestDetails: async (id, patch) => {
      const weddingId = bundle.wedding?.id;
      if (!weddingId) throw new Error("No wedding loaded");
      await updateGuest(weddingId, id, patch);
      await invalidate();
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
      await invalidate();
    },
    refresh: async () => {
      setTimedOut(false);
      await invalidate();
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
