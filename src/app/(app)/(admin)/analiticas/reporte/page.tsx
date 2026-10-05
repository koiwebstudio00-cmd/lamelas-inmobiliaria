import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Delta, type Comparison } from "@/components/analytics/delta";
import { closingSummary, formatDate, minutes, monthName } from "@/components/analytics/labels";
import { PrintButton } from "@/components/analytics/print-button";
import {
  AnalyticsSection,
  LeadsSections,
  PropertiesSections,
  SofiaSections,
} from "@/components/analytics/sections";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsLeads,
  getAnalyticsOverview,
  getAnalyticsProperties,
  getAnalyticsSofia,
} from "@/lib/queries";

export const metadata = { title: "Reporte mensual — Lamelas & Chaumont" };

const TZ = "America/Argentina/Tucuman";

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/**
 * Rango del mes pedido. Un mes pasado va completo (1 al último día) y la API
 * lo compara con el mes calendario anterior. El mes en curso va hasta hoy y
 * se compara con la misma cantidad de días inmediatamente antes.
 */
function monthRange(requested: string | undefined) {
  const now = today();
  const current = now.slice(0, 7);
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) && requested <= current ? requested : current;
  const [year, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const fullTo = `${month}-${String(last).padStart(2, "0")}`;
  const to = fullTo > now ? now : fullTo;
  return { month, from: `${month}-01`, to, partial: to !== fullTo };
}

type Row = { label: string; value: string | number; comparison?: Comparison };

export default async function MonthlyReportPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  const range = monthRange(mes);
  const filters = { from: range.from, to: range.to };

  const [overview, leads, sofia, properties] = await Promise.all([
    getAnalyticsOverview(filters),
    getAnalyticsLeads(filters),
    getAnalyticsSofia(filters),
    getAnalyticsProperties(filters),
  ]);

  const k = overview.kpis;
  const pk = overview.previous_kpis;
  const s = sofia.summary;
  const ps = sofia.previous_summary;
  const previous = overview.period.previous;

  const summary: Row[] = [
    { label: "Consultas recibidas", value: k.leads_created, comparison: { current: k.leads_created, previous: pk?.leads_created, format: "count" } },
    { label: "Consultas tomadas por el equipo", value: `${k.leads_taken} (${k.take_rate}%)`, comparison: { current: k.take_rate, previous: pk?.take_rate, format: "pct" } },
    { label: "Tiempo mediano de toma", value: minutes(k.median_take_minutes), comparison: { current: k.median_take_minutes, previous: pk?.median_take_minutes, format: "minutes", lowerIsBetter: true } },
    {
      label: "Leads ganados",
      // "4 (12.5%) · 3 ventas, 1 alquiler": el desglose solo si hay algo cargado.
      value:
        `${k.ganadas} (${k.cohort_conversion_rate}%)` +
        (closingSummary(k.ganadas_venta, k.ganadas_alquiler)
          ? ` · ${closingSummary(k.ganadas_venta, k.ganadas_alquiler)}`
          : ""),
      comparison: { current: k.ganadas, previous: pk?.ganadas, format: "count" },
    },
    { label: "Conversaciones de Sofía", value: s.conversations, comparison: { current: s.conversations, previous: ps?.conversations, format: "count" } },
    { label: "Derivadas a un vendedor", value: `${s.handed_off} (${s.handoff_rate}%)`, comparison: { current: s.handoff_rate, previous: ps?.handoff_rate, format: "pct" } },
    { label: "Recuperadas por seguimiento", value: s.recovered_by_followup, comparison: { current: s.recovered_by_followup, previous: ps?.recovered_by_followup, format: "count" } },
    { label: "Propiedades nuevas", value: properties.summary.created, comparison: { current: properties.summary.created, previous: properties.previous_summary?.created, format: "count" } },
    { label: "Propiedades disponibles hoy", value: properties.summary.available },
  ];

  const generatedAt = new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-5xl space-y-6 bg-background p-4 sm:p-8 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/analiticas?from=${range.from}&to=${range.to}`} prefetch={false}>
            <ArrowLeft className="size-4" /> Volver a Analíticas
          </Link>
        </Button>
        <PrintButton />
      </div>

      <header className="border-b-2 border-primary pb-4">
        <p className="text-sm font-medium text-primary">Lamelas &amp; Chaumont · Inmobiliaria</p>
        <h1 className="mt-1 text-3xl font-semibold capitalize">Reporte de {monthName(range.month)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Del {formatDate(range.from)} al {formatDate(range.to)}
          {range.partial ? " (mes en curso, datos parciales)" : ""}
          {previous ? ` · comparado con el ${formatDate(previous.from)} al ${formatDate(previous.to)}` : ""}.
          {" "}Generado el {generatedAt}.
        </p>
      </header>

      <AnalyticsSection title="Resumen del mes" description="Los números principales y cómo se movieron respecto del período anterior.">
        <table className="w-full border bg-background text-sm">
          <tbody className="divide-y">
            {summary.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-2.5">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{row.value}</td>
                <td className="w-44 px-4 py-2.5">
                  {row.comparison ? <Delta comparison={row.comparison} label="" /> : <span className="text-xs text-muted-foreground">foto actual</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AnalyticsSection>

      <div className="space-y-4 print:break-before-page">
        <h2 className="text-xl font-semibold">Consultas y leads</h2>
        <LeadsSections data={leads} readOnly />
      </div>

      <div className="space-y-4 print:break-before-page">
        <h2 className="text-xl font-semibold">Sofía</h2>
        <SofiaSections data={sofia} />
      </div>

      <div className="space-y-4 print:break-before-page">
        <h2 className="text-xl font-semibold">Propiedades</h2>
        <PropertiesSections data={properties} readOnly />
      </div>

      <p className="border-l-2 border-primary pl-3 text-xs text-muted-foreground">
        {overview.period.cohort_definition} No incluye conversaciones de prueba del panel. Los indicadores de
        inventario reflejan las propiedades al momento de generar el reporte.
      </p>
    </div>
  );
}
