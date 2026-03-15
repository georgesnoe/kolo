import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TontineCard } from "@/features/tontine/components/TontineCard";
import { CreateTontineForm } from "@/features/tontine/components/CreateTontineForm";
import { listTontines } from "@/features/tontine/server/tontineFns";

export const Route = createFileRoute("/_app/tontines/")({
  component: TontinesPage,
});

function TontinesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: tontines, isLoading } = useQuery({
    queryKey: ["tontines"],
    queryFn: () => listTontines(),
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mes Tontines</h1>
          <p className="mt-1 text-muted-foreground">
            Gérez vos tontines et suivez les paiements
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <IconPlus className="mr-2 size-4" />
          Nouvelle tontine
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-5">
              <div className="mb-3 flex items-start justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="mb-4 h-8 w-24" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : !tontines || tontines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <IconUsers className="mb-4 size-16 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-medium">Aucune tontine</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Créez votre première tontine pour commencer à épargner ensemble
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <IconPlus className="mr-2 size-4" />
            Créer une tontine
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tontines.map((tontine) => (
            <TontineCard
              key={tontine.id}
              id={tontine.id}
              name={tontine.name}
              amount={tontine.amount}
              frequency={tontine.frequency}
              status={tontine.status}
              memberCount={tontine.memberCount}
              startDate={tontine.startDate}
            />
          ))}
        </div>
      )}

      <CreateTontineForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
    </div>
  );
}
