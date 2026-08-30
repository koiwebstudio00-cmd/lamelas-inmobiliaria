import Link from "next/link";
import { ChevronDown, Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OPERACIONES, TIPOS } from "@/lib/types";

type Params = Record<string, string | undefined>;

function dateShift(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function presetHref(params: Params, days: number, to: string) {
  const next = new URLSearchParams();
  if (params.tab) next.set("tab", params.tab);
  next.set("from", dateShift(to, -(days - 1)));
  next.set("to", to);
  return `/analiticas?${next.toString()}`;
}

export function AnalyticsFilters({
  params,
  vendedores,
  resolvedFrom,
  resolvedTo,
}: {
  params: Params;
  vendedores: { id: string; nombre: string }[];
  resolvedFrom: string;
  resolvedTo: string;
}) {
  const hasFilters = [
    "from",
    "to",
    "canal",
    "vendedor",
    "operacion",
    "tipo",
    "zona",
    "clasificacion",
  ].some((key) => params[key]);
  const advancedCount = ["clasificacion", "operacion", "tipo", "zona"].filter(
    (key) => params[key]
  ).length;

  return (
    <section className="space-y-3 border bg-background p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-primary" /> Filtros
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="xs">
            <Link href={presetHref(params, 7, resolvedTo)} prefetch={false}>7 días</Link>
          </Button>
          <Button asChild variant="ghost" size="xs">
            <Link href={presetHref(params, 30, resolvedTo)} prefetch={false}>30 días</Link>
          </Button>
        </div>
      </div>

      <form action="/analiticas" className="space-y-3">
        <input type="hidden" name="tab" value={params.tab ?? "resumen"} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_auto]">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Desde
            <Input type="date" name="from" defaultValue={resolvedFrom} />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Hasta
            <Input type="date" name="to" defaultValue={resolvedTo} />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Canal
            <Select name="canal" defaultValue={params.canal ?? ""}>
              <option value="">Todos los canales</option>
              <option value="web">Web</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="manual">Carga manual</option>
              <option value="instagram">Instagram</option>
              <option value="messenger">Messenger</option>
            </Select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Responsable
            <Select name="vendedor" defaultValue={params.vendedor ?? ""}>
              <option value="">Todo el equipo</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
              ))}
            </Select>
          </label>
          <Button type="submit" size="sm" className="h-9 self-end">Aplicar</Button>
        </div>

        <details className="group" open={advancedCount > 0}>
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <SlidersHorizontal className="size-4" />
            Más filtros
            {advancedCount > 0 ? (
              <span className="bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{advancedCount}</span>
            ) : null}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 grid gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Clasificación
              <Select name="clasificacion" defaultValue={params.clasificacion ?? ""}>
                <option value="">Todas</option>
                <option value="potencial">Potencial</option>
                <option value="fantasma">Fantasma</option>
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Operación
              <Select name="operacion" defaultValue={params.operacion ?? ""}>
                <option value="">Todas</option>
                {OPERACIONES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Tipo de propiedad
              <Select name="tipo" defaultValue={params.tipo ?? ""}>
                <option value="">Todos</option>
                {TIPOS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Zona exacta
              <Input name="zona" defaultValue={params.zona ?? ""} />
            </label>
          </div>
        </details>

        {hasFilters ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/analiticas?tab=${params.tab ?? "resumen"}`} prefetch={false}>
              <X /> Limpiar filtros
            </Link>
          </Button>
        ) : null}
      </form>
    </section>
  );
}
