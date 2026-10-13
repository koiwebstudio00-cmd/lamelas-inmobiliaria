"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { addLeadAvance } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import {
  AVANCE_CIERRAN,
  AVANCE_LABELS,
  AVANCE_RESULTADOS,
  type AvanceResultado,
  type LeadAvance,
} from "@/lib/types";

/**
 * Avances del vendedor: cómo le fue al contactar la consulta. Es lo que le
 * deja ver al admin si una consulta avanzó sin tener que preguntar. Cuando
 * lleva tiempo sin novedades, el sistema lo pide con una notificación.
 */
export function LeadAvances({
  leadId,
  avances,
  pendiente,
  puedeCargar,
}: {
  leadId: string;
  avances: LeadAvance[];
  /** true = hace rato que no hay novedades: se resalta el pedido. */
  pendiente: boolean;
  /** Solo el responsable (o un admin) y solo con la consulta abierta. */
  puedeCargar: boolean;
}) {
  const [resultado, setResultado] = useState<AvanceResultado | null>(null);
  const [comentario, setComentario] = useState("");
  const [pending, startTransition] = useTransition();

  function guardar() {
    if (!resultado) return;
    startTransition(async () => {
      const error = await addLeadAvance(leadId, { resultado, comentario });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(
        AVANCE_CIERRAN.includes(resultado)
          ? "Avance guardado. La consulta quedó como perdida."
          : "Avance guardado"
      );
      setResultado(null);
      setComentario("");
    });
  }

  return (
    <div className="space-y-4">
      {pendiente && puedeCargar && (
        <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-3">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-900">
            <span className="font-medium">Hace varios días que no hay novedades.</span> Contanos
            cómo te fue al contactarla.
          </p>
        </div>
      )}

      {puedeCargar && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">¿Cómo te fue?</p>
          <div className="grid grid-cols-2 gap-1.5">
            {AVANCE_RESULTADOS.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={resultado === r.value}
                disabled={pending}
                onClick={() => setResultado(resultado === r.value ? null : r.value)}
                className={cn(
                  "min-h-10 border px-2 py-1.5 text-left text-xs font-medium leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                  resultado === r.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          {resultado && (
            <>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={
                  resultado === "no_califica"
                    ? "Opcional: por qué no califica (presupuesto, garantía, requisitos...)"
                    : "Detalle opcional: qué dijo, cuándo es la visita..."
                }
                aria-label="Comentario del avance"
                className="min-h-[64px] text-sm"
                maxLength={2000}
              />
              {AVANCE_CIERRAN.includes(resultado) && (
                <p className="text-xs text-muted-foreground">
                  Al guardar, la consulta pasa a <strong>Perdida</strong>.
                </p>
              )}
              <Button type="button" size="sm" disabled={pending} onClick={guardar}>
                <ClipboardCheck /> {pending ? "Guardando..." : "Guardar avance"}
              </Button>
            </>
          )}
        </div>
      )}

      {avances.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no se cargó ningún avance sobre esta consulta.
        </p>
      ) : (
        <ul className={cn("space-y-3", puedeCargar && "border-t pt-3")}>
          {avances.map((a) => (
            <li key={a.id} className="border-l-2 border-primary/40 pl-3">
              <p className="text-sm font-medium">{AVANCE_LABELS[a.resultado] ?? a.resultado}</p>
              {a.comentario && <p className="whitespace-pre-wrap text-sm">{a.comentario}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {a.autor ?? "—"} · {formatDateTime(a.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
