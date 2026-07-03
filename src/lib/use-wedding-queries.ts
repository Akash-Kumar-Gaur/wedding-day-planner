import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Wedding } from "@/data/wedding-types";
import {
  applyActualsFromTransactions,
  fetchBudgetCategories,
  fetchCollaborators,
  fetchGuestGroups,
  fetchGuests,
  fetchPendingSuggestions,
  fetchPlanningTasks,
  fetchTimelineEvents,
  fetchTransactions,
  fetchVendors,
  mergeTransactionSources,
  resolveUserWedding,
} from "@/lib/wedding-api";
import { isPostgrestSchemaError } from "@/lib/supabase-errors";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";

type WeddingMeta = {
  wedding: Wedding | null;
  isOwner: boolean;
};

export function useWeddingQueries(
  userId: string | undefined,
  userEmail: string,
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const metaQuery = useQuery({
    queryKey: weddingQueryKeys.meta(userId ?? ""),
    queryFn: async (): Promise<WeddingMeta> => {
      const wedding = await resolveUserWedding(userId!, userEmail);
      return {
        wedding,
        isOwner: wedding ? wedding.ownerId === userId : false,
      };
    },
    enabled: enabled && !!userId,
    retry: (failureCount, error) =>
      !isPostgrestSchemaError(error) && failureCount < 2,
    refetchOnWindowFocus: (q) => {
      if (q.state.error && isPostgrestSchemaError(q.state.error)) return false;
      return true;
    },
  });

  const weddingId = metaQuery.data?.wedding?.id;
  const tablesEnabled = enabled && !!weddingId;

  const vendorsQuery = useQuery({
    queryKey: weddingQueryKeys.vendors(weddingId ?? ""),
    queryFn: () => fetchVendors(weddingId!),
    enabled: tablesEnabled,
  });
  const guestGroupsQuery = useQuery({
    queryKey: weddingQueryKeys.guestGroups(weddingId ?? ""),
    queryFn: () => fetchGuestGroups(weddingId!),
    enabled: tablesEnabled,
  });
  const guestsQuery = useQuery({
    queryKey: weddingQueryKeys.guests(weddingId ?? ""),
    queryFn: () => fetchGuests(weddingId!),
    enabled: tablesEnabled,
  });
  const timelineEventsQuery = useQuery({
    queryKey: weddingQueryKeys.timelineEvents(weddingId ?? ""),
    queryFn: () => fetchTimelineEvents(weddingId!),
    enabled: tablesEnabled,
  });
  const budgetCategoriesQuery = useQuery({
    queryKey: weddingQueryKeys.budgetCategories(weddingId ?? ""),
    queryFn: () => fetchBudgetCategories(weddingId!),
    enabled: tablesEnabled,
  });
  const planningTasksQuery = useQuery({
    queryKey: weddingQueryKeys.planningTasks(weddingId ?? ""),
    queryFn: () => fetchPlanningTasks(weddingId!),
    enabled: tablesEnabled,
  });
  const pendingSuggestionsQuery = useQuery({
    queryKey: weddingQueryKeys.pendingSuggestions(weddingId ?? ""),
    queryFn: () => fetchPendingSuggestions(weddingId!),
    enabled: tablesEnabled,
  });
  const transactionsQuery = useQuery({
    queryKey: weddingQueryKeys.transactions(weddingId ?? ""),
    queryFn: () => fetchTransactions(weddingId!),
    enabled: tablesEnabled,
  });
  const collaboratorsQuery = useQuery({
    queryKey: weddingQueryKeys.collaborators(weddingId ?? ""),
    queryFn: () => fetchCollaborators(weddingId!),
    enabled: tablesEnabled,
  });

  const vendors = vendorsQuery.data ?? [];
  const budgetCategoriesRaw = budgetCategoriesQuery.data ?? [];
  const dbTransactions = transactionsQuery.data ?? [];

  const transactions = useMemo(
    () => mergeTransactionSources(dbTransactions, vendors, budgetCategoriesRaw),
    [dbTransactions, vendors, budgetCategoriesRaw],
  );

  const budgetCategories = useMemo(
    () => applyActualsFromTransactions(budgetCategoriesRaw, transactions),
    [budgetCategoriesRaw, transactions],
  );

  const tablePending =
    tablesEnabled &&
    (vendorsQuery.isPending ||
      guestGroupsQuery.isPending ||
      guestsQuery.isPending ||
      timelineEventsQuery.isPending ||
      budgetCategoriesQuery.isPending ||
      planningTasksQuery.isPending ||
      pendingSuggestionsQuery.isPending ||
      transactionsQuery.isPending ||
      collaboratorsQuery.isPending);

  const tableError =
    vendorsQuery.error ??
    guestGroupsQuery.error ??
    guestsQuery.error ??
    timelineEventsQuery.error ??
    budgetCategoriesQuery.error ??
    planningTasksQuery.error ??
    pendingSuggestionsQuery.error ??
    transactionsQuery.error ??
    collaboratorsQuery.error;

  const refetchTables = useCallback(async () => {
    if (!weddingId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.vendors(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.guestGroups(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.guests(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.timelineEvents(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.budgetCategories(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.planningTasks(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.pendingSuggestions(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.transactions(weddingId) }),
      queryClient.invalidateQueries({ queryKey: weddingQueryKeys.collaborators(weddingId) }),
    ]);
  }, [queryClient, weddingId]);

  return {
    weddingId,
    wedding: metaQuery.data?.wedding ?? null,
    isOwner: metaQuery.data?.isOwner ?? false,
    collaborators: collaboratorsQuery.data ?? [],
    vendors,
    guestGroups: guestGroupsQuery.data ?? [],
    guests: guestsQuery.data ?? [],
    timelineEvents: timelineEventsQuery.data ?? [],
    budgetCategories,
    planningTasks: planningTasksQuery.data ?? [],
    pendingSuggestions: pendingSuggestionsQuery.data ?? [],
    transactions,
    isPending: metaQuery.isPending || tablePending,
    isError: metaQuery.isError || !!tableError,
    error: metaQuery.error ?? tableError,
    isSuccess: metaQuery.isSuccess && (!tablesEnabled || !tablePending),
    refetchMeta: metaQuery.refetch,
    refetchTables,
  };
}
