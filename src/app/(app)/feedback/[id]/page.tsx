import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoRefresh } from "@/components/auto-refresh";
import { AdjuntosGallery } from "@/components/feedback/adjuntos-gallery";
import { AutorAvatar } from "@/components/feedback/autor-avatar";
import { EliminarFeedback } from "@/components/feedback/eliminar-feedback";
import { FeedbackEstadoBadge, FeedbackTipoBadge } from "@/components/feedback/estado-badge";
import { FeedbackEstadoSelect } from "@/components/feedback/estado-select";
import { HiloRespuestas } from "@/components/feedback/hilo-respuestas";
import { MarcarResuelta } from "@/components/feedback/marcar-resuelta";
import { getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import { getFeedbackItem } from "@/lib/queries";
import { TIPOS_CON_ADJUNTOS } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Feedback — Lamelas & Chaumont" };

/** Hilo de una publicación: el mensaje original, las respuestas y la caja para responder. */
export default async function FeedbackHiloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, me] = await Promise.all([getFeedbackItem(id), getCurrentUser()]);
  if (!item || !me) notFound();

  const admin = esAdmin(me.rol);
  const esAutor = me.id === item.autor?.id;
  const conAdjuntos = TIPOS_CON_ADJUNTOS.includes(item.tipo);
  const cerrada = item.estado === "resuelta" || item.estado === "descartada";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/feedback" prefetch={false}>
            <ArrowLeft /> Volver al canal
          </Link>
        </Button>
        {admin && <EliminarFeedback id={item.id} />}
      </div>

      <article className="space-y-5 border bg-background p-4 sm:p-5">
        <header className="flex gap-3">
          <AutorAvatar id={item.autor?.id ?? ""} nombre={item.autor?.nombre ?? "?"} className="size-10" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold">{item.autor?.nombre ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
              <FeedbackTipoBadge tipo={item.tipo} />
            </div>
            <h1 className="text-xl font-semibold">{item.titulo}</h1>
          </div>
        </header>

        <p className="whitespace-pre-wrap text-sm">{item.descripcion}</p>

        {(item.url_contexto || item.user_agent) && (
          <dl className="space-y-1 bg-muted/40 p-3 text-xs text-muted-foreground">
            {item.url_contexto && (
              <div className="flex gap-2">
                <dt className="shrink-0">Pantalla:</dt>
                <dd className="break-all">{item.url_contexto}</dd>
              </div>
            )}
            {item.user_agent && (
              <div className="flex gap-2">
                <dt className="shrink-0">Navegador:</dt>
                <dd className="break-all">{item.user_agent}</dd>
              </div>
            )}
          </dl>
        )}

        {conAdjuntos && item.adjuntos.length > 0 && (
          <AdjuntosGallery
            feedbackId={item.id}
            adjuntos={item.adjuntos}
            puedeEliminar={admin || esAutor}
          />
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <span className="text-xs text-muted-foreground">Estado</span>
          {admin ? (
            <div className="w-44">
              <FeedbackEstadoSelect id={item.id} estado={item.estado} />
            </div>
          ) : (
            <FeedbackEstadoBadge estado={item.estado} />
          )}
          {!admin && esAutor && !cerrada && <MarcarResuelta id={item.id} />}
        </div>

        <HiloRespuestas
          feedbackId={item.id}
          comentarios={item.comentarios}
          meId={me.id}
          meNombre={me.nombre}
          admin={admin}
        />
      </article>

      <AutoRefresh cadaMs={15_000} />
    </div>
  );
}
