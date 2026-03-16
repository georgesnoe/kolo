import { createServerFn } from "@tanstack/react-start";
import { eq, and, desc, sql } from "drizzle-orm";
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

export interface Transaction {
  id: string;
  tontineName: string;
  memberName: string;
  amount: string;
  status: string;
  cycleNumber: string;
  paidAt: Date | null;
  createdAt: Date;
  type: "in" | "out"; // in = received payment, out = sent payment
}

export const getTransactions = createServerFn({ method: "GET" }).handler(
  async (): Promise<Transaction[]> => {
    const session = await getAuthSession();

    // Get the user's member records
    const userMembers = await db
      .select({ id: tontineMember.id, tontineId: tontineMember.tontineId })
      .from(tontineMember)
      .where(eq(tontineMember.userId, session.user.id));

    const userMemberIds = userMembers.map((m) => m.id);

    if (userMemberIds.length === 0) {
      return [];
    }

    // Get all payments where user is the payer (outgoing)
    const outgoingPayments = await db
      .select({
        id: tontinePayment.id,
        amount: tontinePayment.amount,
        status: tontinePayment.status,
        paidAt: tontinePayment.paidAt,
        createdAt: tontinePayment.createdAt,
        cycleNumber: tontineCycle.cycleNumber,
        tontineName: tontine.name,
        memberName: tontineMember.name,
      })
      .from(tontinePayment)
      .innerJoin(tontineMember, eq(tontinePayment.memberId, tontineMember.id))
      .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
      .innerJoin(tontine, eq(tontineCycle.tontineId, tontine.id))
      .where(
        and(
          eq(tontinePayment.memberId, userMemberIds[0]),
          // We need to check all member IDs
          sql`${tontinePayment.memberId} IN (${sql.join(userMemberIds.map(id => sql`${id}`), sql`, `)})`
        )
      )
      .orderBy(desc(tontinePayment.createdAt));

    // Get all payments where user is the recipient (incoming) - payments to cycles where user is recipient
    const incomingPayments = await db
      .select({
        id: tontinePayment.id,
        amount: tontinePayment.amount,
        status: tontinePayment.status,
        paidAt: tontinePayment.paidAt,
        createdAt: tontinePayment.createdAt,
        cycleNumber: tontineCycle.cycleNumber,
        tontineName: tontine.name,
        memberName: tontineMember.name,
      })
      .from(tontinePayment)
      .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
      .innerJoin(tontine, eq(tontineCycle.tontineId, tontine.id))
      .innerJoin(tontineMember, eq(tontinePayment.memberId, tontineMember.id))
      .where(
        sql`${tontineCycle.recipientMemberId} IN (${sql.join(userMemberIds.map(id => sql`${id}`), sql`, `)})`
      )
      .orderBy(desc(tontinePayment.createdAt));

    const transactions: Transaction[] = [
      ...outgoingPayments.map((p) => ({
        ...p,
        type: "out" as const,
      })),
      ...incomingPayments.map((p) => ({
        ...p,
        type: "in" as const,
      })),
    ];

    // Sort by date
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return transactions;
  }
);
