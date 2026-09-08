import Link from "next/link";
import { Star } from "lucide-react";
import { DestacarButton } from "@/components/properties/destacar-button";

/**
 * Ranking de propiedades por consultas recibidas en el período — para que el
 * admin destaque con datos reales en vez de a ojo. El botón reusa
 * DestacarButton: se puede destacar/quitar sin salir de analíticas.
 */
export function TopProperties({
  rows,
}: {
  rows: { property_id: string; titulo: string; destacada: boolean; consultas: number }[];
}) {
  return (
    <section className="border bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Propiedades más consultadas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Cuántas consultas recibió cada propiedad en el período. Usalo para decidir qué destacar.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Sin consultas vinculadas a una propiedad en este período.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li
              key={row.property_id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                {row.destacada && (
                  <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-500" />
                )}
                <Link
                  href={`/propiedades/${row.property_id}`}
                  prefetch={false}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {row.titulo}
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {row.consultas} {row.consultas === 1 ? "consulta" : "consultas"}
                </span>
                <DestacarButton propertyId={row.property_id} destacada={row.destacada} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
