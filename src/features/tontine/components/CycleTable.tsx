import { Badge } from "@/components/ui/badge";
import { IconCheck, IconClock, IconAlertCircle, IconX } from "@tabler/icons-react";

interface Payment {
  id: string;
  memberId: string;
  amount: string;
  status: string;
  paidAt: Date | null;
  memberName: string;
}

interface Cycle {
  id: string;
  cycleNumber: string;
  dueDate: Date;
  status: string;
  completedAt: Date | null;
  recipient: {
    id: string;
    name: string;
  };
  payments: Payment[];
}

interface CycleTableProps {
  cycles: Cycle[];
}

const cycleStatusIcons: Record<string, React.ReactNode> = {
  pending: <IconClock className="size-4 text-muted-foreground" />,
  in_progress: <IconAlertCircle className="size-4 text-yellow-500" />,
  completed: <IconCheck className="size-4 text-green-500" />,
  skipped: <IconX className="size-4 text-red-500" />,
};

const cycleStatusLabels: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminé",
  skipped: "Passé",
};

export function CycleTable({ cycles }: CycleTableProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (cycles.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Aucun cycle pour cette tontine
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Cycle
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Bénéficiaire
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Échéance
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Statut
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Paiements
            </th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((cycle) => {
            const paidCount = cycle.payments.filter((p) => p.status === "paid").length;
            const totalCount = cycle.payments.length;

            return (
              <tr key={cycle.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium">#{cycle.cycleNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <span>{cycle.recipient.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span>{formatDate(cycle.dueDate)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {cycleStatusIcons[cycle.status]}
                    <span>{cycleStatusLabels[cycle.status]}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {paidCount}/{totalCount}
                    </span>
                    {paidCount === totalCount && totalCount > 0 && (
                      <Badge variant="success" className="text-xs">
                        Complet
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
