import Link from "next/link";
import Image from "next/image";
import { Building, ImageOff, Star } from "lucide-react";
import { EstadoBadge } from "@/components/ui/badge";
import { formatPrice, imageUrl } from "@/lib/utils";
import type { EstadoPropiedad, Moneda, Operacion, TipoPropiedad } from "@/lib/types";

export interface PropertyCardData {
  id: string;
  titulo: string;
  operacion: Operacion;
  tipo: TipoPropiedad;
  precio: number;
  moneda: Moneda;
  // operacion=ambos: precio/moneda = venta; estos = alquiler.
  precio_alquiler: number | null;
  moneda_alquiler: Moneda | null;
  estado: EstadoPropiedad;
  destacada: boolean;
  zona: string | null;
  /** Nombre del edificio y unidad ("Torre Alem · 3° B"), si pertenece a uno. */
  edificio: string | null;
  unidad: string | null;
  vendedor: string | null;
  portada: string | null;
  created_at?: string;
}

/** "Torre Alem · 3° B", "Torre Alem" o solo la unidad; null si no hay nada. */
export function edificioLabel(p: Pick<PropertyCardData, "edificio" | "unidad">): string | null {
  return [p.edificio, p.unidad].filter(Boolean).join(" · ") || null;
}

const OPERACION_LABEL: Record<Operacion, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  ambos: "Venta y alquiler",
};

/**
 * Qué precio(s) mostrar en la card/tabla. Para operacion=ambos: si se filtra por
 * alquiler muestra el de alquiler; por venta el de venta; sin filtro, los dos.
 * El resto de las operaciones muestra su único precio, sin etiqueta.
 */
export function preciosDeCard(
  p: Pick<PropertyCardData, "operacion" | "precio" | "moneda" | "precio_alquiler" | "moneda_alquiler">,
  filtroOperacion?: "venta" | "alquiler"
): {
  principal: { label: string | null; value: string };
  secundaria: { label: string; value: string } | null;
} {
  const venta = formatPrice(p.precio, p.moneda);
  const alquiler =
    p.precio_alquiler != null ? formatPrice(p.precio_alquiler, p.moneda_alquiler ?? p.moneda) : null;
  if (p.operacion !== "ambos") return { principal: { label: null, value: venta }, secundaria: null };
  if (filtroOperacion === "alquiler" && alquiler)
    return { principal: { label: "Alquiler", value: alquiler }, secundaria: null };
  if (filtroOperacion === "venta")
    return { principal: { label: "Venta", value: venta }, secundaria: null };
  return {
    principal: { label: "Venta", value: venta },
    secundaria: alquiler ? { label: "Alquiler", value: alquiler } : null,
  };
}

export function PropertyCard({
  property,
  actions,
  filtroOperacion,
}: {
  property: PropertyCardData;
  actions?: React.ReactNode;
  filtroOperacion?: "venta" | "alquiler";
}) {
  const precios = preciosDeCard(property, filtroOperacion);
  return (
    // En el celular la tarjeta es horizontal (foto chica a la izquierda) para
    // ver varias por pantalla; desde sm vuelve a la tarjeta con foto arriba.
    <div className="tarjeta-interactiva group flex flex-row overflow-hidden rounded-xl border bg-card shadow-xs sm:flex-col">
      <Link
        href={`/propiedades/${property.id}`}
        prefetch={false}
        className="relative block w-28 shrink-0 self-stretch overflow-hidden bg-muted min-[400px]:w-32 sm:aspect-[4/3] sm:w-auto sm:self-auto"
      >
        {property.portada ? (
          <Image
            src={imageUrl(property.portada)}
            alt={property.titulo}
            fill
            sizes="(max-width: 640px) 128px, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </span>
        )}
        <EstadoBadge
          estado={property.estado}
          className="absolute left-1.5 top-1.5 px-1.5 text-[10px] sm:left-2 sm:top-2 sm:px-2 sm:text-xs"
        />
        {property.destacada && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-semibold text-amber-950 sm:bottom-auto sm:left-auto sm:right-2 sm:top-2 sm:px-2">
            <Star className="size-3 fill-current" />
            <span className="hidden sm:inline">Destacada</span>
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="text-xs uppercase text-muted-foreground">
          {OPERACION_LABEL[property.operacion]} · {property.tipo}
          {property.zona ? ` · ${property.zona}` : ""}
        </p>
        <Link
          href={`/propiedades/${property.id}`}
          prefetch={false}
          className="line-clamp-2 font-semibold leading-snug transition-colors hover:text-primary sm:line-clamp-none"
        >
          {property.titulo}
        </Link>
        {edificioLabel(property) && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building className="size-3.5 shrink-0" />
            <span className="truncate">{edificioLabel(property)}</span>
          </p>
        )}
        <div>
          <p className="font-semibold tabular-nums text-primary">
            {precios.principal.label && (
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {precios.principal.label}
              </span>
            )}
            {precios.principal.value}
          </p>
          {precios.secundaria && (
            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide">
                {precios.secundaria.label}
              </span>
              {precios.secundaria.value}
            </p>
          )}
        </div>
        {property.vendedor && (
          <p className="text-sm text-muted-foreground">{property.vendedor}</p>
        )}
        {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
