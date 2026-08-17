import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Home,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { Badge, EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClienteMock, type ClientePropiedad } from "@/lib/clientes-mock";
import { formatDate, formatPrice, waLink } from "@/lib/utils";
import { TIPOS } from "@/lib/types";

export const metadata = { title: "Detalle de cliente — Lamelas & Chaumont" };

const OPERACION_LABEL = {
  venta: "Venta",
  alquiler: "Alquiler",
  ambos: "Venta y alquiler",
} as const;

const ROL_LABEL = {
  vende: "Propiedad en venta",
  alquila: "Propiedad en alquiler",
} as const;

function tipoLabel(value: ClientePropiedad["tipo"]) {
  return TIPOS.find((tipo) => tipo.value === value)?.label ?? value;
}

function precioPropiedad(propiedad: ClientePropiedad) {
  if (propiedad.operacion === "ambos" && propiedad.precio_alquiler != null) {
    return `${formatPrice(propiedad.precio, propiedad.moneda)} · ${formatPrice(
      propiedad.precio_alquiler,
      propiedad.moneda_alquiler ?? propiedad.moneda
    )}`;
  }

  return formatPrice(propiedad.precio, propiedad.moneda);
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = getClienteMock(id);

  if (!cliente) notFound();

  const iniciales = cliente.nombre
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const personales = [
    { label: "DNI", value: cliente.dni, icon: IdCard },
    { label: "Nacimiento", value: formatDate(cliente.fechaNacimiento), icon: CalendarDays },
    { label: "Ocupación", value: cliente.ocupacion, icon: BriefcaseBusiness },
    { label: "Estado civil", value: cliente.estadoCivil, icon: UserRound },
    { label: "Dirección", value: cliente.direccion, icon: MapPin },
    { label: "Ciudad", value: cliente.ciudad, icon: Home },
  ];

  const propiedadesEnVenta = cliente.propiedades.filter((p) => p.rol === "vende").length;
  const propiedadesEnAlquiler = cliente.propiedades.filter((p) => p.rol === "alquila").length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button asChild variant="outline" size="sm">
        <Link href="/clientes" prefetch={false}>
          <ArrowLeft /> Volver
        </Link>
      </Button>

      <section className="border bg-background">
        <div className="h-24 bg-[linear-gradient(110deg,#0E9145_0%,#0E9145_32%,#E9C46A_32%,#E9C46A_58%,#F7F7F4_58%,#F7F7F4_100%)] sm:h-32" />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <div className="-mt-14 grid size-24 shrink-0 place-items-center border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground sm:-mt-16 sm:size-28">
              {iniciales}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{cliente.nombre}</h1>
                <Badge variant="secondary">Cliente desde {formatDate(cliente.alta)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {cliente.telefono} · {cliente.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${cliente.telefono.replace(/\s/g, "")}`}>
                <Phone /> Llamar
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${cliente.email}`}>
                <Mail /> Email
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={waLink(cliente.telefono)} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border bg-background p-4">
          <p className="text-sm text-muted-foreground">Propiedades</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {cliente.propiedades.length}
          </p>
        </div>
        <div className="border bg-background p-4">
          <p className="text-sm text-muted-foreground">En venta</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{propiedadesEnVenta}</p>
        </div>
        <div className="border bg-background p-4">
          <p className="text-sm text-muted-foreground">En alquiler</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {propiedadesEnAlquiler}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b bg-muted/40 py-3">
              <CardTitle className="text-base">Información personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {personales.map((item) => (
                <div key={item.label} className="flex gap-3 text-sm">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="break-words font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/40 py-3">
              <CardTitle className="text-base">Notas internas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="whitespace-pre-wrap text-sm">{cliente.notas}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
            <Home className="size-5 text-primary" />
            <CardTitle className="text-base">
              Propiedades con la inmobiliaria ({cliente.propiedades.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {cliente.propiedades.map((propiedad) => (
                <article key={propiedad.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{ROL_LABEL[propiedad.rol]}</Badge>
                      <EstadoBadge estado={propiedad.estado} />
                    </div>
                    <h2 className="font-semibold">{propiedad.titulo}</h2>
                    <p className="text-sm text-muted-foreground">
                      {OPERACION_LABEL[propiedad.operacion]} · {tipoLabel(propiedad.tipo)} ·{" "}
                      {propiedad.zona}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0" />
                      {propiedad.direccion}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between gap-3 sm:items-end">
                    <div className="space-y-1 sm:text-right">
                      <p className="font-semibold tabular-nums text-primary">
                        {precioPropiedad(propiedad)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desde {formatDate(propiedad.desde)}
                      </p>
                    </div>
                    <p className="border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Vista previa
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
