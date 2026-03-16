import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/core/auth/auth-client";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // Small delay to ensure cookies are available on page refresh
    await new Promise((resolve) => setTimeout(resolve, 50));
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
