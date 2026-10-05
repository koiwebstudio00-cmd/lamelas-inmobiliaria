import { Bug, ClipboardList, Inbox, UserMinus, UserPlus } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import type { TipoNotificacion } from "@/lib/types";

const ICONS: Record<TipoNotificacion, ComponentType<SVGProps<SVGSVGElement>>> = {
  lead_nuevo: Inbox,
  lead_asignado: UserPlus,
  lead_quitado: UserMinus,
  avance_pendiente: ClipboardList,
  feedback_error: Bug,
};

// Mismos tonos que los badges de la bandeja: verde para lo que entra, ámbar
// para lo que pide una acción, rojo para lo que se perdió o falló.
const STYLES: Record<TipoNotificacion, string> = {
  lead_nuevo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lead_asignado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lead_quitado: "border-red-200 bg-red-50 text-red-700",
  avance_pendiente: "border-amber-200 bg-amber-50 text-amber-800",
  feedback_error: "border-red-200 bg-red-50 text-red-700",
};

export const TIPO_LABELS: Record<TipoNotificacion, string> = {
  lead_nuevo: "Consulta nueva",
  lead_asignado: "Consulta asignada",
  lead_quitado: "Consulta reasignada",
  avance_pendiente: "Pedido de avance",
  feedback_error: "Reporte de error",
};

export function NotificacionIcon({
  tipo,
  className,
}: {
  tipo: TipoNotificacion;
  className?: string;
}) {
  const Icon = ICONS[tipo] ?? Inbox;
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center border",
        STYLES[tipo] ?? STYLES.lead_nuevo,
        className
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}
