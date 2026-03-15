import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "./AvatarUpload";
import { updateProfile, uploadAvatar } from "../server/profileFns";
import type { profile as ProfileTable } from "@/core/db/schema";

type Profile = typeof ProfileTable.$inferSelect;

interface ProfileFormProps {
  profile: Profile;
}

const currencies = [
  { value: "XOF", label: "XOF (Franc CFA)" },
  { value: "XAF", label: "XAF (Franc CFA)" },
  { value: "EUR", label: "EUR (Euro)" },
  { value: "USD", label: "USD (Dollar)" },
  { value: "MAD", label: "MAD (Dirham)" },
  { value: "GNF", label: "GNF (Franc guinéen)" },
  { value: "CDF", label: "CDF (Franc congolais)" },
  { value: "HTG", label: "HTG (Gourde)" },
];

export function ProfileForm({ profile: initialProfile }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(initialProfile.displayName || "");
  const [currency, setCurrency] = useState(initialProfile.currency);
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: { displayName: string; currency: string }) =>
      updateProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: ({ file, contentType }: { file: string; contentType: string }) =>
      uploadAvatar({ data: { file, contentType } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ displayName, currency });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <AvatarUpload
          currentAvatarKey={initialProfile.avatarBlobKey}
          displayName={initialProfile.displayName}
          onUpload={async (file, contentType) => {
            await avatarMutation.mutateAsync({ file, contentType });
          }}
        />
        <div className="flex-1 space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium">
              Nom affiché
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label htmlFor="currency" className="mb-1.5 block text-sm font-medium">
              Devise par défaut
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          ) : saved ? (
            <IconCheck className="mr-2 size-4" />
          ) : null}
          {saved ? "Enregistré" : "Enregistrer"}
        </Button>
        {updateMutation.isError && (
          <span className="text-sm text-destructive">Erreur lors de la sauvegarde</span>
        )}
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Abonnement</h3>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="font-medium">
              Plan {initialProfile.subscriptionTier === "free"
                ? "Gratuit"
                : initialProfile.subscriptionTier === "solo"
                  ? "Solo"
                  : initialProfile.subscriptionTier === "famille"
                    ? "Famille"
                    : "Collectif"}
            </p>
            <p className="text-sm text-muted-foreground">
              {initialProfile.subscriptionStatus === "trial"
                ? `Essai gratuit jusqu'au ${initialProfile.trialEndsAt?.toLocaleDateString("fr-FR")}`
                : initialProfile.subscriptionStatus === "active"
                  ? "Actif"
                  : initialProfile.subscriptionStatus === "cancelled"
                    ? "Annulé"
                    : "Expiré"}
            </p>
          </div>
          <Button variant="outline" size="sm">
            Mettre à niveau
          </Button>
        </div>
      </div>
    </form>
  );
}
