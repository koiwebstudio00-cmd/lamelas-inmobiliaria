import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyTable } from "@/components/properties/property-table";
import { PropertyFilters } from "@/components/properties/filters";
import { Pagination } from "@/components/pagination";
import { VistaToggle } from "@/components/vista-toggle";
import { getEdificios, getProperties, getVendedores } from "@/lib/queries";
import { getVista } from "@/lib/vista";

export const metadata = { title: "Propiedades — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [{ properties, count, page }, vendedores, vista, edificios] = await Promise.all([
    getProperties({
      q: params.q,
      operacion: params.operacion,
      tipo: params.tipo,
      estado: params.estado,
      vendedor: params.vendedor,
      edificio: params.edificio,
      dormitorios: params.dormitorios,
      zona_revisar: params.zona_revisar,
      pagina: params.pagina ? Number(params.pagina) : 1,
    }),
    getVendedores(),
    getVista(),
    getEdificios(),
  ]);
  const edificioActivo = edificios.find((e) => e.id === params.edificio);

  // Filtro de operación activo: define qué precio se muestra en las "ambos".
  const filtroOperacion =
    params.operacion === "venta" || params.operacion === "alquiler"
      ? params.operacion
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            {edificioActivo ? edificioActivo.nombre : "Propiedades"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {edificioActivo
              ? `Unidades cargadas en este edificio. ${count} en total.`
              : `Todo lo que tiene cargado la inmobiliaria. ${count} en total.`}
          </p>
        </div>
        <VistaToggle vista={vista} />
      </div>

      <Suspense>
        <PropertyFilters vendedores={vendedores} edificios={edificios} />
      </Suspense>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay propiedades con esos criterios</p>
          <p className="text-sm text-muted-foreground">
            Probá limpiar los filtros o cargá una propiedad nueva.
          </p>
        </div>
      ) : vista === "tabla" ? (
        <PropertyTable properties={properties} filtroOperacion={filtroOperacion} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} filtroOperacion={filtroOperacion} />
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
