import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  IconWallet,
  IconUsers,
  IconCalendar,
  IconTrendingUp,
  IconPlus,
  IconArrowRight,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/features/dashboard/server/dashboardFns";

export const Route = createFileRoute("/_app/tableau-de-bord")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardStats(),
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "weekly":
        return "Hebdomadaire";
      case "biweekly":
        return "Bi-mensuel";
      case "monthly":
        return "Mensuel";
      default:
        return freq;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "paused":
        return <Badge variant="warning">En pause</Badge>;
      case "completed":
        return <Badge variant="secondary">Terminée</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, upcomingPayments, recentTontines } = data;

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <div className="flex gap-2">
          <Link to="/tontines">
            <Button>
              <IconPlus className="mr-2 size-4" />
              Nouvelle tontine
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconWallet className="size-4" />
              Solde total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconUsers className="size-4" />
              Tontines actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeTontines}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconCalendar className="size-4" />
              Paiements à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.upcomingPayments}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconTrendingUp className="size-4" />
              Cycles terminés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completedCycles}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Paiements à venir</span>
              <Link to="/tontines">
                <Button variant="ghost" size="sm">
                  Voir tout
                  <IconArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun paiement à venir
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{payment.tontineName}</p>
                      <p className="text-sm text-muted-foreground">
                        Échéance : {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(parseFloat(payment.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tontines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mes tontines</span>
              <Link to="/tontines">
                <Button variant="ghost" size="sm">
                  Voir tout
                  <IconArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTontines.length === 0 ? (
              <div className="py-8 text-center">
                <IconUsers className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="mb-4 text-sm text-muted-foreground">
                  Vous n'avez pas encore de tontines
                </p>
                <Link to="/tontines">
                  <Button>
                    <IconPlus className="mr-2 size-4" />
                    Créer une tontine
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTontines.map((tontine) => (
                  <Link
                    key={tontine.id}
                    to="/tontines/$id"
                    params={{ id: tontine.id }}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{tontine.name}</p>
                      {getStatusBadge(tontine.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatCurrency(parseFloat(tontine.amount))}</span>
                      <span>{getFrequencyLabel(tontine.frequency)}</span>
                      <span>{tontine.memberCount} membres</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
