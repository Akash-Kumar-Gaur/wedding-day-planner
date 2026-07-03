import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { MobileFrame } from "@/components/mobile-frame";

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <MobileFrame>
      <div className="flex min-h-screen flex-1 flex-col md:min-h-[calc(100vh-3rem)]">
        <main className="flex-1 pb-24">{children ?? <Outlet />}</main>
        <BottomNav />
      </div>
    </MobileFrame>
  );
}

export { ScreenHeader, StatusBadge } from "@/components/screen-header";
