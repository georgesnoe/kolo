import { IconCheck, IconClock, IconAlertCircle, IconX, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarkPaymentPaid } from "../hooks/useTontine";
import { cn } from "@/lib/utils";

interface PaymentRowProps {
  id: string;
  memberName: string;
  amount: string;
  status: string;
  paidAt: Date | null;
  canMarkPaid?: boolean;
}

const statusConfig: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    variant: "success" | "warning" | "destructive" | "secondary";
  }
> = {
  paid: {
    icon: <IconCheck className="size-4 text-green-500" />,
    label: "Payé",
    variant: "success",
  },
  pending: {
    icon: <IconClock className="size-4 text-muted-foreground" />,
    label: "En attente",
    variant: "warning",
  },
  late: {
    icon: <IconAlertCircle className="size-4 text-red-500" />,
    label: "En retard",
    variant: "destructive",
  },
  waived: {
    icon: <IconX className="size-4 text-muted-foreground" />,
    label: "Annulé",
    variant: "secondary",
  },
};

export function PaymentRow({
  id,
  memberName,
  amount,
  status,
  paidAt,
  canMarkPaid = false,
}: PaymentRowProps) {
  const markPaidMutation = useMarkPaymentPaid();
  const config = statusConfig[status] || statusConfig.pending;

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
      month: "short",
      year: "numeric",
    });
  };

  const handleMarkPaid = async () => {
    try {
      await markPaidMutation.mutateAsync({ data: { paymentId: id } });
    } catch (error) {
      console.error("Failed to mark payment as paid:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-border p-3 transition-colors",
        status === "paid" && "bg-green-50/50 dark:bg-green-950/20"
      )}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <p className="font-medium">{memberName}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatCurrency(amount)}</span>
            {paidAt && <span>- Payé le {formatDate(paidAt)}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={config.variant}>{config.label}</Badge>
        {canMarkPaid && status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkPaid}
            disabled={markPaidMutation.isPending}
          >
            {markPaidMutation.isPending ? (
              <IconLoader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <IconCheck className="mr-1 size-3" />
            )}
            Marquer payé
          </Button>
        )}
      </div>
    </div>
  );
}
