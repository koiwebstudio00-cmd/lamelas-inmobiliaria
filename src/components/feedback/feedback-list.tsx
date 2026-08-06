import Link from "next/link";
import { MessageSquare, Paperclip } from "lucide-react";
import { FeedbackEstadoBadge } from "@/components/feedback/estado-badge";
import { formatDateTime } from "@/lib/utils";
import type { FeedbackItem } from "@/lib/types";

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((f) => (
        <li key={f.id}>
          <Link
            href={`/feedback/${f.id}`}
            prefetch={false}
            className="block border bg-background p-3 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{f.titulo}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{f.descripcion}</p>
              </div>
              <FeedbackEstadoBadge estado={f.estado} className="shrink-0" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{f.autor?.nombre ?? "—"}</span>
              <span>{formatDateTime(f.created_at)}</span>
              {f.comentarios_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-3.5" />
                  {f.comentarios_count}
                </span>
              )}
              {f.adjuntos_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="size-3.5" />
                  {f.adjuntos_count}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
