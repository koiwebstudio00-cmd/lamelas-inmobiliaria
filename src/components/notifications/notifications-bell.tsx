"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import {
  fetchResumenNotificaciones,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import { NotificacionIcon } from "@/components/notifications/tipo-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ResumenNotificaciones } from "@/lib/queries";
import { cn, formatRelative } from "@/lib/utils";
import type { Notificacion } from "@/lib/types";

// Cada cuánto se vuelve a preguntar por avisos nuevos con la pestaña visible.
const REFRESCO_MS = 60_000;
// Críticas cuyo aviso emergente ya se mostró en esta sesión del navegador.
const CLAVE_AVISADAS = "lamelas:criticas-avisadas";

/**
 * Campanita de la barra superior: contador de sin leer, las últimas 6 y el
 * acceso a la página con todas. El layout le pasa el estado inicial (ya viene
 * renderizado del server) y después se refresca sola una vez por minuto, al
 * volver a la pestaña y al volver a la ventana.
 *
 * Los avisos de prioridad alta (incidentes críticos del agente) vienen fijados
 * arriba por la API mientras estén sin leer, se pintan en rojo y, la primera
 * vez que aparecen, sacan un aviso emergente que queda hasta que lo cierran.
 */
export function NotificationsBell({ inicial }: { inicial: ResumenNotificaciones }) {
  const router = useRouter();
  const [resumen, setResumen] = useState(inicial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // El layout se vuelve a renderizar en cada navegación y después de cada
  // action: lo que trae es más nuevo que lo que hay en memoria. Se ajusta
  // durante el render (no en un efecto) para no pintar un cuadro con lo viejo.
  const [origen, setOrigen] = useState(inicial);
  if (origen !== inicial) {
    setOrigen(inicial);
    setResumen(inicial);
  }

  useEffect(() => {
    let cancelado = false;
    const refrescar = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const nuevo = await fetchResumenNotificaciones();
        if (!cancelado) setResumen(nuevo);
      } catch {
        // Sin red o sesión vencida: se reintenta en la próxima vuelta.
      }
    };
    const timer = setInterval(refrescar, REFRESCO_MS);
    // Al volver a la pestaña o a la ventana no se espera al próximo minuto.
    document.addEventListener("visibilitychange", refrescar);
    window.addEventListener("focus", refrescar);
    return () => {
      cancelado = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refrescar);
      window.removeEventListener("focus", refrescar);
    };
  }, []);

  const { ultimas, noLeidas } = resumen;
  const criticasSinLeer = useMemo(
    () => ultimas.filter((n) => n.prioridad === "alta" && !n.leida_at),
    [ultimas]
  );

  // Aviso emergente para cada crítica nueva, aunque la campanita esté cerrada.
  // Las ya mostradas se recuerdan durante la sesión del navegador, para no
  // repetirlo en cada refresco, recarga o pestaña nueva. Si el navegador no deja
  // guardar, se recuerdan solo mientras dure esta pantalla.
  const criticasAvisadas = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!criticasAvisadas.current) {
      let guardadas: string[] = [];
      try {
        guardadas = JSON.parse(sessionStorage.getItem(CLAVE_AVISADAS) ?? "[]");
      } catch {
        // sessionStorage bloqueado o con basura: se arranca vacío.
      }
      criticasAvisadas.current = new Set(Array.isArray(guardadas) ? guardadas : []);
    }
    const avisadas = criticasAvisadas.current;
    let cambio = false;
    for (const n of criticasSinLeer) {
      if (avisadas.has(n.id)) continue;
      avisadas.add(n.id);
      cambio = true;
      toast.error(n.titulo, {
        id: `critica-${n.id}`,
        description: n.cuerpo,
        duration: Infinity,
        closeButton: true,
        action: n.link ? { label: "Ver", onClick: () => router.push(n.link!) } : undefined,
      });
    }
    if (cambio) {
      try {
        // Las últimas 50 alcanzan: las viejas ya no vuelven a la campanita.
        sessionStorage.setItem(CLAVE_AVISADAS, JSON.stringify([...avisadas].slice(-50)));
      } catch {
        // Sin almacenamiento: no pasa nada, se recuerdan en memoria.
      }
    }
  }, [criticasSinLeer, router]);

  function abrir(n: Notificacion) {
    setOpen(false);
    // Optimista: baja el contador ya; la action revalida el layout y confirma.
    if (!n.leida_at) {
      setResumen((r) => ({
        noLeidas: Math.max(0, r.noLeidas - 1),
        ultimas: r.ultimas.map((x) =>
          x.id === n.id ? { ...x, leida_at: new Date().toISOString() } : x
        ),
      }));
      startTransition(async () => {
        const error = await markNotificationRead(n.id);
        if (error) toast.error(error);
      });
    }
    router.push(n.link ?? "/notificaciones");
  }

  function marcarTodas() {
    startTransition(async () => {
      const error = await markAllNotificationsRead();
      if (error) toast.error(error);
      else {
        setResumen((r) => ({
          noLeidas: 0,
          ultimas: r.ultimas.map((x) => ({
            ...x,
            leida_at: x.leida_at ?? new Date().toISOString(),
          })),
        }));
      }
    });
  }

  return (
    // `modal={false}`: sin esto Radix bloquea el scroll de la página mientras el
    // desplegable está abierto y el contenido pega un salto al compensar la barra.
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={
            criticasSinLeer.length > 0
              ? `Notificaciones: ${noLeidas} sin leer, ${criticasSinLeer.length} críticas`
              : noLeidas > 0
                ? `Notificaciones: ${noLeidas} sin leer`
                : "Notificaciones"
          }
        >
          {criticasSinLeer.length > 0 ? <BellRing className="text-destructive" /> : <Bell />}
          {noLeidas > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-sm p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificaciones</p>
          {noLeidas > 0 && (
            <button
              type="button"
              onClick={marcarTodas}
              disabled={pending}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" /> Marcar todas como leídas
            </button>
          )}
        </div>

        {ultimas.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No tenés notificaciones todavía.
          </p>
        ) : (
          <ul>
            {ultimas.map((n) => (
              <li key={n.id} className="border-b last:border-b-0">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    abrir(n);
                  }}
                  className={cn(
                    "cursor-pointer items-start gap-3 rounded-none px-3 py-2.5",
                    !n.leida_at && "bg-primary/5",
                    n.prioridad === "alta" &&
                      !n.leida_at &&
                      "shadow-[inset_4px_0_0_var(--color-red-600)] bg-red-50 focus:bg-red-100"
                  )}
                >
                  <NotificacionIcon tipo={n.tipo} prioridad={n.prioridad} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        !n.leida_at && "font-semibold",
                        n.prioridad === "alta" && "text-red-800"
                      )}
                    >
                      {n.titulo}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.cuerpo}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground" suppressHydrationWarning>
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                  {!n.leida_at && (
                    <span className="mt-1.5 size-2 shrink-0 bg-primary" aria-label="Sin leer" />
                  )}
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t p-1">
          <DropdownMenuItem asChild className="cursor-pointer justify-center rounded-none text-sm font-medium text-primary">
            <Link href="/notificaciones" prefetch={false}>
              Ver todas
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
