import { createServerFn } from "@tanstack/react-start";
import { eq, and, gte, lte, sql } from "drizzle-orm";
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

export interface Statistics {
  totalSaved: number;
  activeMembers: number;
  completedCycles: number;
  onTimeRate: number | null;
  byTontine: Array<{
    name: string;
    totalPaid: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

export const getStatistics = createServerFn({ method: "GET" }).handler(
  async (): Promise<Statistics> => {
    const session = await getAuthSession();

    // Get tontines where user is creator
    const creatorTontines = await db
      .select({ id: tontine.id, name: tontine.name })
      .from(tontine)
      .where(eq(tontine.creatorId, session.user.id));

    // Get tontine IDs
    const tontineIds = creatorTontines.map((t) => t.id);

    // Initialize totals
    let totalSaved = 0;
    let activeMembers = 0;
    let completedCycles = 0;
    let totalPaymentsCount = 0;
    let onTimePaymentsCount = 0;
    const byTontine: Array<{ name: string; totalPaid: number; count: number }> = [];

    // Process each tontine
    for (const { id: tId, name: tName } of creatorTontines) {
      // Count members
      const [memberCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tontineMember)
        .where(eq(tontineMember.tontineId, tId));
      activeMembers += memberCount?.count || 0;

      // Count completed cycles
      const [cycleCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tontineCycle)
        .where(
          and(
            eq(tontineCycle.tontineId, tId),
            eq(tontineCycle.status, "completed")
          )
        );
      completedCycles += cycleCount?.count || 0;

      // Get paid payments for this tontine
      const paidPayments = await db
        .select({
          amount: tontinePayment.amount,
          paidAt: tontinePayment.paidAt,
          dueDate: tontineCycle.dueDate,
        })
        .from(tontinePayment)
        .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
        .where(
          and(
            eq(tontineCycle.tontineId, tId),
            eq(tontinePayment.status, "paid")
          )
        );

      const tontineTotal = paidPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount || "0"),
        0
      );
      totalSaved += tontineTotal;

      // Track for byTontine breakdown
      if (tontineTotal > 0) {
        byTontine.push({
          name: tName,
          totalPaid: tontineTotal,
          count: paidPayments.length,
        });
      }

      // Count on-time payments
      for (const p of paidPayments) {
        totalPaymentsCount++;
        if (p.paidAt && p.dueDate && new Date(p.paidAt) <= new Date(p.dueDate)) {
          onTimePaymentsCount++;
        }
      }
    }

    // Calculate on-time rate
    const onTimeRate =
      totalPaymentsCount > 0
        ? Math.round((onTimePaymentsCount / totalPaymentsCount) * 100)
        : null;

    // Monthly trend (last 6 months)
    const monthlyTrend: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      let amount = 0;
      for (const tId of tontineIds) {
        const monthPayments = await db
          .select({ amount: tontinePayment.amount })
          .from(tontinePayment)
          .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
          .where(
            and(
              eq(tontineCycle.tontineId, tId),
              eq(tontinePayment.status, "paid"),
              gte(tontinePayment.paidAt, monthStart),
              lte(tontinePayment.paidAt, monthEnd)
            )
          );
        amount += monthPayments.reduce(
          (sum, p) => sum + parseFloat(p.amount || "0"),
          0
        );
      }

      const monthLabel = monthStart.toLocaleDateString("fr-FR", {
        month: "short",
      });
      monthlyTrend.push({ month: monthLabel, amount });
    }

    return {
      totalSaved,
      activeMembers,
      completedCycles,
      onTimeRate,
      byTontine,
      monthlyTrend,
    };
  }
);
