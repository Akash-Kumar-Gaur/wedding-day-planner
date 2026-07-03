import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/app-shell";
import { WeddingLoader, WeddingLoaderError } from "../components/wedding-loader";
import { Toaster } from "../components/ui/sonner";
import { AuthProvider, useAuth } from "../lib/auth";
import { WeddingDataProvider, useWeddingData } from "../lib/wedding-data";
import { WeddingPlanProvider } from "../lib/wedding-plan-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "ShadiPlan — Plan your multi-day wedding" },
      { name: "description", content: "A warm, editorial logistics dashboard for planning a multi-day, multi-venue wedding — vendors, guests, checklist and budget in one place." },
      { name: "author", content: "ShadiPlan" },
      { property: "og:title", content: "ShadiPlan" },
      { property: "og:description", content: "Your personal logistics dashboard for a multi-day wedding." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "theme-color", content: "#FBF7F0" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "ShadiPlan" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh w-full overflow-x-hidden">
        {children}
        <Toaster position="top-center" />
        <Scripts />
      </body>
    </html>
  );
}

function AuthenticatedShell() {
  const { loadState, retry } = useWeddingData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loadState.status === "loading") {
    return <WeddingLoader />;
  }

  if (loadState.status === "error") {
    return <WeddingLoaderError message={loadState.message} onRetry={retry} />;
  }

  if (loadState.status === "empty") {
    if (pathname === "/plan") {
      return (
        <WeddingPlanProvider weddingId={null}>
          <AppShell>
            <Outlet />
          </AppShell>
        </WeddingPlanProvider>
      );
    }
    return <WeddingLoader message="Setting up your plan..." />;
  }

  return (
    <WeddingPlanProvider weddingId={loadState.wedding.id}>
      <AppShell>
        <Outlet />
      </AppShell>
    </WeddingPlanProvider>
  );
}

function AuthenticatedApp() {
  return (
    <WeddingDataProvider>
      <AuthenticatedShell />
    </WeddingDataProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const { status } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      navigate({ to: "/login" });
    }
    if (status === "authenticated" && pathname === "/login") {
      navigate({ to: "/" });
    }
  }, [status, pathname, navigate]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed:", err);
      });
    }
  }, []);

  if (status === "loading") {
    return <WeddingLoader message="Starting ShadiPlan..." />;
  }

  if (status === "unauthenticated") {
    if (pathname !== "/login") return null;
    return <Outlet />;
  }

  if (pathname === "/login") {
    return null;
  }

  return <AuthenticatedApp />;
}
