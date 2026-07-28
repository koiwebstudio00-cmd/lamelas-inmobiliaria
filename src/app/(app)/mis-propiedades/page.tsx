import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyTable } from "@/components/properties/property-table";
import { Pagination } from "@/components/pagination";
import { EstadoSelect } from "@/components/properties/estado-select";
import { VistaToggle } from "@/components/vista-toggle";
import { getMyProperties } from "@/lib/queries";
import { getVista } from "@/lib/vista";

export const metadata = { title: "Mis propiedades — Lamelas & Chaumont" };

export default async function MisPropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [{ properties, count, page }, vista] = await Promise.all([
    getMyProperties({
      pagina: params.pagina ? Number(params.pagina) : 1,
    }),
    getVista(),
  ]);

  // Las mismas acciones en las dos vistas: cambiar estado y editar.
  const acciones = (p: (typeof properties)[number]) => (
    <>
      <EstadoSelect propertyId={p.id} estado={p.estado} />
      <Button asChild variant="outline" size="sm">
        <Link href={`/propiedades/${p.id}/editar`}>
          <Pencil /> Editar
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Mis propiedades</h1>
          <p className="text-sm text-muted-foreground">
            Las que cargaste vos. {count} en total.
          </p>
        </div>
        <VistaToggle vista={vista} />
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed p-12 text-center">
          <p className="font-medium">Todavía no cargaste propiedades</p>
          <Button asChild>
            <Link href="/propiedades/nueva">
              <Plus /> Cargar la primera
            </Link>
          </Button>
        </div>
      ) : vista === "tabla" ? (
        <PropertyTable properties={properties} acciones={acciones} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} actions={acciones(p)} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        count={count}
        basePath="/mis-propiedades"
        searchParams={params}
      />
    </div>
  );
}
