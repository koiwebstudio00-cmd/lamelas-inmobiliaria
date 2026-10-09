"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AutorAvatar } from "@/components/feedback/autor-avatar";
import { agregarComentario, borrarComentario } from "@/actions/feedback";
import { formatDateTime } from "@/lib/utils";
import type { FeedbackComentario } from "@/lib/types";

/**
 * Respuestas del hilo, como mensajes de un chat, y la caja para responder.
 * Enter + Ctrl/Cmd envía; Enter solo hace salto de línea (en el celular no hay
 * Ctrl, así que el botón es el camino normal).
 */
export function HiloRespuestas({
  feedbackId,
  comentarios,
  meId,
  meNombre,
  admin,
}: {
  feedbackId: string;
  comentarios: FeedbackComentario[];
  meId: string;
  meNombre: string;
  admin: boolean;
}) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function enviar() {
    const cuerpo = ref.current?.value.trim() ?? "";
    if (!cuerpo || pending) return;
    setError(null);
    startTransition(async () => {
      const err = await agregarComentario(feedbackId, cuerpo);
      if (err) {
        setError(err);
        return;
      }
      if (ref.current) ref.current.value = "";
      router.refresh();
    });
  }

  function borrar(id: string) {
    setError(null);
    setBorrando(id);
    startTransition(async () => {
      const err = await borrarComentario(id, feedbackId);
      setBorrando(null);
      if (err) setError(err);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="whitespace-nowrap font-medium">
          {comentarios.length === 0
            ? "Sin respuestas todavía"
            : comentarios.length === 1
              ? "1 respuesta"
              : `${comentarios.length} respuestas`}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {comentarios.length > 0 && (
        <ul className="space-y-4">
          {comentarios.map((c) => {
            const mio = c.autor.id === meId;
            return (
              <li key={c.id} className="group flex gap-3">
                <AutorAvatar id={c.autor.id} nombre={c.autor.nombre} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{mio ? `${c.autor.nombre} (vos)` : c.autor.nombre}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                    {(mio || admin) && (
                      <button
                        type="button"
                        onClick={() => borrar(c.id)}
                        disabled={pending}
                        className="ml-auto p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Borrar respuesta"
                        title="Borrar respuesta"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p
                    className={
                      borrando === c.id
                        ? "whitespace-pre-wrap text-sm opacity-50"
                        : "whitespace-pre-wrap text-sm"
                    }
                  >
                    {c.cuerpo}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-3 border-t pt-4">
        <AutorAvatar id={meId} nombre={meNombre} className="size-8" />
        <div className="flex-1 space-y-2">
          <Textarea
            ref={ref}
            rows={3}
            maxLength={5000}
            placeholder="Escribí una respuesta…"
            aria-label="Respuesta"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                enviar();
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Ctrl + Enter para enviar
            </span>
            <Button size="sm" onClick={enviar} disabled={pending} className="ml-auto">
              <SendHorizontal /> {pending && !borrando ? "Enviando..." : "Responder"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
