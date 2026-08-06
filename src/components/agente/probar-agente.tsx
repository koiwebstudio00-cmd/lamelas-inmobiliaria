"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { enviarMensajeAgente } from "@/actions/agente-prueba";

type Turno = { rol: "lead" | "agente"; texto: string };

function nuevaSesion(): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  return `prueba-${rnd}`;
}

export function ProbarAgente() {
  // La sesión se genera con lazy init: no se renderiza en el DOM, así que un
  // valor distinto entre server y cliente no causa mismatch de hidratación.
  const [sessionId, setSessionId] = useState<string>(() => nuevaSesion());
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turnos.length, pending]);

  function reiniciar() {
    setSessionId(nuevaSesion());
    setTurnos([]);
    setError(null);
    setTexto("");
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || !sessionId || pending) return;
    setError(null);
    setTexto("");
    setTurnos((prev) => [...prev, { rol: "lead", texto: mensaje }]);
    startTransition(async () => {
      const res = await enviarMensajeAgente({ sessionId, mensaje });
      if (res.error) {
        setError(res.error);
        return;
      }
      const nuevos = (res.mensajes ?? []).map((t) => ({ rol: "agente" as const, texto: t }));
      if (nuevos.length === 0) {
        setError("El agente no devolvió respuesta (puede estar en modo 'esperando humano' para esta sesión).");
        return;
      }
      setTurnos((prev) => [...prev, ...nuevos]);
    });
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col border bg-background">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {turnos.length === 0 && !pending ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Bot className="size-8" />
            <p className="text-sm">Escribile a Sofi como si fueras un visitante del sitio.</p>
            <p className="text-xs">Ej.: “hola, busco un depto en barrio norte para alquilar”.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {turnos.map((t, i) => (
              <li key={i} className={cn("flex", t.rol === "lead" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm",
                    t.rol === "lead" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {t.texto}
                </div>
              </li>
            ))}
            {pending && (
              <li className="flex justify-start">
                <div className="bg-muted px-3 py-2 text-sm text-muted-foreground">Sofi está escribiendo…</div>
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <p className="border-t bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}

      <form onSubmit={enviar} className="flex items-center gap-2 border-t p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={reiniciar}
          disabled={pending}
          title="Nueva conversación"
          aria-label="Nueva conversación"
        >
          <RotateCcw />
        </Button>
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un mensaje…"
          disabled={pending || !sessionId}
          aria-label="Mensaje"
        />
        <Button type="submit" size="icon" disabled={pending || !texto.trim() || !sessionId} aria-label="Enviar">
          <Send />
        </Button>
      </form>
    </div>
  );
}
