import { Link } from "@tanstack/react-router";
import {
  Camera,
  ClipboardList,
  Gift,
  LogOut,
  Megaphone,
  Menu,
  Phone,
  Shirt,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useIsDevUser } from "@/lib/dev-access";
import { cn } from "@/lib/utils";

const MENU_LINKS = [
  { to: "/outfits", label: "Outfit planner", description: "Looks by person & day", icon: Shirt },
  { to: "/gifts", label: "Gift tracker", description: "Cash gifts & thank-yous", icon: Gift },
  {
    to: "/run-sheet",
    label: "Run sheet",
    description: "Day-of minute-by-minute",
    icon: ClipboardList,
  },
  { to: "/album", label: "Photo album", description: "Guest uploads via QR", icon: Camera },
  {
    to: "/emergency-contacts",
    label: "Emergency contacts",
    description: "Vendors & day-of dial list",
    icon: Phone,
  },
  { to: "/share", label: "Share planning", description: "Invite collaborators", icon: UserPlus },
] as const;

export function MoreMenuButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const isDevUser = useIsDevUser();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted/50",
          className,
        )}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-2xl">More</SheetTitle>
          </SheetHeader>

          <nav className="mt-4 space-y-1" aria-label="More features">
            {MENU_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              );
            })}

            {isDevUser ? (
              <Link
                to="/dev-broadcast"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Megaphone className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">Broadcast push</span>
                  <span className="block text-xs text-muted-foreground">Dev only — all devices</span>
                </span>
              </Link>
            ) : null}
          </nav>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[color:var(--destructive)] transition-colors hover:bg-muted/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)]">
              <LogOut className="h-4 w-4" />
            </span>
            Sign out
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-xs text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
