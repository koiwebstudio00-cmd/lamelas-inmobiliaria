"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Filtros de un listado. En escritorio (≥ sm) se ven en línea, como siempre.
 * En el celular la búsqueda queda a la vista y el resto se abre en un panel
 * desde abajo con el botón "Filtros" (que muestra cuántos hay aplicados), así
 * los resultados arrancan arriba de todo y no después de seis selects.
 *
 * Los filtros aplican al instante (cambian la URL): "Ver resultados" solo
 * cierra el panel.
 */
export function FiltrosPlegables({
  busqueda,
  activos,
  gridClassName,
  children,
  extra,
  onLimpiar,
}: {
  /** Campo de búsqueda: siempre visible. */
  busqueda: ReactNode;
  /** Cantidad de filtros aplicados (sin contar la búsqueda). */
  activos: number;
  /** Grilla de los filtros en línea (escritorio). */
  gridClassName: string;
  /** Los selects de filtro. */
  children: ReactNode;
  /** Algo más debajo de los filtros (un checkbox, por ejemplo). */
  extra?: ReactNode;
  /** Si viene, se muestra "Limpiar filtros". */
  onLimpiar?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">{busqueda}</div>
        <Button
          type="button"
          variant="outline"
          className="relative h-11 shrink-0 sm:hidden"
          onClick={() => setAbierto(true)}
          aria-label={activos > 0 ? `Filtros (${activos} aplicados)` : "Filtros"}
        >
          <SlidersHorizontal />
          Filtros
          {activos > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
              {activos}
            </span>
          )}
        </Button>
      </div>

      {/* Escritorio: en línea */}
      <div className="hidden space-y-2 sm:block">
        <div className={gridClassName}>{children}</div>
        {extra}
        {onLimpiar && (
          <Button variant="ghost" size="sm" onClick={onLimpiar}>
            <X /> Limpiar filtros
          </Button>
        )}
      </div>

      {/* Celular: chip para limpiar sin abrir el panel */}
      {onLimpiar && activos > 0 && (
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors active:bg-muted sm:hidden"
        >
          <X className="size-3.5" /> Limpiar {activos === 1 ? "filtro" : `${activos} filtros`}
        </button>
      )}

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl sm:hidden"
        >
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription className="sr-only">Elegí qué mostrar en el listado</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <div className="grid grid-cols-1 gap-3">{children}</div>
            {extra}
          </div>
          <SheetFooter
            className={cn(
              "sticky bottom-0 mt-4 flex-row gap-2 border-t bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]",
            )}
          >
            {onLimpiar && (
              <Button variant="outline" className="h-11 flex-1" onClick={onLimpiar} disabled={activos === 0}>
                Limpiar
              </Button>
            )}
            <Button className="h-11 flex-1" onClick={() => setAbierto(false)}>
              Ver resultados
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
