import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { EstadoBadge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, imageUrl } from "@/lib/utils";
import type { PropertyCardData } from "@/components/properties/property-card";
import type { Operacion } from "@/lib/types";

const OPERACION_LABEL: Record<Operacion, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
};

/**
 * Vista de tabla del listado. Mismos datos que la card, en columnas. En
 * pantallas chicas hay scroll horizontal en vez de apilar celdas: una tabla
 * que se apila deja de ser una tabla, y para eso está la vista de cards.
 */
export function PropertyTable({
  properties,
  acciones,
}: {
  properties: PropertyCardData[];
  /** Columna extra al final (cambiar estado, editar) para "Mis propiedades". */
  acciones?: (property: PropertyCardData) => React.ReactNode;
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
            <TableHead>Vendedor</TableHead>
            {acciones && (
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link
                  href={`/propiedades/${p.id}`}
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
                  className="block truncate font-medium hover:text-primary"
                >
                  {p.titulo}
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
                {formatPrice(p.precio, p.moneda)}
              </TableCell>
              <TableCell>
                <EstadoBadge estado={p.estado} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {p.vendedor ?? "—"}
              </TableCell>
              {acciones && (
                <TableCell>
                  <div className="flex items-center gap-2">{acciones(p)}</div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
