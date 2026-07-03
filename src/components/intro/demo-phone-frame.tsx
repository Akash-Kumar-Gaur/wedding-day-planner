import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mini phone-frame preview for marketing demos — not the app shell MobileFrame. */
export function DemoPhoneFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[430px] overflow-hidden rounded-3xl border border-border bg-background shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
