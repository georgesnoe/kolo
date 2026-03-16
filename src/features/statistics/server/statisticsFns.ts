import { createServerFn } from "@tanstack/react-start";
import { eq, and, count, sum, gte, lte, inArray } from "drizzle-orm";
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
    try {
      const session = await getAuthSession();

      // Get tontines where user is creator or member
      const creatorTontines = await db
        .select({ id: tontine.id })
        .from(tontine)
        .where(eq(tontine.creatorId, session.user.id));

      const memberTontines = await db
        .select({ tontineId: tontineMember.tontineId })
        .from(tontineMember)
        .where(eq(tontineMember.userId, session.user.id));

      const tontineIds = [
        ...new Set([
          ...creatorTontines.map((t) => t.id),
          ...memberTontines.map((m) => m.tontineId),
        ]),
      ];

      // Total saved (sum of all paid payments for user's tontines)
      let totalSaved = 0;
      if (tontineIds.length > 0) {
        const paidResult = await db
          .select({ total: sum(tontinePayment.amount) })
          .from(tontinePayment)
          .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
          .where(
            and(
              eq(tontinePayment.status, "paid"),
              inArray(tontineCycle.tontineId, tontineIds)
            )
          );
        totalSaved = parseFloat(paidResult[0]?.total || "0");
      }

      // Active members across user's tontines
      let activeMembers = 0;
      if (tontineIds.length > 0) {
        const memberResult = await db
          .select({ count: count() })
          .from(tontineMember)
          .where(inArray(tontineMember.tontineId, tontineIds));
        activeMembers = memberResult[0]?.count || 0;
      }

      // Completed cycles
      let completedCycles = 0;
      if (tontineIds.length > 0) {
        const cyclesResult = await db
          .select({ count: count() })
          .from(tontineCycle)
          .where(
            and(
              eq(tontineCycle.status, "completed"),
              inArray(tontineCycle.tontineId, tontineIds)
            )
          );
        completedCycles = cyclesResult[0]?.count || 0;
      }

      // On-time payment rate
      let onTimeRate: number | null = null;
      if (tontineIds.length > 0) {
        const totalPayments = await db
          .select({ count: count() })
          .from(tontinePayment)
          .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
          .where(inArray(tontineCycle.tontineId, tontineIds));

        const onTimePayments = await db
          .select({ count: count() })
          .from(tontinePayment)
          .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
          .where(
            and(
              inArray(tontineCycle.tontineId, tontineIds),
              eq(tontinePayment.status, "paid"),
              lte(tontinePayment.paidAt, tontineCycle.dueDate)
            )
          );

        const total = totalPayments[0]?.count || 0;
        const onTime = onTimePayments[0]?.count || 0;
        onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : null;
      }

      // By tontine breakdown
      const byTontine: Array<{ name: string; totalPaid: number; count: number }> = [];
      for (const tId of tontineIds) {
        const [t] = await db
          .select({ name: tontine.name })
          .from(tontine)
          .where(eq(tontine.id, tId))
          .limit(1);

        if (t) {
          const payments = await db
            .select({ amount: tontinePayment.amount })
            .from(tontinePayment)
            .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
            .where(
              and(
                eq(tontineCycle.tontineId, tId),
                eq(tontinePayment.status, "paid")
              )
            );

          const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
          if (total > 0) {
            byTontine.push({ name: t.name, totalPaid: total, count: payments.length });
          }
        }
      }

      // Monthly trend (last 6 months)
      const monthlyTrend: Array<{ month: string; amount: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        let amount = 0;
        if (tontineIds.length > 0) {
          const monthPayments = await db
            .select({ amount: tontinePayment.amount })
            .from(tontinePayment)
            .innerJoin(tontineCycle, eq(tontinePayment.cycleId, tontineCycle.id))
            .where(
              and(
                eq(tontinePayment.status, "paid"),
                inArray(tontineCycle.tontineId, tontineIds),
                gte(tontinePayment.paidAt, monthStart),
                lte(tontinePayment.paidAt, monthEnd)
              )
            );
          amount = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        }

        const monthLabel = monthStart.toLocaleDateString("fr-FR", { month: "short" });
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
    } catch (error) {
      console.error("[getStatistics] Error:", error);
      throw error;
    }
  }
);
