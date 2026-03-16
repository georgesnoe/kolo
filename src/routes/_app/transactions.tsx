import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconCreditCard,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getTransactions } from "@/features/transactions/server/transactionFns";

export const Route = createFileRoute("/_app/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesSearch =
        !search ||
        t.tontineName.toLowerCase().includes(search.toLowerCase()) ||
        t.memberName.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, search, typeFilter]);

  const totals = useMemo(() => {
    if (!transactions) return { in: 0, out: 0 };
    return transactions.reduce(
      (acc, t) => {
        const amount = parseFloat(t.amount);
        if (t.type === "in") acc.in += amount;
        else acc.out += amount;
        return acc;
      },
      { in: 0, out: 0 }
    );
  }, [transactions]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-muted-foreground">
          Historique de vos paiements et contributions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconArrowDownLeft className="size-4" />
              Entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totals.in)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconArrowUpRight className="size-4" />
              Sorties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totals.out)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconCreditCard className="size-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.in + totals.out)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            Tout
          </Button>
          <Button
            variant={typeFilter === "in" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("in")}
          >
            <IconArrowDownLeft className="mr-1 size-4" />
            Entrées
          </Button>
          <Button
            variant={typeFilter === "out" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("out")}
          >
            <IconArrowUpRight className="mr-1 size-4" />
            Sorties
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="size-5" />
            Historique ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <IconCreditCard className="mb-4 size-16 text-muted-foreground" />
              <h2 className="mb-2 text-lg font-medium">Aucune transaction</h2>
              <p className="text-sm text-muted-foreground">
                {transactions?.length
                  ? "Aucune transaction ne correspond à vos filtres"
                  : "Vos transactions apparaîtront ici"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${
                        tx.type === "in"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "in" ? (
                        <IconArrowDownLeft className="size-5" />
                      ) : (
                        <IconArrowUpRight className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.tontineName}</p>
                      <p className="text-sm text-muted-foreground">
                        Cycle {tx.cycleNumber} — {tx.memberName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === "in"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "in" ? "+" : "-"}
                      {formatCurrency(parseFloat(tx.amount))}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tx.status === "paid"
                            ? "success"
                            : tx.status === "pending"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {tx.status === "paid"
                          ? "Payé"
                          : tx.status === "pending"
                            ? "En attente"
                            : tx.status === "late"
                              ? "En retard"
                              : "Annulé"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.paidAt || tx.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
