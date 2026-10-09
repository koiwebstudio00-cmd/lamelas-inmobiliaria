import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incidente, IncidenteTipo } from "@/lib/types";

export const INCIDENTE_TIPO_LABELS: Record<IncidenteTipo, string> = {
  n8n_ejecucion: "Error en n8n",
  n8n_sin_respuesta: "n8n no responde",
  n8n_sin_senal: "n8n sin señales",
  whatsapp_desconectado: "WhatsApp desconectado",
};

/** Qué hacer con cada tipo. Lo leen admins que quizá no tienen acceso a n8n o Zernio. */
export const INCIDENTE_AYUDA: Record<IncidenteTipo, string> = {
  n8n_ejecucion:
    "Un paso del agente falló en n8n. Abrí la ejecución para ver el detalle y, cuando esté corregido, marcalo como resuelto.",
  n8n_sin_respuesta:
    "El sistema no puede entregarle los mensajes de WhatsApp a n8n, así que Sofía no responde. Hay que revisar que n8n esté funcionando y el workflow de WhatsApp publicado. Se resuelve solo cuando n8n vuelve a responder.",
  n8n_sin_senal:
    "n8n dejó de dar señales de vida: puede estar caído o el workflow lamelas-agente-vencidos quedó despublicado. Se resuelve solo con la próxima señal.",
  whatsapp_desconectado:
    "La cuenta de WhatsApp se desconectó de Zernio y los mensajes no llegan al sistema. Hay que reconectarla desde Zernio con el teléfono de la inmobiliaria. Se resuelve solo cuando Zernio la vuelve a ver conectada.",
};

export function GravedadBadge({ incidente }: { incidente: Pick<Incidente, "gravedad" | "estado"> }) {
  if (incidente.estado === "resuelto") {
    return (
      <span className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
        <CircleCheck className="size-3.5" /> Resuelto
      </span>
    );
  }
  const critica = incidente.gravedad === "critica";
  const Icon = critica ? OctagonAlert : TriangleAlert;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium",
        critica ? "border-red-700 bg-red-600 text-white" : "border-amber-200 bg-amber-50 text-amber-800"
      )}
    >
      <Icon className="size-3.5" /> {critica ? "Crítico" : "Error"}
    </span>
  );
}
