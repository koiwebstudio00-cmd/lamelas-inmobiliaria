import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdjuntosGallery } from "@/components/feedback/adjuntos-gallery";
import { Comentarios } from "@/components/feedback/comentarios";
import { EliminarFeedback } from "@/components/feedback/eliminar-feedback";
import { FeedbackEstadoBadge, FeedbackTipoBadge } from "@/components/feedback/estado-badge";
import { FeedbackEstadoSelect } from "@/components/feedback/estado-select";
import { getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import { getFeedbackItem } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Feedback — Lamelas & Chaumont" };

export default async function FeedbackDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, me] = await Promise.all([getFeedbackItem(id), getCurrentUser()]);
  if (!item) notFound();

  const admin = me ? esAdmin(me.rol) : false;
  const esAutor = me?.id === item.autor?.id;
  const volver = item.tipo === "error" ? "/feedback/reportes" : "/feedback/sugerencias";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href={volver} prefetch={false}>
          <ArrowLeft /> Volver
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold">{item.titulo}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FeedbackTipoBadge tipo={item.tipo} />
            <span>{item.autor?.nombre ?? "—"}</span>
            <span>{formatDateTime(item.created_at)}</span>
          </div>
        </div>
        {admin ? (
          <div className="w-44">
            <FeedbackEstadoSelect id={item.id} estado={item.estado} />
          </div>
        ) : (
          <FeedbackEstadoBadge estado={item.estado} />
        )}
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/40 py-3">
          <CardTitle className="text-base">Descripción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <p className="whitespace-pre-wrap text-sm">{item.descripcion}</p>
          {(item.url_contexto || item.user_agent) && (
            <dl className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
              {item.url_contexto && (
                <div className="flex gap-2">
                  <dt>Pantalla:</dt>
                  <dd className="break-all">{item.url_contexto}</dd>
                </div>
              )}
              {item.user_agent && (
                <div className="flex gap-2">
                  <dt>Navegador:</dt>
                  <dd className="break-all">{item.user_agent}</dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      {item.tipo === "error" && (
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
            <Paperclip className="size-5 text-primary" />
            <CardTitle className="text-base">Imágenes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <AdjuntosGallery
              feedbackId={item.id}
              adjuntos={item.adjuntos}
              puedeEliminar={admin || esAutor}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <MessageSquare className="size-5 text-primary" />
          <CardTitle className="text-base">Comentarios internos</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Comentarios id={item.id} comentarios={item.comentarios} />
        </CardContent>
      </Card>

      {admin && <EliminarFeedback id={item.id} tipo={item.tipo} />}
    </div>
  );
}
