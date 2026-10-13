import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Páginas a mostrar: la primera, la última y una ventana de `vecinos` páginas a
 * cada lado de la actual, con "…" donde se saltean páginas. En los extremos la
 * ventana se corre para no achicarse (desde la 1 se llega a la 3 de un toque).
 * Si el salto es de una sola página, se muestra esa página en vez de "…".
 *   vecinos 1, página 1 de 8  → 1 2 3 … 8
 *   vecinos 2, página 6 de 22 → 1 … 4 5 6 7 8 … 22
 */
export function paginasVisibles(
  page: number,
  totalPages: number,
  vecinos = 2
): (number | "…")[] {
  const ancho = 2 * vecinos + 1;
  let desde = Math.max(1, page - vecinos);
  let hasta = Math.min(totalPages, page + vecinos);
  if (hasta - desde + 1 < ancho) {
    if (desde === 1) hasta = Math.min(totalPages, ancho);
    else desde = Math.max(1, totalPages - ancho + 1);
  }
  const nums = [1, totalPages];
  for (let n = desde; n <= hasta; n++) nums.push(n);
  const unicos = [...new Set(nums)].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (const n of unicos) {
    const prev = out[out.length - 1];
    if (typeof prev === "number") {
      if (n - prev === 2) out.push(prev + 1);
      else if (n - prev > 2) out.push("…");
    }
    out.push(n);
  }
  return out;
}

function Paginas({
  page,
  totalPages,
  vecinos,
  href,
  className,
}: {
  page: number;
  totalPages: number;
  vecinos: number;
  href: (p: number) => string;
  className?: string;
}) {
  return (
    <ul className={cn("items-center justify-center gap-1", className)}>
      <li>
        {page > 1 ? (
          <Button asChild variant="outline" size="icon" className="size-9">
            <Link href={href(page - 1)} prefetch={false} aria-label="Página anterior">
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="size-9" disabled aria-label="Página anterior">
            <ChevronLeft />
          </Button>
        )}
      </li>
      {paginasVisibles(page, totalPages, vecinos).map((p, i) =>
        p === "…" ? (
          <li key={`gap-${i}`} aria-hidden className="w-5 text-center text-sm text-muted-foreground">
            …
          </li>
        ) : (
          <li key={p}>
            <Button
              asChild
              variant={p === page ? "default" : "outline"}
              size="sm"
              className={cn("h-9 min-w-9 px-2 tabular-nums", p === page && "pointer-events-none")}
            >
              <Link
                href={href(p)}
                prefetch={false}
                aria-label={`Página ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            </Button>
          </li>
        )
      )}
      <li>
        {page < totalPages ? (
          <Button asChild variant="outline" size="icon" className="size-9">
            <Link href={href(page + 1)} prefetch={false} aria-label="Página siguiente">
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="size-9" disabled aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        )}
      </li>
    </ul>
  );
}

export function Pagination({
  page,
  count,
  basePath,
  searchParams,
}: {
  page: number;
  count: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "pagina") params.set(k, v);
    }
    if (p > 1) params.set("pagina", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav aria-label="Paginación" className="flex flex-col items-center gap-2">
      {/* En el celular, una página a cada lado (entra en 390 px); en pantallas
          más anchas, dos. */}
      <Paginas page={page} totalPages={totalPages} vecinos={1} href={href} className="flex sm:hidden" />
      <Paginas page={page} totalPages={totalPages} vecinos={2} href={href} className="hidden sm:flex" />
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {count} en total
      </p>
    </nav>
  );
}
