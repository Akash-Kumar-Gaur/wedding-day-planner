import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Diya icon — bowl arc opens upward toward the flame (matches wedding-loader orientation). */
function DiyaIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <polygon points="24,12 27.2,23.2 24,27.2 20.8,23.2" fill="#F4C463" />
      <path
        d="M 12.8 30.4 A 11.2 11.2 0 0 0 35.2 30.4"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="10.4"
        y1="28.8"
        x2="7.2"
        y2="25.6"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <line
        x1="37.6"
        y1="28.8"
        x2="40.8"
        y2="25.6"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const sizeMap = {
  lg: { outer: 96, icon: 52 },
  sm: { outer: 64, icon: 36 },
} as const;

export function EmblemBadge({
  size = "lg",
  className,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const { outer, icon } = sizeMap[size];

  return (
    <div
      className={cn("auth-entrance flex items-center justify-center rounded-full", className)}
      style={{
        width: outer,
        height: outer,
        background: "rgba(255,255,255,0.14)",
      }}
    >
      <DiyaIcon className="text-[#FBF3EC]" style={{ width: icon, height: icon }} />
    </div>
  );
}
