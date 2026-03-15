import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { addMember } from "../server/tontineFns";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  tontineId: string;
  currentMemberCount: number;
  onSuccess?: () => void;
}

export function AddMemberModal({
  open,
  onClose,
  tontineId,
  currentMemberCount,
  onSuccess,
}: AddMemberModalProps) {
  const queryClient = useQueryClient();
  const addMemberMutation = useMutation({
    mutationFn: (data: {
      tontineId: string;
      name: string;
      email?: string;
      phone?: string;
      turnOrder: number;
    }) => addMember({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontine", tontineId] });
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addMemberMutation.mutateAsync({
        tontineId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        turnOrder: currentMemberCount + 1,
      });

      // Reset form
      setName("");
      setEmail("");
      setPhone("");

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter un membre"
      description="Ajoutez un nouveau membre à cette tontine"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="member-name" className="mb-1.5 block text-sm font-medium">
            Nom du membre *
          </label>
          <Input
            id="member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            required
          />
        </div>

        <div>
          <label htmlFor="member-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="member-phone" className="mb-1.5 block text-sm font-medium">
            Téléphone
          </label>
          <Input
            id="member-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 XX XX XX XX"
          />
        </div>

        {addMemberMutation.isError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Erreur lors de l'ajout du membre
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={addMemberMutation.isPending}>
            {addMemberMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Ajouter
          </Button>
        </div>
      </form>
    </Modal>
  );
}
