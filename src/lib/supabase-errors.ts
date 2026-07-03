import type { PostgrestError } from "@supabase/supabase-js";

/** PostgREST cannot see the table — missing migration or stale schema cache. */
export function isPostgrestSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as PostgrestError;
  return (
    e.code === "PGRST205" ||
    e.code === "42P01" ||
    Boolean(e.message?.includes("schema cache")) ||
    Boolean(e.message?.includes("Could not find the table"))
  );
}
