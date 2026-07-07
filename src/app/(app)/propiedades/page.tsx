import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyFilters } from "@/components/properties/filters";
import { Pagination } from "@/components/properties/pagination";
import { getProperties, getVendedores } from "@/lib/queries";

export const metadata = { title: "Propiedades — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [{ properties, count, page }, vendedores] = await Promise.all([
    getProperties({
      q: params.q,
      operacion: params.operacion,
      tipo: params.tipo,
      estado: params.estado,
      vendedor: params.vendedor,
      pagina: params.pagina ? Number(params.pagina) : 1,
    }),
    getVendedores(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Propiedades</h1>
        <span className="text-sm text-muted-foreground">{count} en total</span>
      </div>

      <Suspense>
        <PropertyFilters vendedores={vendedores} />
      </Suspense>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay propiedades con esos criterios</p>
          <p className="text-sm text-muted-foreground">
            Probá limpiar los filtros o cargá una propiedad nueva.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        count={count}
        basePath="/propiedades"
        searchParams={params}
      />
    </div>
  );
}
