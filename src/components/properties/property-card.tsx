import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
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
  estado: EstadoPropiedad;
  zona: string | null;
  vendedor: string | null;
  portada: string | null;
}

const OPERACION_LABEL: Record<Operacion, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
};

export function PropertyCard({
  property,
  actions,
}: {
  property: PropertyCardData;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col border bg-card shadow-sm">
      <Link
        href={`/propiedades/${property.id}`}
        className="relative block aspect-[4/3] bg-muted"
      >
        {property.portada ? (
          <Image
            src={imageUrl(property.portada)}
            alt={property.titulo}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </span>
        )}
        <EstadoBadge estado={property.estado} className="absolute left-2 top-2" />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase text-muted-foreground">
          {OPERACION_LABEL[property.operacion]} · {property.tipo}
          {property.zona ? ` · ${property.zona}` : ""}
        </p>
        <Link
          href={`/propiedades/${property.id}`}
          className="font-semibold hover:text-primary"
        >
          {property.titulo}
        </Link>
        <p className="font-semibold tabular-nums text-primary">
          {formatPrice(property.precio, property.moneda)}
        </p>
        {property.vendedor && (
          <p className="text-sm text-muted-foreground">{property.vendedor}</p>
        )}
        {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
