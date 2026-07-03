import type { QueryClient } from "@tanstack/react-query";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";

export function createWeddingInvalidators(
  queryClient: QueryClient,
  userId: string | undefined,
  weddingId: string | undefined,
) {
  const invalidateKey = (key: readonly unknown[]) =>
    queryClient.invalidateQueries({ queryKey: key });

  return {
    meta: () => (userId ? invalidateKey(weddingQueryKeys.meta(userId)) : Promise.resolve()),
    vendors: () => (weddingId ? invalidateKey(weddingQueryKeys.vendors(weddingId)) : Promise.resolve()),
    guestGroups: () =>
      weddingId ? invalidateKey(weddingQueryKeys.guestGroups(weddingId)) : Promise.resolve(),
    guests: () => (weddingId ? invalidateKey(weddingQueryKeys.guests(weddingId)) : Promise.resolve()),
    timelineEvents: () =>
      weddingId ? invalidateKey(weddingQueryKeys.timelineEvents(weddingId)) : Promise.resolve(),
    budgetCategories: () =>
      weddingId ? invalidateKey(weddingQueryKeys.budgetCategories(weddingId)) : Promise.resolve(),
    planningTasks: () =>
      weddingId ? invalidateKey(weddingQueryKeys.planningTasks(weddingId)) : Promise.resolve(),
    pendingSuggestions: () =>
      weddingId ? invalidateKey(weddingQueryKeys.pendingSuggestions(weddingId)) : Promise.resolve(),
    transactions: () =>
      weddingId ? invalidateKey(weddingQueryKeys.transactions(weddingId)) : Promise.resolve(),
    collaborators: () =>
      weddingId ? invalidateKey(weddingQueryKeys.collaborators(weddingId)) : Promise.resolve(),
    wallet: async () => {
      if (!weddingId) return;
      await Promise.all([
        invalidateKey(weddingQueryKeys.transactions(weddingId)),
        invalidateKey(weddingQueryKeys.budgetCategories(weddingId)),
        invalidateKey(weddingQueryKeys.vendors(weddingId)),
      ]);
    },
    all: async () => {
      if (userId) await invalidateKey(weddingQueryKeys.meta(userId));
      if (!weddingId) return;
      await Promise.all([
        invalidateKey(weddingQueryKeys.vendors(weddingId)),
        invalidateKey(weddingQueryKeys.guestGroups(weddingId)),
        invalidateKey(weddingQueryKeys.guests(weddingId)),
        invalidateKey(weddingQueryKeys.timelineEvents(weddingId)),
        invalidateKey(weddingQueryKeys.budgetCategories(weddingId)),
        invalidateKey(weddingQueryKeys.planningTasks(weddingId)),
        invalidateKey(weddingQueryKeys.pendingSuggestions(weddingId)),
        invalidateKey(weddingQueryKeys.transactions(weddingId)),
        invalidateKey(weddingQueryKeys.collaborators(weddingId)),
      ]);
    },
  };
}
