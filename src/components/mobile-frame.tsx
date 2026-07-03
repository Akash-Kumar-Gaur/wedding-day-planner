import type { ReactNode } from "react";

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-3xl md:border md:border-border md:shadow-lg">
        {children}
      </div>
    </div>
  );
}
