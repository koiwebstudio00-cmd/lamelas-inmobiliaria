import { Suspense } from "react";
import Link from "next/link";
import { ClipboardList, MapPin, Plus, UserRound } from "lucide-react";
import { CaptacionesFiltros } from "@/components/captaciones/captaciones-filtros";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { getCaptaciones } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Captaciones — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function CaptacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { items, count, page } = await getCaptaciones({
    q: params.q,
    mias: params.mias === "1",
    pagina: params.pagina ? Number(params.pagina) : 1,
  });
  const filtrando = Boolean(params.q || params.mias);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Captaciones</h1>
          <p className="text-sm text-muted-foreground">
            Alquileres para captar: cargalos acá y mandá el mensaje al grupo de WhatsApp.
          </p>
        </div>
        <Button asChild>
          <Link href="/captaciones/nueva" prefetch={false}>
            <Plus /> Nueva captación
          </Link>
        </Button>
      </div>

      <Suspense>
        <CaptacionesFiltros />
      </Suspense>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="font-medium">{filtrando ? "No hay captaciones con esos filtros" : "Todavía no hay captaciones"}</p>
          <p className="text-sm text-muted-foreground">
            {filtrando ? "Probá con otra búsqueda." : "Cargá la primera y el mensaje para el grupo sale solo."}
          </p>
        </div>
      ) : (
        <ul className="divide-y border bg-background">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/captaciones/${c.id}`}
                prefetch={false}
                className="flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  Alquiler · {c.tipo}
                </span>
                <span className="font-medium">{c.direccion}</span>
                {(c.barrio || c.localidad) && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {[c.barrio, c.localidad].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {c.responsable && (
                    <span className="flex items-center gap-1">
                      <UserRound className="size-3.5" aria-hidden /> {c.responsable.nombre}
                    </span>
                  )}
                  <span>
                    Cargó {c.autor.nombre} · {formatDateTime(c.created_at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} count={count} basePath="/captaciones" searchParams={params} />
    </div>
  );
}
