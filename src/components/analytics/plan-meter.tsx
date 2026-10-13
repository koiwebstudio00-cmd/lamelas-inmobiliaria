import { CircleAlert, CircleCheck, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanAgente } from "@/lib/types";

const nf = new Intl.NumberFormat("es-AR");
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Verde hasta el 80%, ámbar hasta el 100%, rojo pasado. Siempre con ícono y texto. */
function estado(porcentaje: number) {
  if (porcentaje >= 100) {
    return { label: "Plan superado", icon: OctagonAlert, barra: "bg-red-600", texto: "text-red-700" };
  }
  if (porcentaje >= 80) {
    return { label: "Cerca del límite", icon: CircleAlert, barra: "bg-amber-500", texto: "text-amber-800" };
  }
  return { label: "Dentro del plan", icon: CircleCheck, barra: "bg-primary", texto: "text-primary" };
}

/**
 * Conversaciones que atendió el agente en el mes contra las del plan contratado,
 * con proyección a fin de mes. Sin plan cargado no se muestra.
 */
export function PlanMeter({ plan, className }: { plan: PlanAgente | null; className?: string }) {
  if (!plan || !plan.limite) return null;
  const pct = plan.porcentaje ?? 0;
  const e = estado(pct);
  const proyPct = (plan.proyeccion / plan.limite) * 100;
  const [, m] = plan.mes.split("-").map(Number);
  const mes = MESES[(m ?? 1) - 1];
  const restantes = Math.max(0, plan.limite - plan.usadas);

  return (
    <section className={cn("border bg-background p-4", className)} aria-label="Plan de conversaciones del agente">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            Conversaciones del agente · {mes}
            {plan.es_mes_actual ? "" : ` ${plan.mes.slice(0, 4)}`}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {nf.format(plan.usadas)}{" "}
            <span className="text-base font-normal text-muted-foreground">de {nf.format(plan.limite)}</span>
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1 text-sm font-medium", e.texto)}>
          <e.icon className="size-4" /> {e.label} · {pct.toLocaleString("es-AR")}%
        </span>
      </div>

      <div
        className="relative mt-3 h-2.5 w-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={plan.limite}
        aria-valuenow={plan.usadas}
        aria-valuetext={`${plan.usadas} de ${plan.limite} conversaciones`}
      >
        <div className={cn("h-full", e.barra)} style={{ width: `${Math.min(100, pct)}%` }} />
        {plan.es_mes_actual && proyPct > pct && proyPct <= 100 && (
          // Dónde terminaría el mes a este ritmo.
          <div
            className="absolute -top-1 h-[18px] w-0.5 bg-foreground/60"
            style={{ left: `calc(${proyPct}% - 1px)` }}
            aria-hidden
          />
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {plan.es_mes_actual ? (
          <>
            Quedan {nf.format(restantes)}. A este ritmo el mes cierra en{" "}
            <span className={cn("font-medium", plan.proyeccion > plan.limite ? "text-red-700" : "text-foreground")}>
              {nf.format(plan.proyeccion)}
            </span>{" "}
            (día {plan.dias_transcurridos} de {plan.dias_del_mes}).
          </>
        ) : (
          <>Mes cerrado{plan.usadas > plan.limite ? `: se pasó por ${nf.format(plan.usadas - plan.limite)}` : ""}.</>
        )}{" "}
        Cuenta cada conversación nueva que el agente atendió en el mes; no incluye el probador.
      </p>
    </section>
  );
}
