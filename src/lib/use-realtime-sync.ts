import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { createDebouncedInvalidate } from "@/lib/debounce-invalidate";
import { realtimeTableQueryKey } from "@/lib/wedding-query-keys";

const REALTIME_TABLES = Object.keys(realtimeTableQueryKey) as Array<
  keyof typeof realtimeTableQueryKey
>;

export function useRealtimeSync(weddingId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const debouncedInvalidate = useMemo(
    () => createDebouncedInvalidate(queryClient),
    [queryClient],
  );

  useEffect(() => {
    if (!weddingId || !user?.id) return;

    const channel = supabase.channel(`wedding-${weddingId}`);

    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `wedding_id=eq.${weddingId}`,
        },
        () => {
          debouncedInvalidate(realtimeTableQueryKey[table](weddingId));
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weddingId, user?.id, debouncedInvalidate]);
}
