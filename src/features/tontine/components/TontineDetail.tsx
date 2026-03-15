import { useState } from "react";
import {
  IconUsers,
  IconCalendar,
  IconTrash,
  IconUserPlus,
  IconLoader2,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CycleTable } from "./CycleTable";
import { PaymentRow } from "./PaymentRow";
import { AddMemberModal } from "./AddMemberModal";
import { updateTontine, deleteTontine } from "../server/tontineFns";
import { cn } from "@/lib/utils";

interface TontineDetailProps {
  tontine: {
    id: string;
    name: string;
    description: string | null;
    amount: string;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    creatorId: string;
    createdAt: Date;
    members: Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      turnOrder: string;
      userId: string | null;
    }>;
    cycles: Array<{
      id: string;
      cycleNumber: string;
      dueDate: Date;
      status: string;
      completedAt: Date | null;
      recipient: {
        id: string;
        name: string;
      };
      payments: Array<{
        id: string;
        memberId: string;
        amount: string;
        status: string;
        paidAt: Date | null;
        memberName: string;
      }>;
    }>;
    isCreator: boolean;
  };
}

const frequencyLabels: Record<string, string> = {
  weekly: "Hebdomadaire",
  biweekly: "Bi-mensuel",
  monthly: "Mensuel",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
  cancelled: "Annulée",
};

const statusVariants: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  paused: "warning",
  completed: "secondary",
  cancelled: "destructive",
};

export function TontineDetail({ tontine }: TontineDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState<"cycles" | "members">("cycles");

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; status: "active" | "paused" | "completed" | "cancelled" }) =>
      updateTontine({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
      queryClient.invalidateQueries({ queryKey: ["tontine", tontine.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTontine({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
      navigate({ to: "/tontines" });
    },
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleStatusChange = async (status: "active" | "paused" | "completed" | "cancelled") => {
    try {
      await updateMutation.mutateAsync({ id: tontine.id, status });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tontine ? Cette action est irréversible.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(tontine.id);
    } catch (error) {
      console.error("Failed to delete tontine:", error);
    }
  };

  // Get the next cycle and its payments
  const nextCycle = tontine.cycles.find((c) => c.status === "pending" || c.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/tontines"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="mr-1 size-4" />
            Retour aux tontines
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{tontine.name}</h1>
            <Badge variant={statusVariants[tontine.status]}>{statusLabels[tontine.status]}</Badge>
          </div>
          {tontine.description && (
            <p className="mt-1 text-muted-foreground">{tontine.description}</p>
          )}
        </div>

        {tontine.isCreator && (
          <div className="flex gap-2">
            {tontine.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("paused")}
                disabled={updateMutation.isPending}
              >
                Mettre en pause
              </Button>
            )}
            {tontine.status === "paused" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={updateMutation.isPending}
              >
                Reprendre
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <IconLoader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <IconTrash className="mr-1 size-4" />
              )}
              Supprimer
            </Button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Montant par tour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(tontine.amount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconCalendar className="size-4" />
              Fréquence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{frequencyLabels[tontine.frequency]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <IconUsers className="size-4" />
              Membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tontine.members.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Payment */}
      {nextCycle && tontine.status === "active" && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Paiements en cours - Cycle #{nextCycle.cycleNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Bénéficiaire : {nextCycle.recipient.name} - Échéance : {formatDate(nextCycle.dueDate)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextCycle.payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  id={payment.id}
                  memberName={payment.memberName}
                  amount={payment.amount}
                  status={payment.status}
                  paidAt={payment.paidAt}
                  canMarkPaid={tontine.isCreator}
                />
              ))}
              {nextCycle.payments.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Aucun paiement en attente pour ce cycle
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("cycles")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "cycles"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Cycles ({tontine.cycles.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Membres ({tontine.members.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "cycles" && (
        <Card>
          <CardContent className="pt-6">
            <CycleTable cycles={tontine.cycles} />
          </CardContent>
        </Card>
      )}

      {activeTab === "members" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Liste des membres</CardTitle>
              {tontine.isCreator && tontine.status === "active" && (
                <Button size="sm" onClick={() => setShowAddMember(true)}>
                  <IconUserPlus className="mr-1 size-4" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tontine.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {member.turnOrder}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        {member.email && <span>{member.email}</span>}
                        {member.phone && <span>{member.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        tontineId={tontine.id}
        currentMemberCount={tontine.members.length}
      />
    </div>
  );
}
