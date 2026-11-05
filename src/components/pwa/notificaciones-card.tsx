"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BellRing, Mail, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  activarPushEnDispositivo,
  actualizarPreferenciasAviso,
  enviarAvisoDePrueba,
  quitarDispositivo,
} from "@/actions/push";
import { InstalarApp } from "@/components/pwa/instalar-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  esAppInstalada,
  etiquetaDispositivo,
  soportaPush,
  suscribir,
  suscripcionActual,
  useEnNavegador,
} from "@/lib/pwa";
import type { PushEstado } from "@/lib/types";

type Entorno = "cargando" | "navegador" | "app" | "sin-soporte";

/**
 * Cómo le llega al usuario el aviso de consulta nueva (PUSH-PWA-01): push al
 * celular, correo o los dos, nunca ninguno. El push solo se puede prender desde
 * la app instalada. La API vuelve a validar todas las reglas.
 */
export function NotificacionesCard({ estado }: { estado: PushEstado }) {
  const entorno = useEnNavegador<Entorno>(
    () => (esAppInstalada() ? (soportaPush() ? "app" : "sin-soporte") : "navegador"),
    "cargando"
  );
  const permisoInicial = useEnNavegador<NotificationPermission | null>(
    () => (soportaPush() ? Notification.permission : null),
    null
  );
  // Después de pedir permiso, el valor nuevo pisa al inicial.
  const [permisoNuevo, setPermiso] = useState<NotificationPermission | null>(null);
  const permiso = permisoNuevo ?? permisoInicial;
  const [pending, startTransition] = useTransition();

  // Con el push elegido y el permiso dado, este celular se vuelve a registrar
  // solo, una vez por visita (el alta es idempotente): cubre volver a entrar
  // después de cerrar sesión, que da de baja el dispositivo.
  const resincronizado = useRef(false);
  useEffect(() => {
    if (resincronizado.current) return;
    if (entorno !== "app" || !estado.notif_push || !estado.vapid_public_key) return;
    if (Notification.permission !== "granted") return;
    resincronizado.current = true;
    void (async () => {
      const sub = await suscripcionActual();
      if (!sub) return;
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await activarPushEnDispositivo(
        { endpoint: json.endpoint, keys: json.keys, etiqueta: etiquetaDispositivo() },
        { soloPush: false }
      );
    })();
  }, [entorno, estado.notif_push, estado.vapid_public_key]);

  const puedePush = entorno === "app" && Boolean(estado.vapid_public_key) && permiso !== "denied";

  function prenderPush() {
    startTransition(async () => {
      try {
        const sub = await suscribir(estado.vapid_public_key!);
        setPermiso(Notification.permission);
        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        const error = await activarPushEnDispositivo(
          { endpoint: json.endpoint, keys: json.keys, etiqueta: etiquetaDispositivo() },
          { soloPush: false }
        );
        if (error) toast.error(error);
        else toast.success("Listo: las consultas nuevas te van a llegar a este celular.");
      } catch {
        setPermiso(typeof Notification !== "undefined" ? Notification.permission : null);
        toast.error("No diste permiso para las notificaciones.");
      }
    });
  }

  function cambiar(cambios: { push?: boolean; correo?: boolean }, ok: string) {
    startTransition(async () => {
      const error = await actualizarPreferenciasAviso(cambios);
      if (error) toast.error(error);
      else toast.success(ok);
    });
  }

  function onPush(checked: boolean) {
    if (checked) {
      if (estado.dispositivos.length > 0 && permiso === "granted") {
        cambiar({ push: true }, "Avisos al celular activados.");
      } else {
        prenderPush();
      }
      return;
    }
    // Apagar el push nunca deja sin canal: el correo vuelve a prenderse.
    cambiar(
      { push: false, correo: true },
      estado.notif_correo ? "Avisos al celular desactivados." : "Avisos al celular desactivados. Te van a llegar por correo."
    );
  }

  function onCorreo(checked: boolean) {
    cambiar({ correo: checked }, checked ? "Avisos por correo activados." : "Avisos por correo desactivados.");
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <h2 className="font-semibold">Avisos de consultas nuevas</h2>
            <p className="text-sm text-muted-foreground">
              Elegí cómo querés enterarte cuando te asignan una consulta. Tiene que quedar al menos una opción
              activa.
            </p>
          </div>
        </div>

        <Separator />

        {/* Push */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="aviso-push" className="flex items-center gap-2">
              <Smartphone className="size-4" />
              Notificación en el celular
            </Label>
            {entorno === "navegador" && (
              <p className="text-xs text-muted-foreground">
                Disponible desde la app instalada. Instalala y activalas desde ahí.
              </p>
            )}
            {entorno === "sin-soporte" && (
              <p className="text-xs text-muted-foreground">
                Este dispositivo no admite notificaciones. En iPhone hace falta iOS 16.4 o posterior.
              </p>
            )}
            {entorno === "app" && !estado.vapid_public_key && (
              <p className="text-xs text-muted-foreground">Todavía no están habilitadas en el servidor.</p>
            )}
            {entorno === "app" && permiso === "denied" && (
              <p className="text-xs text-muted-foreground">
                Bloqueaste las notificaciones. Habilitalas en los ajustes del celular (Notificaciones → Lamelas) y
                volvé a esta pantalla.
              </p>
            )}
            {estado.notif_push && !estado.push_activo && (
              <p className="text-xs text-amber-700">
                No tenés ningún celular con avisos activos: mientras tanto te llegan por correo.
              </p>
            )}
          </div>
          <Switch
            id="aviso-push"
            checked={estado.notif_push}
            disabled={pending || (!estado.notif_push && !puedePush)}
            onCheckedChange={onPush}
          />
        </div>

        {entorno === "navegador" && <InstalarApp className="w-full sm:w-auto" />}

        {/* Correo */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="aviso-correo" className="flex items-center gap-2">
              <Mail className="size-4" />
              Correo electrónico
            </Label>
            {!estado.push_activo && (
              <p className="text-xs text-muted-foreground">
                Para apagarlo, primero activá las notificaciones en el celular.
              </p>
            )}
            {!estado.correo_tenant_activo && (
              <p className="text-xs text-muted-foreground">
                El administrador apagó los correos de asignación para la inmobiliaria.
              </p>
            )}
          </div>
          <Switch
            id="aviso-correo"
            checked={estado.correo_activo}
            disabled={pending || !estado.push_activo}
            onCheckedChange={onCorreo}
          />
        </div>

        {estado.dispositivos.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Dispositivos con avisos</p>
              <ul className="space-y-2">
                {estado.dispositivos.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {d.etiqueta ?? "Dispositivo"}
                      <span className="block text-xs text-muted-foreground">
                        Activado el {new Date(d.created_at).toLocaleDateString("es-AR")}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar ${d.etiqueta ?? "dispositivo"}`}
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const error = await quitarDispositivo(d.id);
                          if (error) toast.error(error);
                          else toast.success("Dispositivo quitado.");
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const error = await enviarAvisoDePrueba();
                    if (error) toast.error(error);
                    else toast.success("Aviso de prueba enviado. Debería llegarte en unos segundos.");
                  })
                }
              >
                Enviar aviso de prueba
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
