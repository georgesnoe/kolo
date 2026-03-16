import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/core/auth/auth-client";
import { auth } from "@/core/auth/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getRequest } from "@tanstack/react-start/server";
import { useState } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // During SSR, use server-side auth with request headers
    if (typeof window === "undefined") {
      try {
        const request = getRequest();
        if (request) {
          const session = await auth.api.getSession({ headers: request.headers });
          if (session?.user) {
            return { session: { user: session.user, session: session.session } };
          }
        }
      } catch {
        // SSR auth failed, will redirect client-side
      }
      throw redirect({ to: "/connexion" });
    }
    // Client-side: use authClient
    const session = await authClient.getSession();
    if (!session?.data?.user) {
      throw redirect({ to: "/connexion" });
    }
    return { session: session.data };
  },
  component: AppLayout,
});

function AppLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
