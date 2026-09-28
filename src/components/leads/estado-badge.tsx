import { Clock3, Ghost, Globe, Instagram, MessageSquare, PhoneCall, TriangleAlert } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import { MOTIVOS_DERIVACION } from "@/lib/types";
import type { CanalLead, EstadoLead, MotivoDerivacion } from "@/lib/types";

// Mismo criterio que el badge de propiedades: los colores viven en globals.css
// como variables, así una sola línea cambia el tono en toda la app.
const ESTADO_STYLES: Record<EstadoLead, string> = {
  nueva: "bg-[var(--lead-nueva-bg)] text-[var(--lead-nueva-fg)]",
  en_contacto: "bg-[var(--lead-contacto-bg)] text-[var(--lead-contacto-fg)]",
  ganada: "bg-[var(--lead-ganada-bg)] text-[var(--lead-ganada-fg)]",
  perdida: "bg-[var(--lead-perdida-bg)] text-[var(--lead-perdida-fg)]",
};

const ESTADO_LABELS: Record<EstadoLead, string> = {
  nueva: "Nueva",
  en_contacto: "En contacto",
  ganada: "Ganada",
  perdida: "Perdida",
};

export function LeadEstadoBadge({
  estado,
  className,
}: {
  estado: EstadoLead;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
        ESTADO_STYLES[estado],
        className
      )}
    >
      {ESTADO_LABELS[estado]}
    </div>
  );
}

export function LeadSinTomarBadge() {
  return (
    <span className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
      <Clock3 className="size-3.5 shrink-0" />
      Sin tomar
    </span>
  );
}

/**
 * Sofía derivó y nadie tomó el chat: alguien del equipo tiene que atenderlo.
 * Es el badge más fuerte de la bandeja a propósito — es lo único que pide una
 * acción humana ahora mismo.
 */
export function LeadAtencionBadge({ motivo }: { motivo: MotivoDerivacion }) {
  return (
    <span className="inline-flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      <TriangleAlert className="size-3.5 shrink-0" />
      {MOTIVOS_DERIVACION[motivo]}
    </span>
  );
}

/**
 * Sofía le hizo seguimiento y el lead no contestó. Va en gris y al final: es
 * información, no una tarea.
 */
export function LeadFantasmaBadge() {
  return (
    <span className="inline-flex items-center gap-1 border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
      <Ghost className="size-3.5 shrink-0" />
      Fantasma
    </span>
  );
}

const CANAL_LABELS: Record<CanalLead, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
  manual: "Carga manual",
};

const CANAL_ICONS: Record<CanalLead, ComponentType<SVGProps<SVGSVGElement>>> = {
  web: Globe,
  whatsapp: WhatsappIcon,
  instagram: Instagram,
  messenger: MessageSquare,
  manual: PhoneCall,
};

const CANAL_STYLES: Record<CanalLead, string> = {
  web: "border-blue-200 bg-blue-50 text-blue-700",
  whatsapp: "border-emerald-200 bg-emerald-50 text-emerald-700",
  instagram: "border-pink-200 bg-pink-50 text-pink-700",
  messenger: "border-sky-200 bg-sky-50 text-sky-700",
  manual: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function CanalBadge({ canal }: { canal: CanalLead }) {
  const Icon = CANAL_ICONS[canal];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium",
        CANAL_STYLES[canal]
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {CANAL_LABELS[canal]}
    </span>
  );
}
