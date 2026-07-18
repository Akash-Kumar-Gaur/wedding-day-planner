import { useAuth } from "@/lib/auth";

/** Hardcoded allowlist — single-person admin, not a roles system. */
export const DEV_EMAILS = ["ak45hhh@gmail.com"];

export function useIsDevUser(): boolean {
  const { user } = useAuth();
  const email = user?.email?.trim().toLowerCase() ?? "";
  return DEV_EMAILS.includes(email);
}
