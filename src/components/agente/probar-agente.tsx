"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDateTime } from "@/lib/utils";
import {
  borrarConversacionPrueba,
  cargarConversacionPrueba,
  enviarMensajeAgente,
  type TurnoPrueba,
} from "@/actions/agente-prueba";
import type { ConversacionPrueba } from "@/lib/queries";

function nuevaSesion(): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return `prueba-${rnd}`;
}

/** Código corto legible a partir del session_id (para la lista). */
function corto(sessionId: string): string {
  return sessionId.replace(/^prueba-/, "").slice(0, 6);
}

/**
 * Probador del agente con visual tipo WhatsApp Web: a la izquierda la lista de
 * conversaciones de prueba, al centro el chat. La lista sale del servidor
 * (leads con `canal_ref` que empieza con `prueba-`); enviar/continuar usa el
 * proxy del webhook web con ese mismo `session_id`.
 */
export function ProbarAgente({ conversaciones }: { conversaciones: ConversacionPrueba[] }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>(() => nuevaSesion());
  const [turnos, setTurnos] = useState<TurnoPrueba[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, startEnviar] = useTransition();
  const [cargando, startCargar] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // El lead de la conversación activa se DERIVA de la lista (sin estado extra):
  // apenas el primer mensaje crea el lead y refrescamos, aparece acá.
  const leadIdActivo = conversaciones.find((c) => c.session_id === sessionId)?.lead_id ?? null;
  const esNuevaSinGuardar = leadIdActivo === null;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turnos.length, enviando]);

  function nueva() {
    setSessionId(nuevaSesion());
    setTurnos([]);
    setError(null);
    setTexto("");
  }

  function seleccionar(conv: ConversacionPrueba) {
    if (conv.session_id === sessionId) return;
    setSessionId(conv.session_id);
    setTexto("");
    setError(null);
    setTurnos([]);
    startCargar(async () => {
      const r = await cargarConversacionPrueba(conv.lead_id);
      setTurnos(r.turnos);
      if (r.error) setError(r.error);
    });
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || enviando || cargando) return;
    const eraNueva = leadIdActivo === null;
    setError(null);
    setTexto("");
    setTurnos((prev) => [...prev, { rol: "lead", texto: mensaje }]);
    startEnviar(async () => {
      const res = await enviarMensajeAgente({ sessionId, mensaje });
      if (res.error) {
        setError(res.error);
        return;
      }
      const nuevos = (res.mensajes ?? []).map((t) => ({ rol: "agente" as const, texto: t }));
      if (nuevos.length === 0) {
        setError("El agente no devolvió respuesta (¿el chat quedó en 'esperando humano'?).");
      } else {
        setTurnos((prev) => [...prev, ...nuevos]);
      }
      // Al crear la conversación (primer mensaje), refrescamos la lista para que
      // aparezca en el sidebar y quede enlazada por su session_id.
      if (eraNueva) router.refresh();
    });
  }

  function borrar() {
    if (!leadIdActivo || enviando) return;
    setError(null);
    startEnviar(async () => {
      const err = await borrarConversacionPrueba(leadIdActivo);
      if (err) {
        setError(err);
        return;
      }
      nueva();
      router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col overflow-hidden border bg-background lg:flex-row">
      {/* Sidebar: conversaciones de prueba */}
      <aside className="flex shrink-0 flex-col border-b lg:h-full lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/40 p-3">
          <span className="text-sm font-medium">Conversaciones de prueba</span>
          <Button size="sm" variant="outline" onClick={nueva}>
            <Plus /> Nueva
          </Button>
        </div>
        <ul className="max-h-40 overflow-y-auto lg:max-h-none lg:flex-1">
          {esNuevaSinGuardar && (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 border-b bg-primary/10 px-3 py-2 text-left text-sm"
              >
                <Bot className="size-4 shrink-0 text-primary" />
                <span className="truncate">Nueva conversación…</span>
              </button>
            </li>
          )}
          {conversaciones.length === 0 && !esNuevaSinGuardar && (
            <li className="px-3 py-4 text-sm text-muted-foreground">Todavía no probaste ninguna.</li>
          )}
          {conversaciones.map((c) => {
            const activa = c.session_id === sessionId;
            return (
              <li key={c.lead_id}>
                <button
                  type="button"
                  onClick={() => seleccionar(c)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left hover:bg-muted/50",
                    activa && "bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">Prueba {corto(c.session_id)}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Chat */}
      <section className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <span className="text-sm font-medium">
              {esNuevaSinGuardar ? "Nueva conversación" : `Prueba ${corto(sessionId)}`}
            </span>
          </div>
          {leadIdActivo && (
            <Button size="sm" variant="ghost" onClick={borrar} disabled={enviando} title="Borrar conversación">
              <Trash2 /> Borrar
            </Button>
          )}
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : turnos.length === 0 && !enviando ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Bot className="size-8" />
              <p className="text-sm">Escribile a Sofi como si fueras un visitante del sitio.</p>
              <p className="text-xs">Ej.: “hola, busco un depto en barrio norte para alquilar”.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {turnos.map((t, i) => {
                if (t.rol === "sistema") {
                  return (
                    <li key={i} className="text-center">
                      <span className="text-xs text-muted-foreground">{t.texto}</span>
                    </li>
                  );
                }
                const propio = t.rol === "lead";
                return (
                  <li key={i} className={cn("flex", propio ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm",
                        propio ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}
                    >
                      {t.texto}
                    </div>
                  </li>
                );
              })}
              {enviando && (
                <li className="flex justify-start">
                  <div className="bg-muted px-3 py-2 text-sm text-muted-foreground">Sofi está escribiendo…</div>
                </li>
              )}
            </ul>
          )}
        </div>

        {error && <p className="border-t bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}

        <form onSubmit={enviar} className="flex items-center gap-2 border-t p-3">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje…"
            disabled={enviando || cargando}
            aria-label="Mensaje"
          />
          <Button type="submit" size="icon" disabled={enviando || cargando || !texto.trim()} aria-label="Enviar">
            <Send />
          </Button>
        </form>
      </section>
    </div>
  );
}
