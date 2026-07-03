import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EmblemBadge } from "@/components/emblem-badge";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { MobileFrame } from "@/components/mobile-frame";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth, type AuthError } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** Supabase default: 60s between OTP sends (Auth → Rate Limits). */
const OTP_RESEND_COOLDOWN_SECONDS = 60;

function otpRateLimitWaitSeconds(error: AuthError): number | null {
  if (error.code !== "over_email_send_rate_limit") return null;
  const match = error.message.match(/(\d+) seconds?/);
  return match ? parseInt(match[1], 10) : OTP_RESEND_COOLDOWN_SECONDS;
}

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});

function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function LoginScreen() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = isValidEmail(email);
  const emailDisplay = email.trim().toLowerCase();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const handleSendOtp = async (isResend = false) => {
    if (!emailValid) return;
    setError(null);
    setSubmitting(true);
    const { error: otpError } = await sendOtp(emailDisplay);
    setSubmitting(false);
    if (otpError) {
      const waitSeconds = otpRateLimitWaitSeconds(otpError);
      if (waitSeconds != null) {
        setResendIn(waitSeconds);
        setError(`Please wait ${waitSeconds}s before requesting another code.`);
        return;
      }
      setError(
        isResend ? "Couldn't send the code. Try again in a moment." : otpError.message,
      );
      return;
    }
    if (!isResend) setStep("otp");
    setResendIn(OTP_RESEND_COOLDOWN_SECONDS);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setError(null);
    setSubmitting(true);
    const { error: verifyError } = await verifyOtp(emailDisplay, otp);
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    navigate({ to: "/" });
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    await handleSendOtp(true);
  };

  /* GOOGLE_AUTH_DISABLED: keep handler for when Google sign-in is re-enabled.
  const handleGoogle = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError.message);
  };
  */

  return (
    <MobileFrame>
      <div className="flex min-h-screen flex-col md:min-h-[calc(100vh-3rem)]">
        <HeroBackdrop clipRounded className="h-[min(44dvh,360px)] min-h-[260px] shrink-0">
          <div className="flex flex-col items-center justify-center px-6">
            <EmblemBadge size="sm" />
            <h1 className="auth-entrance-wordmark mt-4 font-serif text-[22px] font-medium text-[#FBF3EC]">
              ShadiPlan
            </h1>
          </div>
        </HeroBackdrop>

        <div className="relative z-10 -mt-4 flex min-h-0 flex-1 flex-col rounded-t-[24px] bg-[#FBF7F0] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
          <div className="relative flex-1">
            <div
              className={cn(
                "transition-all duration-200 ease-out",
                step === "email"
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none absolute inset-0 -translate-x-3 opacity-0",
              )}
            >
              <h2 className="font-serif text-xl font-medium text-foreground">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">Log in with your email</p>

              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-foreground" htmlFor="email">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={!emailValid || submitting}
                  onClick={() => handleSendOtp()}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{
                    background: "#A8482E",
                    boxShadow: "0 6px 16px -4px rgba(168,72,46,0.45)",
                  }}
                >
                  Send OTP
                </button>

                {/* GOOGLE_AUTH_DISABLED: re-enable once Supabase Google provider + redirect URLs are configured.
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#FBF7F0] px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={handleGoogle}>
                  Continue with Google
                </Button>
                */}
              </div>
            </div>

            <div
              className={cn(
                "transition-all duration-200 ease-out",
                step === "otp"
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none absolute inset-0 translate-x-3 opacity-0",
              )}
            >
              <h2 className="font-serif text-xl font-medium text-foreground">Enter code</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                6-digit code sent to {emailDisplay}
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-11 w-10" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <button
                  type="button"
                  disabled={otp.length !== 6 || submitting}
                  onClick={handleVerify}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{
                    background: "#A8482E",
                    boxShadow: "0 6px 16px -4px rgba(168,72,46,0.45)",
                  }}
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0}
                  className={cn(
                    "w-full text-center text-sm",
                    resendIn > 0
                      ? "text-muted-foreground"
                      : "font-medium text-[#A8482E] hover:underline",
                  )}
                >
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError(null);
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Change email
                </button>
              </div>
            </div>

            {error ? (
              <p className="mt-4 text-center text-sm text-[color:var(--destructive)]">{error}</p>
            ) : null}
          </div>

          <p className="mt-auto pt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing, you agree to ShadiPlan&apos;s{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-3 flex shrink-0 justify-center" aria-hidden>
            <span
              className="h-1 w-[30%] max-w-[7.5rem] rounded-full"
              style={{ background: "rgba(0,0,0,0.13)" }}
            />
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
