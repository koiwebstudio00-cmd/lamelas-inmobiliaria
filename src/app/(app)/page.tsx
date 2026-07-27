import Link from "next/link";
import { ArrowRight, Building2, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/property-card";
import { LeadRow } from "@/components/leads/lead-row";
import { getCurrentUser } from "@/lib/api";
import { getResumen } from "@/lib/queries";

export const metadata = { title: "Inicio — Lamelas & Chaumont" };

const ESTADO_CARDS = [
  { estado: "disponible", label: "Disponibles", color: "var(--estado-disponible-fg)" },
  { estado: "reservada", label: "Reservadas", color: "var(--estado-reservada-fg)" },
  { estado: "vendida", label: "Vendidas", color: "var(--estado-vendida-fg)" },
] as const;

export default async function HomePage() {
  const [resumen, me] = await Promise.all([getResumen(), getCurrentUser()]);
  const total =
    resumen.propiedades.disponible +
    resumen.propiedades.reservada +
    resumen.propiedades.vendida;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            Hola{me?.nombre ? `, ${me.nombre.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "propiedad cargada" : "propiedades cargadas"} en
            total.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/propiedades/nueva">
            <Plus /> Nueva propiedad
          </Link>
        </Button>
      </div>

      {/* Contadores. Cada uno lleva al listado ya filtrado. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ESTADO_CARDS.map((c) => (
          <Link
            key={c.estado}
            href={`/propiedades?estado=${c.estado}`}
            className="border bg-background p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p
              className="text-3xl font-semibold tabular-nums"
              style={{ color: c.color }}
            >
              {resumen.propiedades[c.estado]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
        <Link
          href="/consultas?estado=nueva"
          className="border bg-background p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="text-3xl font-semibold tabular-nums text-primary">
            {resumen.consultasNuevas}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {resumen.consultasNuevas === 1 ? "Consulta nueva" : "Consultas nuevas"}
          </p>
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Inbox className="size-5 text-primary" /> Últimas consultas
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/consultas">
              Ver todas <ArrowRight />
            </Link>
          </Button>
        </div>
        {resumen.ultimasConsultas.length === 0 ? (
          <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no entró ninguna consulta.
          </p>
        ) : (
          <ul className="space-y-2">
            {resumen.ultimasConsultas.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Building2 className="size-5 text-primary" /> Últimas propiedades
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/propiedades">
              Ver todas <ArrowRight />
            </Link>
          </Button>
        </div>
        {resumen.ultimasPropiedades.length === 0 ? (
          <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay propiedades cargadas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resumen.ultimasPropiedades.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
