import {
  Bug,
  CircleCheck,
  ClipboardList,
  Inbox,
  MessageSquareReply,
  MessagesSquare,
  OctagonAlert,
  TriangleAlert,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import type { PrioridadNotificacion, TipoNotificacion } from "@/lib/types";

const ICONS: Record<TipoNotificacion, ComponentType<SVGProps<SVGSVGElement>>> = {
  lead_nuevo: Inbox,
  lead_asignado: UserPlus,
  lead_quitado: UserMinus,
  avance_pendiente: ClipboardList,
  feedback_error: Bug,
  feedback_nuevo: MessagesSquare,
  feedback_respuesta: MessageSquareReply,
  incidente: TriangleAlert,
  incidente_resuelto: CircleCheck,
};

// Mismos tonos que los badges de la bandeja: verde para lo que entra, ámbar
// para lo que pide una acción, rojo para lo que se perdió o falló.
const STYLES: Record<TipoNotificacion, string> = {
  lead_nuevo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lead_asignado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lead_quitado: "border-red-200 bg-red-50 text-red-700",
  avance_pendiente: "border-amber-200 bg-amber-50 text-amber-800",
  feedback_error: "border-red-200 bg-red-50 text-red-700",
  feedback_nuevo: "border-sky-200 bg-sky-50 text-sky-700",
  feedback_respuesta: "border-sky-200 bg-sky-50 text-sky-700",
  incidente: "border-amber-200 bg-amber-50 text-amber-800",
  incidente_resuelto: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

// Los críticos no se parecen a nada más: fondo rojo lleno.
const CRITICO = "border-red-700 bg-red-600 text-white";

export const TIPO_LABELS: Record<TipoNotificacion, string> = {
  lead_nuevo: "Consulta nueva",
  lead_asignado: "Consulta asignada",
  lead_quitado: "Consulta reasignada",
  avance_pendiente: "Pedido de avance",
  feedback_error: "Error reportado",
  feedback_nuevo: "Feedback nuevo",
  feedback_respuesta: "Respuesta en feedback",
  incidente: "Incidente del agente",
  incidente_resuelto: "Incidente resuelto",
};

export function NotificacionIcon({
  tipo,
  prioridad = "normal",
  className,
}: {
  tipo: TipoNotificacion;
  prioridad?: PrioridadNotificacion;
  className?: string;
}) {
  const critico = prioridad === "alta";
  const Icon = critico ? OctagonAlert : (ICONS[tipo] ?? Inbox);
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center border",
        critico ? CRITICO : (STYLES[tipo] ?? STYLES.lead_nuevo),
        className
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}
