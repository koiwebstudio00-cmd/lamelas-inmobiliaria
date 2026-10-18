import { Megaphone } from "lucide-react";
import type { AnuncioRanking } from "@/lib/types";

/**
 * Anuncios de Facebook/Instagram que trajeron consultas por WhatsApp en el
 * período. Meta no manda un id estable del anuncio, así que cada fila es un
 * texto de anuncio: título + primeras líneas.
 */
export function TopAds({ rows }: { rows: AnuncioRanking[] }) {
  return (
    <section className="border bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Anuncios que trajeron consultas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Consultas por WhatsApp que empezaron tocando un anuncio de Facebook o Instagram, y cómo siguieron.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Ninguna consulta del período llegó desde un anuncio.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row, i) => (
            <li key={`${row.headline}-${i}`} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-2">
                <Megaphone className="mt-0.5 size-4 shrink-0 text-fuchsia-600" aria-hidden />
                <div className="min-w-0">
                  {row.headline && <p className="truncate text-sm font-medium">{row.headline}</p>}
                  {row.body && (
                    <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">{row.body}</p>
                  )}
                </div>
              </div>
              <dl className="grid shrink-0 grid-cols-4 gap-3 text-center sm:w-72">
                {(
                  [
                    ["Consultas", row.leads],
                    ["Derivadas", row.derivadas],
                    ["Tomadas", row.tomadas],
                    ["Ganadas", row.ganadas],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                    <dd className="text-base font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
