import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HeroBackdrop({
  children,
  fullHeight = false,
  className,
  clipRounded = false,
}: {
  children?: ReactNode;
  fullHeight?: boolean;
  className?: string;
  clipRounded?: boolean;
}) {
  return (
    <div
      className={cn(clipRounded && "overflow-hidden md:rounded-t-3xl", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        height: fullHeight ? "100%" : undefined,
        minHeight: fullHeight ? "100%" : undefined,
        flex: fullHeight ? 1 : undefined,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "linear-gradient(160deg, #6B2C1F 0%, #A8482E 55%, #D68A4A 100%)",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        <circle cx="230" cy="60" r="90" fill="none" stroke="#F4D9B8" strokeWidth="1" opacity="0.2" />
        <circle cx="230" cy="60" r="60" fill="none" stroke="#F4D9B8" strokeWidth="1" opacity="0.25" />
        <circle cx="36" cy="48" r="2.5" fill="#F4D9B8" opacity="0.45" />
        <circle cx="60" cy="200" r="2" fill="#F4D9B8" opacity="0.45" />
        <circle cx="20" cy="150" r="2.5" fill="#F4D9B8" opacity="0.45" />
      </svg>
      <div className="relative flex flex-1 flex-col items-center justify-center">{children}</div>
    </div>
  );
}
