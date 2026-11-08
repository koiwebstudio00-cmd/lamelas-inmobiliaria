/**
 * Barras verticales para distribuciones cortas y ordenadas (horas del día,
 * días de la semana). Sin librería de gráficos: divs con alto proporcional.
 */
export function TimeDistribution({
  title,
  description,
  rows,
  labelFor,
  highlight,
}: {
  title: string;
  description?: string;
  rows: { bucket: number; count: number }[];
  labelFor: (bucket: number) => string;
  /** Marca con otro color los buckets que interesa resaltar (p. ej. fuera de horario). */
  highlight?: (bucket: number) => boolean;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  // Con muchas columnas (24 horas) se etiqueta una de cada tres para que entre en el celular.
  const step = rows.length > 12 ? 3 : 1;

  return (
    <section className="rounded-xl border bg-background" aria-label={`${title}: ${total} en total`}>
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {total === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Sin datos en este período.</p>
      ) : (
        <div className="p-4">
          <div className="flex h-32 items-end gap-px sm:gap-1">
            {rows.map((row) => (
              <div
                key={row.bucket}
                className="flex h-full flex-1 flex-col justify-end"
                title={`${labelFor(row.bucket)}: ${row.count}`}
              >
                <div
                  className={highlight?.(row.bucket) ? "bg-amber-500" : "bg-primary"}
                  style={{ height: `${(row.count / max) * 100}%`, minHeight: row.count > 0 ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-px sm:gap-1">
            {rows.map((row, index) => (
              <span key={row.bucket} className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums">
                {index % step === 0 ? labelFor(row.bucket) : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
