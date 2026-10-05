/**
 * Consultas del período contra propiedades disponibles hoy, por zona. La
 * columna "por propiedad" es la presión de demanda: alta = faltan propiedades
 * en esa zona; cero con stock = la zona no está traccionando.
 */
export function ZoneDemand({
  rows,
}: {
  rows: { zona: string; consultas: number; disponibles: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.consultas));

  return (
    <section className="border bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Demanda vs. oferta por zona</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Consultas sobre propiedades de cada zona en el período, contra lo disponible hoy.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Sin datos en este período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Zona</th>
                <th className="px-4 py-2 font-medium">Consultas</th>
                <th className="px-4 py-2 text-right font-medium">Disponibles</th>
                <th className="px-4 py-2 text-right font-medium">Por propiedad</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const ratio = row.disponibles > 0 ? row.consultas / row.disponibles : null;
                return (
                  <tr key={row.zona}>
                    <td className="px-4 py-2">{row.zona}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted sm:w-40">
                          <div className="h-full bg-primary" style={{ width: `${(row.consultas / max) * 100}%` }} />
                        </div>
                        <span className="tabular-nums">{row.consultas}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.disponibles}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {ratio === null ? (
                        row.consultas > 0 ? <span className="font-medium text-amber-700">sin stock</span> : "—"
                      ) : (
                        (Math.round(ratio * 10) / 10).toLocaleString("es-AR")
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
