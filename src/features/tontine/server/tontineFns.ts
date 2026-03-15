import { createServerFn } from "@tanstack/react-start";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/core/db/db";
import {
  tontine,
  tontineMember,
  tontineCycle,
  tontinePayment,
} from "@/core/db/schema";
import { auth } from "@/core/auth/auth";
import { getRequest } from "@tanstack/react-start/server";

async function getAuthSession() {
  const request = getRequest();
  if (!request) throw new Error("No request context");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Not authenticated");
  return session;
}

// List all tontines for current user
export const listTontines = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAuthSession();

  // Get tontines where user is creator
  const creatorTontines = await db
    .select()
    .from(tontine)
    .where(eq(tontine.creatorId, session.user.id));

  // Get tontines where user is member
  const memberTontines = await db
    .select({ tontine: tontine })
    .from(tontineMember)
    .innerJoin(tontine, eq(tontineMember.tontineId, tontine.id))
    .where(eq(tontineMember.userId, session.user.id));

  // Combine and deduplicate
  const allTontines = [
    ...creatorTontines,
    ...memberTontines.map((m) => m.tontine),
  ];

  // Remove duplicates by id
  const uniqueTontines = Array.from(
    new Map(allTontines.map((t) => [t.id, t])).values()
  );

  // Get member counts for each
  const result = [];
  for (const t of uniqueTontines) {
    const [{ count: memberCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tontineMember)
      .where(eq(tontineMember.tontineId, t.id));

    result.push({ ...t, memberCount });
  }

  return result;
});

// Get single tontine with full details
export const getTontine = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getAuthSession();

    const [tontineData] = await db
      .select()
      .from(tontine)
      .where(eq(tontine.id, id))
      .limit(1);

    if (!tontineData) {
      throw new Error("Tontine not found");
    }

    // Verify user has access
    if (tontineData.creatorId !== session.user.id) {
      const member = await db
        .select()
        .from(tontineMember)
        .where(
          and(
            eq(tontineMember.tontineId, id),
            eq(tontineMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (member.length === 0) {
        throw new Error("Access denied");
      }
    }

    // Get members
    const members = await db
      .select()
      .from(tontineMember)
      .where(eq(tontineMember.tontineId, id))
      .orderBy(tontineMember.turnOrder);

    // Get cycles with payments
    const cycles = await db
      .select({
        cycle: tontineCycle,
        recipient: tontineMember,
      })
      .from(tontineCycle)
      .innerJoin(tontineMember, eq(tontineCycle.recipientMemberId, tontineMember.id))
      .where(eq(tontineCycle.tontineId, id))
      .orderBy(tontineCycle.cycleNumber);

    // Get payments for each cycle
    const cyclesWithPayments = [];
    for (const { cycle, recipient } of cycles) {
      const payments = await db
        .select({
          payment: tontinePayment,
          member: tontineMember,
        })
        .from(tontinePayment)
        .innerJoin(tontineMember, eq(tontinePayment.memberId, tontineMember.id))
        .where(eq(tontinePayment.cycleId, cycle.id));

      cyclesWithPayments.push({
        ...cycle,
        recipient,
        payments: payments.map((p) => ({
          ...p.payment,
          memberName: p.member.name,
        })),
      });
    }

    return {
      ...tontineData,
      members,
      cycles: cyclesWithPayments,
      isCreator: tontineData.creatorId === session.user.id,
    };
  });

// Create new tontine
interface CreateTontineData {
  name: string;
  description?: string;
  amount: string;
  frequency: "weekly" | "biweekly" | "monthly";
  startDate: string;
  members: Array<{
    name: string;
    email?: string;
    phone?: string;
    turnOrder: number;
  }>;
}

export const createTontine = createServerFn({ method: "POST" })
  .inputValidator((data: CreateTontineData) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    // Create tontine
    const [newTontine] = await db
      .insert(tontine)
      .values({
        name: data.name,
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        startDate: new Date(data.startDate),
        creatorId: session.user.id,
      })
      .returning();

    // Add members
    const createdMembers = [];
    for (const member of data.members) {
      const [newMember] = await db
        .insert(tontineMember)
        .values({
          tontineId: newTontine.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          turnOrder: String(member.turnOrder),
        })
        .returning();
      createdMembers.push(newMember);
    }

    // Generate cycles based on frequency
    const startDate = new Date(data.startDate);
    let cycleDate = new Date(startDate);

    for (let i = 0; i < createdMembers.length; i++) {
      const member = createdMembers[i];

      await db.insert(tontineCycle).values({
        tontineId: newTontine.id,
        recipientMemberId: member.id,
        cycleNumber: String(i + 1),
        dueDate: cycleDate,
      });

      // Advance date based on frequency
      switch (data.frequency) {
        case "weekly":
          cycleDate = new Date(cycleDate.setDate(cycleDate.getDate() + 7));
          break;
        case "biweekly":
          cycleDate = new Date(cycleDate.setDate(cycleDate.getDate() + 14));
          break;
        case "monthly":
          cycleDate = new Date(cycleDate.setMonth(cycleDate.getMonth() + 1));
          break;
      }
    }

    // Create payment records for each cycle
    const cycles = await db
      .select()
      .from(tontineCycle)
      .where(eq(tontineCycle.tontineId, newTontine.id));

    for (const cycle of cycles) {
      for (const member of createdMembers) {
        // Don't create payment for the recipient of this cycle
        if (member.id !== cycle.recipientMemberId) {
          await db.insert(tontinePayment).values({
            cycleId: cycle.id,
            memberId: member.id,
            amount: data.amount,
          });
        }
      }
    }

    return newTontine;
  });

