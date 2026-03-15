import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/core/db/db";
import { profile } from "@/core/db/schema";
import { auth } from "@/core/auth/auth";
import { getRequest } from "@tanstack/react-start/server";
import { uploadFile, deleteFile } from "@/core/api/blob";

async function getAuthSession() {
  const request = getRequest();
  if (!request) throw new Error("No request context");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Not authenticated");
  return session;
}

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAuthSession();

  const existingProfile = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (existingProfile.length > 0) {
    return existingProfile[0];
  }

  // Auto-create profile if missing
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const [newProfile] = await db
    .insert(profile)
    .values({
      userId: session.user.id,
      displayName: session.user.name,
      trialEndsAt,
    })
    .returning();

  return newProfile;
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { displayName?: string; currency?: string; locale?: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    const [updated] = await db
      .update(profile)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profile.userId, session.user.id))
      .returning();

    return updated;
  });

export const uploadAvatar = createServerFn({ method: "POST" })
  .inputValidator((data: { file: string; contentType: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    // Get current profile to check for existing avatar
    const [currentProfile] = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, session.user.id))
      .limit(1);

    // Delete old avatar if exists
    if (currentProfile?.avatarBlobKey) {
      try {
        await deleteFile(currentProfile.avatarBlobKey);
      } catch {
        // Ignore deletion errors
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(data.file, "base64");
    const pathname = `avatars/${session.user.id}-${Date.now()}`;

    const blobKey = await uploadFile(pathname, buffer, data.contentType);

    const [updated] = await db
      .update(profile)
      .set({
        avatarBlobKey: blobKey,
        updatedAt: new Date(),
      })
      .where(eq(profile.userId, session.user.id))
      .returning();

    return updated;
  });
