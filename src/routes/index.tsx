import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/core/auth/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session?.data?.user) {
      throw redirect({ to: "/tableau-de-bord" });
    } else {
      throw redirect({ to: "/connexion" });
    }
  },
  component: () => null,
});
