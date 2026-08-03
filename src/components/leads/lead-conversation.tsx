"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, MessageSquare, Paperclip, RefreshCw, Undo2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { releaseConversacion, takeConversacion } from "@/actions/conversations";
import { cn, formatDateTime } from "@/lib/utils";
import type { Conversacion, ConversacionMensaje, RolMensaje } from "@/lib/types";

// Quién escribe cada mensaje: define alineación y estilo de la burbuja. El lead
// va a la izquierda; el equipo (bot y vendedor) a la derecha; el sistema, al
// centro y en chico, porque son avisos, no parte de la charla.
const ROL: Record<RolMensaje, { lado: "izq" | "der" | "centro"; etiqueta: string }> = {
  lead: { lado: "izq", etiqueta: "Lead" },
  agente_ia: { lado: "der", etiqueta: "Sofi (IA)" },
  vendedor: { lado: "der", etiqueta: "Vendedor" },
  sistema: { lado: "centro", etiqueta: "Sistema" },
};

export function LeadConversation({
  conversacion,
  mensajes,
  leadNombre,
}: {
  conversacion: Conversacion;
  mensajes: ConversacionMensaje[];
  leadNombre: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { estado } = conversacion;

  function correr(fn: () => Promise<string | null>) {
    setError(null);
    startTransition(async () => {
      const err = await fn();
      if (err) setError(err);
      else router.refresh();
    });
  }

  const tomar = () => correr(() => takeConversacion(conversacion.id, conversacion.lead_id));
  const soltar = () => correr(() => releaseConversacion(conversacion.id, conversacion.lead_id));

  return (
    <div className="space-y-4">
      {estado === "esperando_humano" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Requiere intervención humana</p>
              <p className="text-sm text-amber-800">
                El bot pausó la automatización para este lead. Al tomar el chat, deja de responder.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={tomar} disabled={pending}>
            <UserCheck /> Tomar el chat
          </Button>
        </div>
      )}

      {estado === "humano" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border bg-muted/40 p-4">
          <div className="flex items-start gap-2">
            <UserCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">La estás atendiendo vos</p>
              <p className="text-sm text-muted-foreground">
                El bot no responde mientras tengas el chat tomado.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={soltar} disabled={pending}>
            <Undo2 /> Devolver al bot
          </Button>
        </div>
      )}

      {estado === "bot" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border bg-muted/40 p-4">
          <div className="flex items-start gap-2">
            <Bot className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Atiende el bot automáticamente</p>
              <p className="text-sm text-muted-foreground">Podés tomar el chat para responder vos.</p>
            </div>
          </div>
          <Button size="sm" onClick={tomar} disabled={pending}>
            <UserCheck /> Tomar el chat
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b bg-muted/40 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <CardTitle className="text-base">Conversación</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
            disabled={pending}
          >
            <RefreshCw className={cn(pending && "animate-spin")} /> Refrescar
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {mensajes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay mensajes en esta conversación.
            </p>
          ) : (
            <ul className="space-y-3">
              {mensajes.map((m) => {
                const rol = ROL[m.rol];
                const etiqueta = m.rol === "lead" ? leadNombre : rol.etiqueta;

                if (rol.lado === "centro") {
                  return (
                    <li key={m.id} className="text-center">
                      <span className="text-xs text-muted-foreground">{m.contenido}</span>
                    </li>
                  );
                }

                const derecha = rol.lado === "der";
                const esVendedor = m.rol === "vendedor";

                return (
                  <li key={m.id} className={cn("flex flex-col", derecha ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 text-sm",
                        esVendedor
                          ? "bg-primary text-primary-foreground"
                          : derecha
                            ? "bg-primary/10 text-foreground"
                            : "bg-muted text-foreground"
                      )}
                    >
                      {m.contenido && <p className="whitespace-pre-wrap">{m.contenido}</p>}
                      {m.media_url && (
                        <a
                          href={m.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs underline"
                        >
                          <Paperclip className="size-3" /> Ver adjunto ({m.tipo})
                        </a>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {etiqueta} · {formatDateTime(m.creado_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
