import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { CanalBadge, LeadEstadoBadge } from "@/components/leads/estado-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";

/** Vista de tabla de la bandeja. El mensaje no entra: para eso está el detalle. */
export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Consultó por</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Entró</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="max-w-[14rem]">
                <Link
                  href={`/consultas/${lead.id}`}
                  prefetch={false}
                  className="block truncate font-medium hover:text-primary"
                >
                  {lead.nombre}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {lead.telefono && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Phone className="size-3.5 shrink-0" /> {lead.telefono}
                    </span>
                  )}
                  {lead.email && (
                    <span className="flex max-w-[16rem] items-center gap-1">
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </span>
                  )}
                  {!lead.telefono && !lead.email && "—"}
                </div>
              </TableCell>
              <TableCell>
                <CanalBadge canal={lead.canal} />
              </TableCell>
              <TableCell className="max-w-[16rem]">
                {lead.propiedad ? (
                  <Link
                    href={`/propiedades/${lead.propiedad.id}`}
                    prefetch={false}
                    className="block truncate text-muted-foreground hover:text-primary"
                  >
                    {lead.propiedad.titulo}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-[10rem]">
                {lead.asignado ? (
                  <span className="block truncate text-sm">{lead.asignado}</span>
                ) : (
                  <span className="text-muted-foreground">Sin asignar</span>
                )}
              </TableCell>
              <TableCell>
                <LeadEstadoBadge estado={lead.estado} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground">
                {formatDateTime(lead.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
