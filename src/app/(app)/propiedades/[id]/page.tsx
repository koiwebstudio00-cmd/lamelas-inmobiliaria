import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Pencil, MapPin, BedDouble, Bath, Ruler, LayoutGrid, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/ui/badge";
import { EstadoSelect } from "@/components/properties/estado-select";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { PhotoManager } from "@/components/properties/photo-manager";
import { getCurrentUser } from "@/lib/api";
import { getProperty } from "@/lib/queries";
import { formatPrice, imageUrl } from "@/lib/utils";

const OPERACION_LABEL = { venta: "Venta", alquiler: "Alquiler" } as const;
const TIPO_LABEL = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  otro: "Otro",
} as const;

export default async function PropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, me] = await Promise.all([getProperty(id), getCurrentUser()]);

  if (!detail) notFound();

  const { property, vendedor, images: gallery } = detail;
  const isOwner = me?.id === property.user_id;

  const facts = [
    property.ambientes != null && {
      icon: LayoutGrid,
      label: `${property.ambientes} amb.`,
    },
    property.dormitorios != null && {
      icon: BedDouble,
      label: `${property.dormitorios} dorm.`,
    },
    property.banios != null && { icon: Bath, label: `${property.banios} baños` },
    property.sup_cubierta != null && {
      icon: Ruler,
      label: `${property.sup_cubierta} m² cub.`,
    },
    property.sup_total != null && {
      icon: Ruler,
      label: `${property.sup_total} m² tot.`,
    },
  ].filter(Boolean) as { icon: typeof Ruler; label: string }[];

  const ubicacion = [property.direccion, property.zona, property.ciudad]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">
            {OPERACION_LABEL[property.operacion]} · {TIPO_LABEL[property.tipo]}
          </p>
          <h1 className="text-2xl font-semibold">{property.titulo}</h1>
          <p className="text-xl font-semibold tabular-nums text-primary">
            {formatPrice(property.precio, property.moneda)}
          </p>
        </div>
        <EstadoBadge estado={property.estado} />
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center gap-2 border bg-background p-3">
          <EstadoSelect propertyId={property.id} estado={property.estado} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/propiedades/${property.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </Button>
          <DeletePropertyButton propertyId={property.id} titulo={property.titulo} />
        </div>
      )}

      {/* Galería / gestión de fotos */}
      {isOwner ? (
        <div className="border bg-background p-4">
          <PhotoManager propertyId={property.id} images={gallery} />
        </div>
      ) : gallery.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {gallery.map((img) => (
            <div key={img.id} className="relative aspect-[4/3] border bg-muted">
              <Image
                src={imageUrl(img.url)}
                alt={property.titulo}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4 border bg-background p-4 sm:p-6">
        {ubicacion && (
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground" /> {ubicacion}
          </p>
        )}

        {facts.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {facts.map((f) => (
              <span key={f.label} className="flex items-center gap-1.5">
                <f.icon className="size-4 text-muted-foreground" /> {f.label}
              </span>
            ))}
          </div>
        )}

        {property.descripcion && (
          <div>
            <h2 className="mb-1 text-sm font-semibold text-muted-foreground">
              Descripción
            </h2>
            <p className="whitespace-pre-wrap text-sm">{property.descripcion}</p>
          </div>
        )}

        {property.notas && (
          <div className="border border-[var(--estado-reservada-bg)] bg-[var(--estado-reservada-bg)]/30 p-3">
            <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
              <StickyNote className="size-4" /> Notas internas
            </h2>
            <p className="whitespace-pre-wrap text-sm">{property.notas}</p>
          </div>
        )}

        <p className="border-t pt-3 text-xs text-muted-foreground">
          Cargada por {vendedor ?? "—"} ·{" "}
          {new Date(property.created_at).toLocaleDateString("es-AR")}
        </p>
      </div>
    </div>
  );
}
