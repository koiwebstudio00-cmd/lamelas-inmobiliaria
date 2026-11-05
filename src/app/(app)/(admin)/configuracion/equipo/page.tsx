import { MailPlus, Smartphone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteForm } from "@/components/team/invite-form";
import { RevokeInvitationButton } from "@/components/team/revoke-invitation-button";
import { ProbarEnvios } from "@/components/team/probar-envios";
import { UserActions } from "@/components/team/user-actions";
import { getCurrentUser } from "@/lib/api";
import { getInvitaciones, getUsuarios } from "@/lib/queries";
import { cn, formatDate } from "@/lib/utils";
import type { Rol } from "@/lib/types";

export const metadata = { title: "Equipo — Lamelas & Chaumont" };

const ROL_LABEL: Record<Rol, string> = {
  super_admin: "Soporte",
  admin: "Administrador",
  agente: "Vendedor",
};

export default async function EquipoPage() {
  // El rol ya lo verificó el layout de (admin); acá `me` es solo para no
  // ofrecerte acciones sobre vos mismo. Va sin request extra: getCurrentUser
  // está cacheado y el layout ya lo resolvió en este render.
  const [usuarios, invitaciones, me] = await Promise.all([
    getUsuarios(),
    getInvitaciones(),
    getCurrentUser(),
  ]);
  const suspendidos = usuarios.filter((u) => u.estado === "inactivo").length;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Quién entra al panel y con qué permisos.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <MailPlus className="size-5 text-primary" />
          <CardTitle className="text-base">Invitar a alguien</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <InviteForm />
        </CardContent>
      </Card>

      {invitaciones.length > 0 && (
        <Card>
          <CardHeader className="border-b bg-muted/40 py-3">
            <CardTitle className="text-base">
              Invitaciones pendientes ({invitaciones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {invitaciones.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROL_LABEL[inv.rol]} · vence el {formatDate(inv.expira)}
                  </p>
                </div>
                <RevokeInvitationButton id={inv.id} email={inv.email} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <Users className="size-5 text-primary" />
          <CardTitle className="text-base">Usuarios ({usuarios.length})</CardTitle>
          {suspendidos > 0 && (
            <span className="text-sm text-muted-foreground">
              · {usuarios.length - suspendidos} activos · {suspendidos}{" "}
              {suspendidos === 1 ? "suspendido" : "suspendidos"}
            </span>
          )}
        </CardHeader>
        <CardContent className="divide-y p-0">
          {usuarios.map((u) => {
            const suspendido = u.estado === "inactivo";
            return (
              <div
                key={u.id}
                className={cn(
                  "flex flex-wrap items-start justify-between gap-3 border-l-4 p-4",
                  suspendido ? "border-l-red-500 bg-red-50" : "border-l-transparent"
                )}
              >
                <div className="min-w-0 space-y-2">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <span className={cn("truncate", suspendido && "text-muted-foreground line-through")}>
                        {u.nombre}
                      </span>
                      {suspendido ? (
                        <Badge className="bg-red-600 text-white">Suspendido</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-600 text-green-700">
                          Activo
                        </Badge>
                      )}
                      {!suspendido && u.push_activo && (
                        <Badge variant="outline" className="gap-1">
                          <Smartphone className="size-3" />
                          App con avisos
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ROL_LABEL[u.rol]} · {u.email}
                    </p>
                    {suspendido && (
                      <p className="text-xs text-red-700">No puede entrar al panel ni entra en el reparto de consultas.</p>
                    )}
                  </div>
                  {/* Pruebas de envío: para descartar problemas del panel cuando
                      alguien dice que no le llegan los correos o los avisos. */}
                  {!suspendido && u.rol !== "super_admin" && <ProbarEnvios usuario={u} />}
                </div>
                <UserActions usuario={u} esYo={u.id === me?.id} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
