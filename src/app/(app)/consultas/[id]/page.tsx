import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home, Mail, MessageSquare, Phone, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanalBadge, LeadEstadoBadge } from "@/components/leads/estado-badge";
import { LeadAssignSelect } from "@/components/leads/lead-assign-select";
import { LeadEstadoSelect } from "@/components/leads/lead-estado-select";
import { LeadNotes } from "@/components/leads/lead-notes";
import { getCurrentUser } from "@/lib/api";
import { getLead, getVendedores } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Consulta — Lamelas & Chaumont" };

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, me] = await Promise.all([getLead(id), getCurrentUser()]);

  if (!lead) notFound();

  const esAdmin = me?.rol === "admin" || me?.rol === "super_admin";
  const vendedores = esAdmin ? await getVendedores() : [];

  // Links directos: en el celular abren la app de teléfono o de mail.
  const contacto = [
    lead.telefono && {
      icon: Phone,
      label: lead.telefono,
      href: `tel:${lead.telefono.replace(/\s/g, "")}`,
    },
    lead.email && { icon: Mail, label: lead.email, href: `mailto:${lead.email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/consultas" prefetch={false}>
          <ArrowLeft /> Volver a consultas
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{lead.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Entró el {formatDateTime(lead.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CanalBadge canal={lead.canal} />
          <LeadEstadoBadge estado={lead.estado} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border bg-background p-3">
        <LeadEstadoSelect leadId={lead.id} estado={lead.estado} />
        {esAdmin ? (
          <LeadAssignSelect
            leadId={lead.id}
            assignedTo={lead.assigned_to}
            vendedores={vendedores}
          />
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserCheck className="size-4" /> {lead.asignado ?? "Sin asignar"}
          </span>
        )}
      </div>

      {contacto.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contacto.map((c) => (
            <Button key={c.href} asChild variant="outline" size="sm">
              <a href={c.href}>
                <c.icon /> {c.label}
              </a>
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <MessageSquare className="size-5 text-primary" />
          <CardTitle className="text-base">La consulta</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="whitespace-pre-wrap text-sm">{lead.mensaje}</p>
        </CardContent>
      </Card>

      {lead.propiedad && (
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
            <Home className="size-5 text-primary" />
            <CardTitle className="text-base">Consultó por</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{lead.propiedad.titulo}</p>
              {lead.propiedad.operacion && (
                <p className="text-sm capitalize text-muted-foreground">
                  {lead.propiedad.operacion}
                </p>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/propiedades/${lead.propiedad.id}`} prefetch={false}>
                Ver la propiedad
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b bg-muted/40 py-3">
          <CardTitle className="text-base">Notas internas</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <LeadNotes leadId={lead.id} notas={lead.notas} />
        </CardContent>
      </Card>
    </div>
  );
}
