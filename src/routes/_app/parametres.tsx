import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/features/profile/server/profileFns";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { IconLoader2, IconSettings } from "@tabler/icons-react";

export const Route = createFileRoute("/_app/parametres")({
  component: ParametresPage,
});

function ParametresPage() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <IconSettings className="size-6" />
        <h1 className="text-2xl font-semibold">Paramètres</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Erreur lors du chargement du profil
        </div>
      ) : profile ? (
        <ProfileForm profile={profile} />
      ) : null}
    </div>
  );
}
