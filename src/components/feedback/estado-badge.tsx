import { Bug, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackEstado, FeedbackTipo } from "@/lib/types";

const ESTADO_STYLES: Record<FeedbackEstado, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  en_revision: "bg-amber-100 text-amber-800",
  planificada: "bg-violet-100 text-violet-800",
  resuelta: "bg-green-100 text-green-800",
  descartada: "bg-muted text-muted-foreground",
};

const ESTADO_LABELS: Record<FeedbackEstado, string> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  planificada: "Planificada",
  resuelta: "Resuelta",
  descartada: "Descartada",
};

export function FeedbackEstadoBadge({
  estado,
  className,
}: {
  estado: FeedbackEstado;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
        ESTADO_STYLES[estado],
        className
      )}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

const TIPO_LABELS: Record<FeedbackTipo, string> = {
  sugerencia: "Sugerencia",
  error: "Reporte de error",
};

const TIPO_ICONS: Record<FeedbackTipo, typeof Bug> = {
  sugerencia: Lightbulb,
  error: Bug,
};

export function FeedbackTipoBadge({ tipo }: { tipo: FeedbackTipo }) {
  const Icon = TIPO_ICONS[tipo];
  return (
    <span className="inline-flex items-center gap-1 border px-2 py-0.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      {TIPO_LABELS[tipo]}
    </span>
  );
}
