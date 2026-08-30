const COLORS: Record<string, string> = {
  web: "#0e9145",
  whatsapp: "#1877f2",
  manual: "#d89b16",
  instagram: "#c13584",
  messenger: "#6b7280",
};

const LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  manual: "Manual",
  instagram: "Instagram",
  messenger: "Messenger",
};

export function DailyVolume({ rows }: { rows: { date: string; canal: string; count: number }[] }) {
  const byDate = new Map<string, { total: number; channels: Record<string, number> }>();
  for (const row of rows) {
    const current = byDate.get(row.date) ?? { total: 0, channels: {} };
    current.total += row.count;
    current.channels[row.canal] = row.count;
    byDate.set(row.date, current);
  }
  const entries = [...byDate.entries()];
  const max = Math.max(1, ...entries.map(([, value]) => value.total));
  const channels = [...new Set(rows.map((row) => row.canal))];

  return (
    <section
      className="border bg-background"
      aria-label={`Volumen diario de consultas: ${rows.reduce((sum, row) => sum + row.count, 0)} en total`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Volumen por día</h3>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {channels.map((channel) => (
            <span key={channel} className="flex items-center gap-1.5">
              <span className="size-2" style={{ backgroundColor: COLORS[channel] }} />
              {LABELS[channel] ?? channel}
            </span>
          ))}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">No entraron consultas en este período.</p>
      ) : (
        <div className="max-h-[28rem] space-y-2 overflow-y-auto p-4">
          {entries.map(([date, value]) => (
            <div key={date} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-xs">
              <time className="text-muted-foreground">
                {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}
              </time>
              <div className="flex h-5 bg-muted" style={{ width: `${Math.max(2, (value.total / max) * 100)}%` }}>
                {Object.entries(value.channels).map(([channel, count]) => (
                  <span
                    key={channel}
                    title={`${LABELS[channel] ?? channel}: ${count}`}
                    style={{ width: `${(count / value.total) * 100}%`, backgroundColor: COLORS[channel] }}
                  />
                ))}
              </div>
              <span className="text-right font-medium tabular-nums">{value.total}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
