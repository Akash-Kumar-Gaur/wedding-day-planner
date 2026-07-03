import type { ReactNode } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { FrameFill } from "@/components/frame-fill";
import { MobileFrame } from "@/components/mobile-frame";

function LoaderContent({
  message,
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  return (
    <FrameFill>
      <HeroBackdrop fullHeight clipRounded className="w-full">
        {children ?? (
          <div className="flex flex-col items-center px-6 text-center">
            <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
              <g className="wedding-loader-spin" style={{ transformOrigin: "60px 60px" }}>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#F4D9B8"
                  strokeWidth="1"
                  strokeDasharray="2 6"
                  opacity="0.5"
                />
              </g>
              <circle
                cx="60"
                cy="60"
                r="38"
                fill="none"
                stroke="#F4C463"
                strokeWidth="1.5"
                opacity="0.4"
                className="wedding-loader-pulse-ring"
                style={{ transformOrigin: "60px 60px" }}
              />
              <path
                d="M 32 76 A 28 28 0 0 0 88 76"
                stroke="#FBF3EC"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
              <line
                x1="26"
                y1="72"
                x2="36"
                y2="78"
                stroke="#FBF3EC"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="94"
                y1="72"
                x2="84"
                y2="78"
                stroke="#FBF3EC"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <polygon
                points="60,30 68,58 60,68 52,58"
                fill="#F4C463"
                className="wedding-loader-flicker"
                style={{ transformOrigin: "60px 55px" }}
              />
            </svg>
            {message ? (
              <p className="mt-5 font-serif text-base text-[#FBF3EC]/90">{message}</p>
            ) : null}
          </div>
        )}
      </HeroBackdrop>
    </FrameFill>
  );
}

export function WeddingLoader({ message = "Loading your wedding..." }: { message?: string }) {
  return (
    <MobileFrame>
      <div aria-busy="true" aria-label={message} className="flex flex-1 flex-col">
        <LoaderContent message={message} />
      </div>
    </MobileFrame>
  );
}

export function WeddingLoaderError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col">
        <LoaderContent>
          <div className="flex flex-col items-center px-6 text-center">
          <p className="font-serif text-lg text-[#FBF3EC]">Couldn&apos;t load your wedding</p>
          <p className="mt-2 max-w-sm text-sm text-[#FBF3EC]/80">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-medium text-white"
            style={{
              background: "#A8482E",
              boxShadow: "0 6px 16px -4px rgba(168,72,46,0.45)",
            }}
          >
            Try again
          </button>
          </div>
        </LoaderContent>
      </div>
    </MobileFrame>
  );
}
