import { createFileRoute } from "@tanstack/react-router";
import {
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconUsers,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/statistiques")({
  component: StatistiquesPage,
});

function StatistiquesPage() {
  const isLoading = false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Statistiques</h1>
        <p className="mt-1 text-muted-foreground">
          Aperçu de vos finances et performances
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconTrendingUp className="size-4" />
              Total épargné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(0)}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconUsers className="size-4" />
              Membres actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconCalendar className="size-4" />
              Cycles complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconTrendingDown className="size-4" />
              Taux de ponctualité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartPie className="size-5" />
              Répartition par tontine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center">
                <IconChartPie className="mb-4 size-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Les graphiques apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="size-5" />
              Évolution mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center">
                <IconTrendingUp className="mb-4 size-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Les graphiques apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
