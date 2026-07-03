import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, ListChecks, Wallet, Store } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/vendors", label: "Vendors", icon: Store, exact: false },
  { to: "/guests", label: "Guests", icon: Users, exact: false },
  { to: "/checklist", label: "Checklist", icon: ListChecks, exact: false },
  { to: "/wallet", label: "Wallet", icon: Wallet, exact: false },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navContent = (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:rounded-t-none"
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
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(navContent, document.body);
}
