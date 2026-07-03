import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Sizes content to fill MobileFrame's inner card so child `height: 100%` resolves correctly. */
export function FrameFill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-1 flex-col md:min-h-[calc(100vh-3rem)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
