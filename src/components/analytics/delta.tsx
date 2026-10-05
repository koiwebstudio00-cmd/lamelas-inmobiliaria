import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export type DeltaFormat = "count" | "pct" | "minutes";

export type Comparison = {
  current: number | null | undefined;
  previous: number | null | undefined;
  format: DeltaFormat;
  /** Para tiempos de respuesta: bajar es bueno. */
  lowerIsBetter?: boolean;
};

function describe({ current, previous, format }: Comparison) {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return null;
  }
  const diff = current - previous;
  if (format === "pct") {
    const pts = Math.round(diff * 10) / 10;
    return { diff, text: `${pts > 0 ? "+" : ""}${pts.toLocaleString("es-AR")} pts` };
  }
  if (previous === 0) {
    return { diff, text: diff === 0 ? "igual" : "antes 0" };
  }
  const rel = Math.round((diff / previous) * 100);
  return { diff, text: `${rel > 0 ? "+" : ""}${rel}%` };
}

/**
 * Variación contra el período anterior (el mes calendario previo en un mes
 * completo). Verde si mejora, rojo si empeora; gris si no cambió.
 */
export function Delta({ comparison, label = "vs. período anterior" }: { comparison: Comparison; label?: string }) {
  const result = describe(comparison);
  if (!result) return null;
  const { diff, text } = result;
  const good = comparison.lowerIsBetter ? diff < 0 : diff > 0;
  const tone = diff === 0 ? "text-muted-foreground" : good ? "text-emerald-700" : "text-rose-700";
  const Icon = diff === 0 ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="size-3.5" aria-hidden />
      <span className="tabular-nums">{text}</span>
      <span className="font-normal text-muted-foreground">{label}</span>
    </p>
  );
}
