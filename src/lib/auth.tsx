import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* PHONE_AUTH_DISABLED: re-enable for SMS login if Twilio + DLT are configured later.
function toE164India(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return `+91${digits}`;
}
*/

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("unauthenticated");
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const configError = () =>
    new Error("Supabase is not configured. Add credentials to .env (see .env.example).");

  const sendOtp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: configError() };
    const { error } = await supabase.auth.signInWithOtp({ email: normalizeEmail(email) });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!isSupabaseConfigured) return { error: configError() };
    const { error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token,
      type: "email",
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  /* PHONE_AUTH_DISABLED: SMS OTP via Twilio
  const sendOtpPhone = useCallback(async (phone: string) => {
    if (!isSupabaseConfigured) return { error: configError() };
    const { error } = await supabase.auth.signInWithOtp({ phone: toE164India(phone) });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const verifyOtpPhone = useCallback(async (phone: string, token: string) => {
    if (!isSupabaseConfigured) return { error: configError() };
    const { error } = await supabase.auth.verifyOtp({
      phone: toE164India(phone),
      token,
      type: "sms",
    });
    return { error: error ? new Error(error.message) : null };
  }, []);
  */

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: configError() };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      status,
      session,
      user,
      sendOtp,
      verifyOtp,
      signInWithGoogle,
      signOut,
    }),
    [status, session, user, sendOtp, verifyOtp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export async function getAuthSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
