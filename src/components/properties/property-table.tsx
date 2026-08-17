import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star } from "lucide-react";
import { EstadoBadge } from "@/components/ui/badge";
import { SharePropertyButton } from "@/components/properties/share-property-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { imageUrl } from "@/lib/utils";
import { preciosDeCard, type PropertyCardData } from "@/components/properties/property-card";
import type { Operacion } from "@/lib/types";

const OPERACION_LABEL: Record<Operacion, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  ambos: "Venta y alquiler",
};

/**
 * Vista de tabla del listado. Mismos datos que la card, en columnas. En
 * pantallas chicas hay scroll horizontal en vez de apilar celdas: una tabla
 * que se apila deja de ser una tabla, y para eso está la vista de cards.
 */
export function PropertyTable({
  properties,
  acciones,
  destacar,
  filtroOperacion,
}: {
  properties: PropertyCardData[];
  /** Columna dedicada para prender/apagar destacado en "Mis propiedades". */
  destacar?: (property: PropertyCardData) => React.ReactNode;
  /** Columna extra al final (cambiar estado, editar) para "Mis propiedades". */
  acciones?: (property: PropertyCardData) => React.ReactNode;
  /** Operación filtrada: define qué precio se ve en las propiedades "ambos". */
  filtroOperacion?: "venta" | "alquiler";
}) {
  return (
    <div className="overflow-x-auto border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">
              <span className="sr-only">Foto</span>
            </TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Operación</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead>Estado</TableHead>
            {destacar && <TableHead>Destacado</TableHead>}
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((p) => {
            const precios = preciosDeCard(p, filtroOperacion);
            return (
            <TableRow key={p.id}>
              <TableCell>
                <Link
                  href={`/propiedades/${p.id}`}
                  prefetch={false}
                  className="relative block size-12 bg-muted"
                >
                  {p.portada ? (
                    <Image
                      src={imageUrl(p.portada)}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-4" />
                    </span>
                  )}
                </Link>
              </TableCell>
              <TableCell className="max-w-[22rem]">
                <Link
                  href={`/propiedades/${p.id}`}
                  prefetch={false}
                  className="flex items-center gap-1.5 truncate font-medium hover:text-primary"
                >
                  {p.destacada && (
                    <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-500" aria-label="Destacada" />
                  )}
                  <span className="truncate">{p.titulo}</span>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {OPERACION_LABEL[p.operacion]}
              </TableCell>
              <TableCell className="capitalize">{p.tipo}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {p.zona ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-medium tabular-nums text-primary">
                <span>
                  {precios.principal.label && (
                    <span className="mr-1 text-[11px] font-normal uppercase text-muted-foreground">
                      {precios.principal.label}
                    </span>
                  )}
                  {precios.principal.value}
                </span>
                {precios.secundaria && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {precios.secundaria.label} {precios.secundaria.value}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <EstadoBadge estado={p.estado} />
              </TableCell>
              {destacar && (
                <TableCell>
                  {destacar(p)}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <SharePropertyButton propertyId={p.id} compact />
                  {acciones?.(p)}
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
