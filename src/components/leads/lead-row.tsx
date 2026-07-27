import Link from "next/link";
import { Mail, Phone, Home } from "lucide-react";
import { CanalBadge, LeadEstadoBadge } from "@/components/leads/estado-badge";
import { formatDateTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";

/**
 * Una fila de la bandeja. Toda la fila es un link al detalle: en el celular
 * es lo único cómodo de tocar (design-system.md, targets de 44px).
 */
export function LeadRow({ lead }: { lead: Lead }) {
  return (
    <li className="border bg-background">
      <Link
        href={`/consultas/${lead.id}`}
        className="block p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{lead.nombre}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {lead.telefono && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" /> {lead.telefono}
                </span>
              )}
              {lead.email && (
                <span className="flex min-w-0 items-center gap-1">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CanalBadge canal={lead.canal} />
            <LeadEstadoBadge estado={lead.estado} />
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lead.mensaje}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {lead.propiedad && (
            <span className="flex min-w-0 items-center gap-1">
              <Home className="size-3.5 shrink-0" />
              <span className="truncate">{lead.propiedad.titulo}</span>
            </span>
          )}
          <span className="ml-auto tabular-nums">{formatDateTime(lead.created_at)}</span>
        </div>
      </Link>
    </li>
  );
}
