import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home, Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanalBadge } from "@/components/leads/estado-badge";
import { LeadAssignSelect } from "@/components/leads/lead-assign-select";
import { LeadConversation } from "@/components/leads/lead-conversation";
import { LeadEditarDatos } from "@/components/leads/lead-editar-datos";
import { LeadEliminar } from "@/components/leads/lead-eliminar";
import { LeadEstadoSelect } from "@/components/leads/lead-estado-select";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadPerfil } from "@/components/leads/lead-perfil";
import { getCurrentUser } from "@/lib/api";
import { getConversacionDeLead, getLead, getVendedores } from "@/lib/queries";
import { formatDateTime, waLink } from "@/lib/utils";

export const metadata = { title: "Consulta — Lamelas & Chaumont" };

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, me, chat] = await Promise.all([
    getLead(id),
    getCurrentUser(),
    getConversacionDeLead(id),
  ]);

  if (!lead) notFound();

  const esAdmin = me?.rol === "admin" || me?.rol === "super_admin";
  const vendedores = esAdmin ? await getVendedores() : [];

  // El brief del agente se guarda como nota con origen "agente"; se muestra en
  // su propia card, aparte de las notas que escribe el equipo.
  const notasAgente = lead.notas.filter((n) => n.origen === "agente");
  const notasHumanas = lead.notas.filter((n) => n.origen !== "agente");

  return (
    // En lg el detalle ocupa el alto de pantalla (100dvh menos header 3.5rem +
    // padding 3rem del layout) y cada columna scrollea por dentro; en mobile es
    // flujo normal y scrollea la página.
    <div className="space-y-4 lg:flex lg:h-[calc(100dvh-6.5rem)] lg:flex-col">
      <div className="space-y-4 lg:shrink-0">
        <Button asChild variant="outline" size="sm">
          <Link href="/consultas" prefetch={false}>
            <ArrowLeft /> Volver
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{lead.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {lead.telefono ? `${lead.telefono} · ` : ""}Entró el {formatDateTime(lead.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Columna principal: la conversación (o la consulta suelta) */}
        <div className="min-w-0 space-y-4 lg:min-h-0 lg:overflow-hidden">
          {chat ? (
            <LeadConversation
              conversacion={chat.conversacion}
              mensajes={chat.mensajes}
              leadNombre={lead.nombre}
            />
          ) : (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
                <MessageSquare className="size-5 text-primary" />
                <CardTitle className="text-base">La consulta</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-sm">{lead.mensaje}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: datos del lead, resumen del agente y notas internas.
            Scrollea por dentro en lg para ver toda la info sin mover la página. */}
        <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b bg-muted/40 py-3">
              <CardTitle className="text-base">Datos del lead</CardTitle>
              <LeadEditarDatos leadId={lead.id} nombre={lead.nombre} email={lead.email} />
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div className="space-y-1.5">
                <p className="text-muted-foreground">Estado</p>
                <LeadEstadoSelect leadId={lead.id} estado={lead.estado} />
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground">Asignado</p>
                {esAdmin ? (
                  <LeadAssignSelect
                    leadId={lead.id}
                    assignedTo={lead.assigned_to}
                    vendedores={vendedores}
                  />
                ) : (
                  <p className="font-medium">{lead.asignado ?? "Sin asignar"}</p>
                )}
              </div>

              <dl className="space-y-2 border-t pt-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Origen</dt>
                  <dd>
                    <CanalBadge canal={lead.canal} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Teléfono</dt>
                  <dd className="text-right font-medium">
                    {lead.telefono ? (
                      <a
                        href={`tel:${lead.telefono.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <Phone className="size-3.5" /> {lead.telefono}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-right font-medium">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1 break-all hover:underline"
                      >
                        <Mail className="size-3.5" /> {lead.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>

              {lead.canal === "whatsapp" && lead.telefono && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={waLink(lead.telefono)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> Abrir WhatsApp
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {(chat || notasAgente.length > 0) && (
            <Card>
              <CardHeader className="border-b bg-muted/40 py-3">
                <CardTitle className="text-base">Resumen del agente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {chat && <LeadPerfil perfil={chat.conversacion.perfil} />}
                {notasAgente.length > 0 && (
                  <div className="space-y-3 border-t pt-3">
                    {notasAgente.map((n) => (
                      <div key={n.id}>
                        <p className="whitespace-pre-wrap text-sm">{n.nota}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {lead.propiedad && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
                <Home className="size-5 text-primary" />
                <CardTitle className="text-base">Consultó por</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{lead.propiedad.titulo}</p>
                  {lead.propiedad.operacion && (
                    <p className="text-sm capitalize text-muted-foreground">
                      {lead.propiedad.operacion}
                    </p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
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
              <LeadNotes leadId={lead.id} notas={notasHumanas} />
            </CardContent>
          </Card>

          {esAdmin && <LeadEliminar leadId={lead.id} />}
        </div>
      </div>
    </div>
  );
}
