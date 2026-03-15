import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { TontineDetail } from "@/features/tontine/components/TontineDetail";
import { getTontine } from "@/features/tontine/server/tontineFns";

export const Route = createFileRoute("/_app/tontines/$id")({
  component: TontineDetailPage,
});

function TontineDetailPage() {
  const { id } = Route.useParams();

  const { data: tontine, isLoading, error } = useQuery({
    queryKey: ["tontine", id],
    queryFn: () => getTontine({ data: id }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tontine) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
          <h2 className="mb-2 text-lg font-medium">Tontine introuvable</h2>
          <p className="text-sm">
            Cette tontine n'existe pas ou vous n'avez pas accès.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <TontineDetail tontine={tontine} />
    </div>
  );
}
