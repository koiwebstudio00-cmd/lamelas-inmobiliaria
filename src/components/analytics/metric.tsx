import type { LucideIcon } from "lucide-react";
import { Delta, type Comparison } from "@/components/analytics/delta";

export function AnalyticsMetric({
  label,
  value,
  detail,
  icon: Icon,
  comparison,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  comparison?: Comparison;
}) {
  return (
    <div className="border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-primary" />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      {comparison ? <Delta comparison={comparison} /> : null}
    </div>
  );
}

export function Breakdown({
  title,
  values,
  labels,
  description,
}: {
  title: string;
  values: Record<string, number>;
  labels: Record<string, string>;
  description?: string;
}) {
  const rows = Object.entries(values).filter(([, value]) => value > 0);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);

  const barColor: Record<string, string> = {
    web: "bg-emerald-600",
    whatsapp: "bg-sky-600",
    manual: "bg-amber-500",
    instagram: "bg-fuchsia-600",
    messenger: "bg-blue-600",
    nueva: "bg-sky-600",
    en_contacto: "bg-amber-500",
    ganada: "bg-emerald-600",
    perdida: "bg-rose-600",
    venta: "bg-emerald-600",
    alquiler: "bg-sky-600",
    sin_operacion: "bg-slate-400",
    potencial: "bg-emerald-600",
    fantasma: "bg-zinc-500",
    sin_clasificar: "bg-slate-400",
    con_propiedad: "bg-sky-600",
    general: "bg-slate-500",
    sin_tomar: "bg-amber-500",
    origen_no_registrado: "bg-slate-400",
    over_24h: "bg-rose-600",
    from_4_to_24h: "bg-amber-500",
    from_1_to_4h: "bg-sky-600",
    under_1h: "bg-emerald-600",
    tomado: "bg-emerald-600",
    pendiente: "bg-amber-500",
    timeout_reasignado: "bg-sky-600",
    rechazado: "bg-rose-600",
    caliente: "bg-rose-600",
    tibia: "bg-amber-500",
    fria: "bg-sky-600",
    sin_dato: "bg-slate-400",
    disponible: "bg-emerald-600",
    reservado: "bg-amber-500",
    vendida: "bg-slate-600",
    alquilada: "bg-slate-500",
  };

  return (
    <section className="border bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Sin datos en este período.</p>
      ) : (
        <div className="space-y-3 p-4">
          {rows.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{labels[key] ?? key}</span>
                <span className="font-medium tabular-nums">
                  {value} <span className="font-normal text-muted-foreground">· {Math.round((value / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden bg-muted">
                <div className={`h-full ${barColor[key] ?? "bg-primary"}`} style={{ width: `${(value / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
