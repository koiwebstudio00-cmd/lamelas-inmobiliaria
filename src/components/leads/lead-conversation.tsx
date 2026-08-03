"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Paperclip, RefreshCw, Undo2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { releaseConversacion, takeConversacion } from "@/actions/conversations";
import { cn, formatDateTime } from "@/lib/utils";
import type {
  Conversacion,
  ConversacionMensaje,
  EstadoConversacion,
  RolMensaje,
} from "@/lib/types";

const ESTADO: Record<EstadoConversacion, { label: string; className: string }> = {
  bot: { label: "Atiende el bot", className: "bg-primary/10 text-primary" },
  esperando_humano: {
    label: "Esperando que la tomen",
    className: "bg-amber-100 text-amber-800",
  },
  humano: { label: "La tomó un vendedor", className: "bg-primary text-primary-foreground" },
  cerrada: { label: "Cerrada", className: "bg-muted text-muted-foreground" },
};

// Quién escribe cada mensaje: define alineación y estilo de la burbuja. El lead
// va a la izquierda; el equipo (bot y vendedor) a la derecha; el sistema, al
// centro y en chico, porque son avisos, no parte de la charla.
const ROL: Record<RolMensaje, { lado: "izq" | "der" | "centro"; etiqueta: string }> = {
  lead: { lado: "izq", etiqueta: "Lead" },
  agente_ia: { lado: "der", etiqueta: "Sofi (IA)" },
  vendedor: { lado: "der", etiqueta: "Vendedor" },
  sistema: { lado: "centro", etiqueta: "Sistema" },
};

function perfilLinea(c: Conversacion): string | null {
  const p = c.perfil;
  const partes: string[] = [];
  if (p.temperatura) partes.push(`🌡 ${p.temperatura}`);
  if (p.intencion) partes.push(p.intencion);
  if (p.tipo_propiedad) partes.push(p.tipo_propiedad);
  if (p.dormitorios_min) partes.push(`${p.dormitorios_min}+ dorm.`);
  const zona = p.zonas?.length ? p.zonas.join(", ") : p.ciudad;
  if (zona) partes.push(zona);
  if (p.presupuesto_min || p.presupuesto_max) {
    const fmt = (n: number) => n.toLocaleString("es-AR");
    const moneda = p.moneda ?? "";
    const rango =
      p.presupuesto_min && p.presupuesto_max
        ? `${fmt(p.presupuesto_min)}–${fmt(p.presupuesto_max)}`
        : fmt((p.presupuesto_min ?? p.presupuesto_max) as number);
    partes.push(`${moneda} ${rango}`.trim());
  }
  return partes.length ? partes.join(" · ") : null;
}

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

  const estado = ESTADO[conversacion.estado];
  const perfil = perfilLinea(conversacion);
  const cerrada = conversacion.estado === "cerrada";
  const tomada = conversacion.estado === "humano";

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
            estado.className
          )}
        >
          {estado.label}
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
            disabled={pending}
          >
            <RefreshCw className={cn(pending && "animate-spin")} /> Refrescar
          </Button>

          {!cerrada &&
            (tomada ? (
              <Button type="button" variant="outline" size="sm" onClick={soltar} disabled={pending}>
                <Undo2 /> Devolver al bot
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={tomar} disabled={pending}>
                <UserCheck /> Tomar el chat
              </Button>
            ))}
        </div>
      </div>

      {perfil && (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{perfil}</span>
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {mensajes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay mensajes en esta conversación.</p>
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
    </div>
  );
}
