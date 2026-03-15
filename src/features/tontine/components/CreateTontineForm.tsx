import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconTrash, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createTontine } from "../server/tontineFns";

interface CreateTontineFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MemberInput {
  name: string;
  email: string;
  phone: string;
  turnOrder: number;
}

export function CreateTontineForm({ open, onClose, onSuccess }: CreateTontineFormProps) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      amount: string;
      frequency: "weekly" | "biweekly" | "monthly";
      startDate: string;
      members: Array<{
        name: string;
        email?: string;
        phone?: string;
        turnOrder: number;
      }>;
    }) => createTontine({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState("");
  const [members, setMembers] = useState<MemberInput[]>([
    { name: "", email: "", phone: "", turnOrder: 1 },
    { name: "", email: "", phone: "", turnOrder: 2 },
  ]);

  const addMember = () => {
    setMembers([
      ...members,
      { name: "", email: "", phone: "", turnOrder: members.length + 1 },
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return;
    const newMembers = members.filter((_, i) => i !== index);
    // Re-order turn orders
    setMembers(newMembers.map((m, i) => ({ ...m, turnOrder: i + 1 })));
  };

  const updateMember = (index: number, field: keyof MemberInput, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMembers = members.filter((m) => m.name.trim());

    if (validMembers.length < 2) {
      alert("Veuillez ajouter au moins 2 membres");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        description: description || undefined,
        amount,
        frequency,
        startDate,
        members: validMembers.map((m, i) => ({
          name: m.name,
          email: m.email || undefined,
          phone: m.phone || undefined,
          turnOrder: i + 1,
        })),
      });

      // Reset form
      setName("");
      setDescription("");
      setAmount("");
      setFrequency("monthly");
      setStartDate("");
      setMembers([
        { name: "", email: "", phone: "", turnOrder: 1 },
        { name: "", email: "", phone: "", turnOrder: 2 },
      ]);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create tontine:", error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer une tontine"
      description="Configurez votre nouvelle tontine et ajoutez les membres"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="tontine-name" className="mb-1.5 block text-sm font-medium">
              Nom de la tontine *
            </label>
            <Input
              id="tontine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tontine famille Martin"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tontine-description" className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="tontine-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div>
            <label htmlFor="tontine-amount" className="mb-1.5 block text-sm font-medium">
              Montant par tour (XOF) *
            </label>
            <Input
              id="tontine-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="tontine-frequency" className="mb-1.5 block text-sm font-medium">
              Fréquence *
            </label>
            <select
              id="tontine-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bi-mensuel</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tontine-start" className="mb-1.5 block text-sm font-medium">
              Date de début *
            </label>
            <Input
              id="tontine-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Membres ({members.filter((m) => m.name.trim()).length})</h3>
            <Button type="button" variant="outline" size="sm" onClick={addMember}>
              <IconPlus className="mr-1 size-4" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <Input
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  placeholder="Nom du membre"
                  className="flex-1"
                />
                <Input
                  type="email"
                  value={member.email}
                  onChange={(e) => updateMember(index, "email", e.target.value)}
                  placeholder="Email (optionnel)"
                  className="hidden sm:block sm:flex-1"
                />
                <Input
                  type="tel"
                  value={member.phone}
                  onChange={(e) => updateMember(index, "phone", e.target.value)}
                  placeholder="Tél."
                  className="hidden md:block md:w-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(index)}
                  disabled={members.length <= 2}
                  className="shrink-0"
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {createMutation.isError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Erreur lors de la création de la tontine
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Créer la tontine
          </Button>
        </div>
      </form>
    </Modal>
  );
}
