import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/core/auth/auth";

export const getSessionFromServer = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const request = getRequest();
      if (!request) return null;
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return null;
      return { user: session.user, session: session.session };
    } catch {
      return null;
    }
  }
);
