import type { QueryClient, QueryKey } from "@tanstack/react-query";

const DEBOUNCE_MS = 400;

/** One refetch per burst of realtime events on the same query key. */
export function createDebouncedInvalidate(queryClient: QueryClient) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return (queryKey: QueryKey) => {
    const id = JSON.stringify(queryKey);
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey });
        timers.delete(id);
      }, DEBOUNCE_MS),
    );
  };
}
