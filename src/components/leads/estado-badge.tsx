import { Globe, Instagram, MessageSquare, PhoneCall } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import type { CanalLead, EstadoLead } from "@/lib/types";

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
