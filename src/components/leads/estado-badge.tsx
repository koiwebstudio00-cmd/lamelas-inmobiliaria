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

export function CanalBadge({ canal }: { canal: CanalLead }) {
  return (
    <span className="inline-flex items-center border px-2 py-0.5 text-xs text-muted-foreground">
      {CANAL_LABELS[canal]}
    </span>
  );
}
