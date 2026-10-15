"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, MessageSquare, RefreshCw, Undo2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { releaseConversacion, takeConversacion } from "@/actions/conversations";
import { ChatThread } from "@/components/leads/chat-thread";
import { cn } from "@/lib/utils";
import type { Conversacion, ConversacionMensaje } from "@/lib/types";

export function LeadConversation({
  conversacion,
  mensajes,
  leadNombre,
  atencionExterna = false,
}: {
  conversacion: Conversacion;
  mensajes: ConversacionMensaje[];
  leadNombre: string;
  atencionExterna?: boolean;
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
    <div className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
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
              <p className="text-sm font-medium">
                {atencionExterna ? "Atendida desde WhatsApp Business" : "La estás atendiendo vos"}
              </p>
              <p className="text-sm text-muted-foreground">
                {atencionExterna
                  ? "El bot quedó pausado al detectar una respuesta enviada desde el teléfono."
                  : "El bot no responde mientras tengas el chat tomado."}
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

      <Card className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b bg-muted/40 py-3 lg:shrink-0">
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
        <CardContent className="p-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <ChatThread
            conversacionId={conversacion.id}
            mensajes={mensajes}
            leadNombre={leadNombre}
            className="h-[60vh] lg:h-auto lg:min-h-0 lg:flex-1"
          />
        </CardContent>
      </Card>
    </div>
  );
}
