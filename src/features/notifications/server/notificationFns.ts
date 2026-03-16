import { createServerFn } from "@tanstack/react-start";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/core/db/db";
import { notification } from "@/core/db/schema";
import { auth } from "@/core/auth/auth";
import { getRequest } from "@tanstack/react-start/server";

async function getAuthSession() {
  const request = getRequest();
  if (!request) throw new Error("No request context");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Not authenticated");
  return session;
}

export const getNotifications = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getAuthSession();

    const notifications = await db
      .select()
      .from(notification)
      .where(eq(notification.userId, session.user.id))
      .orderBy(desc(notification.createdAt))
      .limit(20);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount };
  }
);

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getAuthSession();

    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.id, id),
          eq(notification.userId, session.user.id)
        )
      );

    return { success: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await getAuthSession();

    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.userId, session.user.id),
          eq(notification.read, false)
        )
      );

    return { success: true };
  }
);

export const createNotification = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userId: string;
      type: "payment_due" | "payment_received" | "cycle_complete" | "member_joined" | "tontine_update";
      title: string;
      message: string;
      tontineId?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const [newNotification] = await db
      .insert(notification)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        tontineId: data.tontineId,
      })
      .returning();

    return newNotification;
  });
