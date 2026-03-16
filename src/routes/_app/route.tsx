import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/core/auth/auth-client";
import { getSessionFromServer } from "@/core/auth/server-fns";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // During SSR, use server function to check session with request headers
    if (typeof window === "undefined") {
      const serverSession = await getSessionFromServer();
      if (serverSession?.user) {
        return { session: serverSession };
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