// Update tontine
interface UpdateTontineData {
  id: string;
  name?: string;
  description?: string;
  status?: "active" | "paused" | "completed" | "cancelled";
}

export const updateTontine = createServerFn({ method: "POST" })
  .inputValidator((data: UpdateTontineData) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    // Verify creator
    const [existing] = await db
      .select()
      .from(tontine)
      .where(eq(tontine.id, data.id))
      .limit(1);

    if (!existing || existing.creatorId !== session.user.id) {
      throw new Error("Access denied");
    }

    const [updated] = await db
      .update(tontine)
      .set({
        name: data.name,
        description: data.description,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(tontine.id, data.id))
      .returning();

    return updated;
  });

// Add member to tontine
interface AddMemberData {
  tontineId: string;
  name: string;
  email?: string;
  phone?: string;
  turnOrder: number;
}

export const addMember = createServerFn({ method: "POST" })
  .inputValidator((data: AddMemberData) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    // Verify creator
    const [tontineData] = await db
      .select()
      .from(tontine)
      .where(eq(tontine.id, data.tontineId))
      .limit(1);

    if (!tontineData || tontineData.creatorId !== session.user.id) {
      throw new Error("Access denied");
    }

    const [newMember] = await db
      .insert(tontineMember)
      .values({
        tontineId: data.tontineId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        turnOrder: String(data.turnOrder),
      })
      .returning();

    return newMember;
  });

// Mark payment as paid
interface MarkPaymentPaidData {
  paymentId: string;
}

export const markPaymentPaid = createServerFn({ method: "POST" })
  .inputValidator((data: MarkPaymentPaidData) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    // Get payment with cycle info
    const [paymentData] = await db
      .select({
        payment: tontinePayment,
        cycle: tontineCycle,
        tontineData: tontine,
      })
      .from(tontinePayment)
      .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
      .innerJoin(tontine, eq(tontineCycle.tontineId, tontine.id))
      .where(eq(tontinePayment.id, data.paymentId))
      .limit(1);

    if (!paymentData) {
      throw new Error("Payment not found");
    }

    // Verify user has access (creator or the member paying)
    if (paymentData.tontineData.creatorId !== session.user.id) {
      const member = await db
        .select()
        .from(tontineMember)
        .where(
          and(
            eq(tontineMember.id, paymentData.payment.memberId),
            eq(tontineMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (member.length === 0) {
        throw new Error("Access denied");
      }
    }

    const [updated] = await db
      .update(tontinePayment)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tontinePayment.id, data.paymentId))
      .returning();

    // Check if all payments for this cycle are paid
    const pendingPayments = await db
      .select()
      .from(tontinePayment)
      .where(
        and(
          eq(tontinePayment.cycleId, paymentData.cycle.id),
          eq(tontinePayment.status, "pending")
        )
      );

    if (pendingPayments.length === 0) {
      // All payments are paid, mark cycle as completed
      await db
        .update(tontineCycle)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(tontineCycle.id, paymentData.cycle.id));
    }

    return updated;
  });

// Delete tontine
export const deleteTontine = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getAuthSession();

    // Verify creator
    const [existing] = await db
      .select()
      .from(tontine)
      .where(eq(tontine.id, id))
      .limit(1);

    if (!existing || existing.creatorId !== session.user.id) {
      throw new Error("Access denied");
    }

    // Cascade delete (payments -> cycles -> members -> tontine)
    // Due to FK constraints with onDelete: cascade, deleting tontine should cascade
    await db.delete(tontine).where(eq(tontine.id, id));

    return { success: true };
  });
