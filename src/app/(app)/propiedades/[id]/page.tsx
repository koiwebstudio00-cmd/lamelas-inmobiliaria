import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, MapPin, BedDouble, Bath, Ruler, LayoutGrid, ClipboardList, KeyRound, StickyNote, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/ui/badge";
import { EstadoSelect } from "@/components/properties/estado-select";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { PhotoManager } from "@/components/properties/photo-manager";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyMap } from "@/components/properties/property-map";
import { SharePropertyButton } from "@/components/properties/share-property-button";
import { getCurrentUser } from "@/lib/api";
import { getProperty } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import {
  TIPOS,
  DESTINOS,
  PLAZOS,
  AJUSTES,
  INDICES,
  MASCOTAS,
  AMOBLADO_OPCIONES,
} from "@/lib/types";

const OPERACION_LABEL = { venta: "Venta", alquiler: "Alquiler" } as const;

/** Busca la etiqueta de un valor canónico en una lista de opciones. */
function labelOf(
  list: { value: string; label: string }[],
  value: string | null
): string | null {
  if (!value) return null;
  return list.find((o) => o.value === value)?.label ?? value;
}

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
  const esAdmin = me?.rol === "admin" || me?.rol === "super_admin";
  // El admin gestiona todas las propiedades del tenant (la RLS ya lo permite),
  // no solo las propias. El vendedor solo las suyas.
  const puedeGestionar = isOwner || esAdmin;

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

  const mapsHref =
    property.link_maps ??
    (property.lat != null && property.lng != null
      ? `https://www.google.com/maps?q=${property.lat},${property.lng}`
      : null);

  const plazoLabel =
    property.plazo_contrato === "otro" ? property.plazo_otro : labelOf(PLAZOS, property.plazo_contrato);
  const ajusteLabel =
    property.ajuste === "otro" ? property.ajuste_otro : labelOf(AJUSTES, property.ajuste);
  const indiceLabel =
    property.indice_ajuste === "fijo"
      ? property.indice_fijo_pct != null
        ? `Fijo ${property.indice_fijo_pct}%`
        : "Fijo"
      : labelOf(INDICES, property.indice_ajuste);

  const alquilerItems =
    property.operacion === "alquiler"
      ? ([
          ["Destino", labelOf(DESTINOS, property.destino)],
          ["Plazo de contrato", plazoLabel],
          ["Ajuste", ajusteLabel],
          ["Índice de ajuste", indiceLabel],
          ["Expensas", property.expensas],
          ["Mascotas", labelOf(MASCOTAS, property.mascotas)],
          ["Amoblado", labelOf(AMOBLADO_OPCIONES, property.amoblado)],
        ].filter(([, v]) => v) as [string, string][])
      : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="outline" size="sm">
          <Link href="/propiedades" prefetch={false}>
            <ArrowLeft /> Volver
          </Link>
        </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">
            {OPERACION_LABEL[property.operacion]} · {labelOf(TIPOS, property.tipo)}
          </p>
          <h1 className="text-2xl font-semibold">{property.titulo}</h1>
          <p className="text-xl font-semibold tabular-nums text-primary">
            {formatPrice(property.precio, property.moneda)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SharePropertyButton propertyId={property.id} />
          <EstadoBadge estado={property.estado} />
        </div>
      </div>

      {puedeGestionar && (
        <div className="flex flex-wrap items-center gap-2 border bg-background p-3">
          <EstadoSelect propertyId={property.id} estado={property.estado} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/propiedades/${property.id}/editar`} prefetch={false}>
              <Pencil /> Editar
            </Link>
          </Button>
          <DeletePropertyButton propertyId={property.id} titulo={property.titulo} />
        </div>
      )}

      {gallery.length > 0 && (
        <PropertyGallery images={gallery} title={property.titulo} />
      )}

      {/* Gestión de fotos */}
      {puedeGestionar && (
        <div className="border bg-background p-4">
          <PhotoManager propertyId={property.id} images={gallery} />
        </div>
      )}

      <div className="space-y-4 border bg-background p-4 sm:p-6">
        {(ubicacion || mapsHref) && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            {ubicacion}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Ver en el mapa
              </a>
            )}
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

        {property.lat != null && property.lng != null && (
          <PropertyMap initialLat={property.lat} initialLng={property.lng} readOnly />
        )}

        {alquilerItems.length > 0 && (
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <KeyRound className="size-4" /> Condiciones de alquiler
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              {alquilerItems.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
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

        {property.requisitos && (
          <div>
            <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <ClipboardList className="size-4" /> Requisitos de alquiler
            </h2>
            <p className="whitespace-pre-wrap text-sm">{property.requisitos}</p>
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
