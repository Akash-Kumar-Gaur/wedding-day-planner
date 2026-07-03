import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ScreenHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] backdrop-blur">
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h1 className="font-serif text-2xl font-medium leading-tight text-foreground">{title}</h1>
      {children}
    </header>
  );
}

export function StatusBadge({
  status,
}: {
  status: "done" | "pending" | "neutral" | "declined";
}) {
  const map = {
    done: "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[color:var(--success)] border-[color-mix(in_oklab,var(--success)_35%,transparent)]",
    pending:
      "bg-[color-mix(in_oklab,var(--warning)_22%,transparent)] text-[color:oklch(0.42_0.13_65)] border-[color-mix(in_oklab,var(--warning)_45%,transparent)]",
    neutral: "bg-muted text-muted-foreground border-border",
    declined:
      "bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[color:var(--destructive)] border-[color-mix(in_oklab,var(--destructive)_30%,transparent)]",
  } as const;
  const label = {
    done: "Confirmed",
    pending: "Pending",
    neutral: "—",
    declined: "Declined",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        map[status],
      )}
    >
      {label[status]}
    </span>
  );
}
