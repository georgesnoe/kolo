import { createServerFn } from "@tanstack/react-start";
import { eq, and, count, sql } from "drizzle-orm";
import { db } from "@/core/db/db";
import { tontine, tontineMember, tontineCycle, tontinePayment } from "@/core/db/schema";
import { auth } from "@/core/auth/auth";
import { getRequest } from "@tanstack/react-start/server";

async function getAuthSession() {
  const request = getRequest();
  if (!request) throw new Error("No request context");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Not authenticated");
  return session;
}

interface DashboardStats {
  totalBalance: number;
  activeTontines: number;
  upcomingPayments: number;
  completedCycles: number;
}

interface UpcomingPayment {
  id: string;
  tontineName: string;
  amount: string;
  dueDate: Date;
  status: string;
}

interface RecentTontine {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  status: string;
  memberCount: number;
  nextCycle: Date | null;
}

export const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    stats: DashboardStats;
    upcomingPayments: UpcomingPayment[];
    recentTontines: RecentTontine[];
  }> => {
    const session = await getAuthSession();

    // Get active tontines count (as creator or member)
    const creatorTontines = await db
      .select({ id: tontine.id })
      .from(tontine)
      .where(
        and(eq(tontine.creatorId, session.user.id), eq(tontine.status, "active"))
      );

    const memberTontines = await db
      .select({ tontineId: tontineMember.tontineId })
      .from(tontineMember)
      .leftJoin(tontine, eq(tontineMember.tontineId, tontine.id))
      .where(
        and(
          eq(tontineMember.userId, session.user.id),
          eq(tontine.status, "active")
        )
      );

    const activeTontineIds = [
      ...creatorTontines.map((t) => t.id),
      ...memberTontines.map((m) => m.tontineId),
    ];

    // Get upcoming payments
    const upcomingPaymentsQuery = await db
      .select({
        id: tontineCycle.id,
        tontineName: tontine.name,
        amount: tontine.amount,
        dueDate: tontineCycle.dueDate,
        status: tontineCycle.status,
      })
      .from(tontineCycle)
      .innerJoin(tontine, eq(tontineCycle.tontineId, tontine.id))
      .innerJoin(tontineMember, eq(tontineCycle.recipientMemberId, tontineMember.id))
      .where(
        and(
          eq(tontine.status, "active"),
          sql`${tontineCycle.dueDate} > NOW()`,
          eq(tontineCycle.status, "pending")
        )
      )
      .orderBy(tontineCycle.dueDate)
      .limit(5);

    // Get recent tontines with member count
    const recentTontines = await db
      .select({
        id: tontine.id,
        name: tontine.name,
        amount: tontine.amount,
        frequency: tontine.frequency,
        status: tontine.status,
      })
      .from(tontine)
      .where(eq(tontine.creatorId, session.user.id))
      .orderBy(tontine.createdAt)
      .limit(5);

    // Get member counts for each tontine
    const tontinesWithCounts: RecentTontine[] = [];
    for (const t of recentTontines) {
      const [{ count: memberCount }] = await db
        .select({ count: count() })
        .from(tontineMember)
        .where(eq(tontineMember.tontineId, t.id));

      const [nextCycle] = await db
        .select({ dueDate: tontineCycle.dueDate })
        .from(tontineCycle)
        .where(
          and(
            eq(tontineCycle.tontineId, t.id),
            eq(tontineCycle.status, "pending")
          )
        )
        .orderBy(tontineCycle.dueDate)
        .limit(1);

      tontinesWithCounts.push({
        ...t,
        memberCount,
        nextCycle: nextCycle?.dueDate ?? null,
      });
    }

    // Calculate total balance (sum of paid payments for user)
    const paidPayments = await db
      .select({ amount: tontinePayment.amount })
      .from(tontinePayment)
      .innerJoin(tontineMember, eq(tontinePayment.memberId, tontineMember.id))
      .where(
        and(
          eq(tontineMember.userId, session.user.id),
          eq(tontinePayment.status, "paid")
        )
      );

    const totalBalance = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Count completed cycles
    const completedCyclesQuery = await db
      .select({ count: count() })
      .from(tontineCycle)
      .innerJoin(tontine, eq(tontineCycle.tontineId, tontine.id))
      .where(
        and(
          eq(tontine.creatorId, session.user.id),
          eq(tontineCycle.status, "completed")
        )
      );

    const stats: DashboardStats = {
      totalBalance,
      activeTontines: activeTontineIds.length,
      upcomingPayments: upcomingPaymentsQuery.length,
      completedCycles: completedCyclesQuery[0]?.count ?? 0,
    };

    return {
      stats,
      upcomingPayments: upcomingPaymentsQuery.map((p) => ({
        id: p.id,
        tontineName: p.tontineName,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status,
      })),
      recentTontines: tontinesWithCounts,
    };
  }
);
