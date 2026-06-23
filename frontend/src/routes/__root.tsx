import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import api from "@/api/base";
import { useAuth, useTheme } from "@/store";

import appCss from "../styles.css?url";
import { Toaster } from "sonner";

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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pharmix — B2B Pharmaceutical Platform" },
      { name: "description", content: "Professional B2B supply chain platform for the pharmaceutical industry." },
      { name: "author", content: "Pharmix" },
      { property: "og:title", content: "Pharmix — B2B Pharmaceutical Platform" },
      { property: "og:description", content: "Professional B2B supply chain platform for the pharmaceutical industry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@pharmix" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = 'dark';
                  var stored = localStorage.getItem('phx.theme');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    theme = parsed.state.theme || 'dark';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const logout = useAuth((s) => s.logout);
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("_phx_token");
      if (!token) {
        setIsAuthChecking(false);
        return;
      }

      try {
        const res = await api.get("/auth/check");
        useAuth.setState({ user: res.data.user });
      } catch (err) {
        localStorage.removeItem("_phx_token");
        logout();
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, [logout]);

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        theme={theme === "dark" ? "dark" : "light"}
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "oklch(0.18 0.014 270)" : "oklch(1 0 0)",
            border: theme === "dark" ? "1px solid oklch(1 0 0 / 0.08)" : "1px solid oklch(0 0 0 / 0.08)",
            color: theme === "dark" ? "oklch(0.96 0.005 270)" : "oklch(0.25 0.02 270)",
            userSelect: "text",
            cursor: "auto",
          },
        }}
      />
    </QueryClientProvider>
  );
}
