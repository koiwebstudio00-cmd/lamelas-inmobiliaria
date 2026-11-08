import Link from "next/link";
import { OPERATION_LABELS, TYPE_LABELS } from "@/components/analytics/labels";

/** Disponibles sin ninguna consulta en el período, las más antiguas primero. */
export function IdleProperties({
  rows,
  total,
}: {
  rows: {
    property_id: string;
    titulo: string;
    zona: string | null;
    operacion: string;
    tipo: string;
    created_at: string;
    days_published: number;
  }[];
  total: number;
}) {
  return (
    <section className="rounded-xl border bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Disponibles sin consultas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total === 0
            ? "Todas las disponibles recibieron al menos una consulta."
            : `${total} ${total === 1 ? "propiedad disponible no recibió" : "propiedades disponibles no recibieron"} consultas en el período. Conviene revisar precio, fotos o descripción.`}
          {total > rows.length ? ` Se muestran las ${rows.length} publicadas hace más tiempo.` : ""}
        </p>
      </div>
      {rows.length === 0 ? null : (
        <ul className="divide-y">
          {rows.map((row) => {
            const days = row.days_published;
            return (
              <li key={row.property_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/propiedades/${row.property_id}`}
                    prefetch={false}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {row.titulo}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {[TYPE_LABELS[row.tipo] ?? row.tipo, OPERATION_LABELS[row.operacion] ?? row.operacion, row.zona]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  Cargada hace {days} {days === 1 ? "día" : "días"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
