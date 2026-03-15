import { Link } from "@tanstack/react-router";
import { IconUsers, IconCalendar, IconArrowRight } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TontineCardProps {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  status: string;
  memberCount: number;
  startDate: Date;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Hebdomadaire",
  biweekly: "Bi-mensuel",
  monthly: "Mensuel",
};

const statusVariants: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  paused: "warning",
  completed: "secondary",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function TontineCard({
  id,
  name,
  amount,
  frequency,
  status,
  memberCount,
  startDate,
}: TontineCardProps) {
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

  return (
    <Link to="/tontines/$id" params={{ id }} className="block">
      <Card
        className={cn(
          "group transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
          "border-l-4",
          status === "active" && "border-l-green-500",
          status === "paused" && "border-l-yellow-500",
          status === "completed" && "border-l-blue-500",
          status === "cancelled" && "border-l-red-500"
        )}
      >
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-tight">{name}</h3>
            <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
          </div>

          <div className="mb-4 text-2xl font-bold text-primary">
            {formatCurrency(amount)}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <IconUsers className="size-4" />
              <span>{memberCount} membres</span>
            </div>
            <div className="flex items-center gap-1">
              <IconCalendar className="size-4" />
              <span>{frequencyLabels[frequency]}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Début : {formatDate(startDate)}
            </span>
            <IconArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
