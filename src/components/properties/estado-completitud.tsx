import { AlertTriangle } from "lucide-react";
import { EstadoBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { etiquetaCampo } from "@/lib/completitud";
import type { EstadoPropiedad } from "@/lib/types";

const datos = (n: number) => `${n} ${n === 1 ? "dato" : "datos"}`;

/**
 * Estado de la propiedad con su completitud (FORM-UNICO-01):
 * - Borrador: "Borrador · faltan N datos".
 * - Publicada a la que le falta algo (propiedades viejas): el estado y, al lado,
 *   "Faltan datos".
 * - Completa: solo el estado.
 */
export function EstadoCompletitud({
  estado,
  faltantes,
  className,
}: {
  estado: EstadoPropiedad;
  faltantes: string[];
  className?: string;
}) {
  const titulo = faltantes.length ? `Falta: ${faltantes.map(etiquetaCampo).join(", ")}` : undefined;
  if (estado === "borrador") {
    return (
      <EstadoBadge estado="borrador" className={className}>
        {faltantes.length ? `Borrador · faltan ${datos(faltantes.length)}` : "Borrador"}
      </EstadoBadge>
    );
  }
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)} title={titulo}>
      <EstadoBadge estado={estado} />
      {faltantes.length > 0 && <FaltanDatosBadge />}
    </span>
  );
}

export function FaltanDatosBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900",
        className
      )}
    >
      <AlertTriangle className="size-3" /> Faltan datos
    </span>
  );
}
