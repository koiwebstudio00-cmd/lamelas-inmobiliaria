import Link from "next/link";
import { Building, ChevronRight } from "lucide-react";
import { EdificioActions } from "@/components/edificios/edificio-actions";
import { getCurrentUser } from "@/lib/api";
import { getEdificios } from "@/lib/queries";

export const metadata = { title: "Edificios — Lamelas & Chaumont" };

export default async function EdificiosPage() {
  const [edificios, me] = await Promise.all([getEdificios(), getCurrentUser()]);
  const esAdmin = me?.rol === "admin" || me?.rol === "super_admin";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Edificios</h1>
        <p className="text-sm text-muted-foreground">
          Agrupan las unidades que la inmobiliaria ofrece dentro de una misma torre. Se crean
          al cargar o editar una propiedad, en la sección «Edificio».
        </p>
      </div>

      {edificios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed bg-background p-12 text-center">
          <Building className="size-8 text-muted-foreground" />
          <p className="font-medium">Todavía no hay edificios</p>
          <p className="text-sm text-muted-foreground">
            Editá un departamento, elegí «Nuevo edificio» y cargale la unidad (por ejemplo «3° B»).
            Después vinculá las demás unidades al mismo edificio.
          </p>
        </div>
      ) : (
        <ul className="border bg-background">
          {edificios.map((e) => (
            <li key={e.id} className="flex items-center gap-2 border-b px-4 py-3 last:border-b-0">
              <Link
                href={`/propiedades?edificio=${e.id}`}
                prefetch={false}
                className="group flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Building className="size-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium group-hover:text-primary">
                    {e.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {e.unidades === 0
                      ? "Sin unidades vinculadas"
                      : `${e.unidades} ${e.unidades === 1 ? "unidad" : "unidades"}`}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              {esAdmin && <EdificioActions id={e.id} nombre={e.nombre} unidades={e.unidades} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
