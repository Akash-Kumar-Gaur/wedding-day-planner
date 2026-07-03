import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Users, ListChecks, Wallet, Store } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/vendors", label: "Vendors", icon: Store, exact: false },
  { to: "/guests", label: "Guests", icon: Users, exact: false },
  { to: "/checklist", label: "Checklist", icon: ListChecks, exact: false },
  { to: "/wallet", label: "Wallet", icon: Wallet, exact: false },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-sm md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-3xl md:border md:shadow-lg">
        <main className="flex-1 pb-24">{children ?? <Outlet />}</main>

        <nav
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:bottom-0 md:translate-x-0 md:rounded-b-3xl"
          aria-label="Primary"
        >
          <ul className="grid grid-cols-5">
            {TABS.map((tab) => {
              const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
              const Icon = tab.icon;
              return (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
                    <span>{tab.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

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