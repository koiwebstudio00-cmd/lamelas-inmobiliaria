import Link from "next/link";
import { ArrowRight, BellOff } from "lucide-react";
import {
  MarkAllReadButton,
  MarkReadButton,
} from "@/components/notifications/notification-actions";
import { NotificacionIcon, TIPO_LABELS } from "@/components/notifications/tipo-icon";
import { Pagination } from "@/components/pagination";
import { RefreshButton } from "@/components/refresh-button";
import { Button } from "@/components/ui/button";
import { getNotificaciones } from "@/lib/queries";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Notificaciones — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const soloNoLeidas = params.ver === "no-leidas";
  const { notificaciones, count, page, noLeidas } = await getNotificaciones({
    pagina: params.pagina ? Number(params.pagina) : 1,
    soloNoLeidas,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {noLeidas === 0
              ? "Estás al día: no tenés notificaciones sin leer."
              : `Tenés ${noLeidas} sin leer.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton label="Actualizar notificaciones" />
          {noLeidas > 0 && <MarkAllReadButton />}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {[
          { href: "/notificaciones", label: "Todas", activo: !soloNoLeidas },
          {
            href: "/notificaciones?ver=no-leidas",
            label: noLeidas > 0 ? `Sin leer (${noLeidas})` : "Sin leer",
            activo: soloNoLeidas,
          },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            aria-current={tab.activo ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              tab.activo
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {notificaciones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed bg-background p-12 text-center">
          <BellOff className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {soloNoLeidas ? "No hay notificaciones sin leer" : "Todavía no hay notificaciones"}
          </p>
          <p className="text-sm text-muted-foreground">
            Acá vas a ver las consultas nuevas, las que te asignen o reasignen y los pedidos de
            avance.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notificaciones.map((n) => (
            <li
              key={n.id}
              className={cn(
                "border bg-background p-4",
                !n.leida_at && "border-l-2 border-l-primary",
                n.prioridad === "alta" && !n.leida_at && "shadow-[inset_4px_0_0_var(--color-red-600)] bg-red-50"
              )}
            >
              <div className="flex items-start gap-3">
                <NotificacionIcon tipo={n.tipo} prioridad={n.prioridad} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {n.prioridad === "alta" ? "Incidente crítico" : (TIPO_LABELS[n.tipo] ?? "Aviso")} ·{" "}
                      {formatDateTime(n.created_at)}
                    </p>
                    <p className={cn("leading-snug", !n.leida_at && "font-semibold")}>
                      {n.titulo}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{n.cuerpo}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {n.link && (
                      <Button asChild size="sm">
                        <Link href={n.link} prefetch={false}>
                          Abrir <ArrowRight />
                        </Link>
                      </Button>
                    )}
                    {n.leida_at ? (
                      <span className="text-xs text-muted-foreground">
                        Leída el {formatDateTime(n.leida_at)}
                      </span>
                    ) : (
                      <MarkReadButton id={n.id} />
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} count={count} basePath="/notificaciones" searchParams={params} />
    </div>
  );
}
