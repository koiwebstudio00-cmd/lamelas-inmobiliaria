import type { LucideIcon } from "lucide-react";

export function AnalyticsMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-primary" />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
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
