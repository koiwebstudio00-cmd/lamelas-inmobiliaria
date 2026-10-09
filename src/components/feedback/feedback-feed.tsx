import Link from "next/link";
import { MessageSquare, Paperclip } from "lucide-react";
import { AutorAvatar } from "@/components/feedback/autor-avatar";
import { FeedbackEstadoBadge, FeedbackTipoBadge } from "@/components/feedback/estado-badge";
import { formatRelative } from "@/lib/utils";
import type { FeedbackItem } from "@/lib/types";

function respuestas(n: number) {
  return n === 1 ? "1 respuesta" : `${n} respuestas`;
}

/** Publicaciones del canal, la más nueva arriba. Cada una abre su hilo. */
export function FeedbackFeed({ items, now }: { items: FeedbackItem[]; now: Date }) {
  return (
    <ul className="divide-y border bg-background">
      {items.map((f) => (
        <li key={f.id}>
          <Link
            href={`/feedback/${f.id}`}
            prefetch={false}
            className="flex gap-3 p-4 hover:bg-muted/40"
          >
            <AutorAvatar id={f.autor?.id ?? ""} nombre={f.autor?.nombre ?? "?"} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold">{f.autor?.nombre ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(f.created_at, now)}
                </span>
                <FeedbackTipoBadge tipo={f.tipo} />
                {f.estado !== "nuevo" && <FeedbackEstadoBadge estado={f.estado} />}
              </div>
              <p className="font-medium">{f.titulo}</p>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {f.descripcion}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                {f.comentarios_count > 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    <MessageSquare className="size-3.5" />
                    {respuestas(f.comentarios_count)}
                    {f.ultima_respuesta_at && (
                      <span className="font-normal text-muted-foreground">
                        · última {formatRelative(f.ultima_respuesta_at, now)}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="size-3.5" /> Responder
                  </span>
                )}
                {f.adjuntos_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Paperclip className="size-3.5" />
                    {f.adjuntos_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
