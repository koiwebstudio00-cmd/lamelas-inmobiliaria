import Link from "next/link";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { formatDate } from "@/components/analytics/labels";
import { ReportButton } from "@/components/analytics/report-button";
import {
  LeadsSections,
  OverviewSections,
  PropertiesSections,
  SofiaSections,
} from "@/components/analytics/sections";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsLeads,
  getAnalyticsOverview,
  getAnalyticsProperties,
  getAnalyticsSofia,
  getVendedores,
  type AnalyticsFilters as Filters,
} from "@/lib/queries";
import type { AnalyticsPeriod } from "@/lib/types";

export const metadata = { title: "Analíticas — Lamelas & Chaumont" };

type Params = Record<string, string | undefined>;

const TABS = {
  resumen: { label: "Panorama", subtitle: "Panorama comercial" },
  consultas: { label: "Consultas", subtitle: "Seguimiento de consultas y leads" },
  sofia: { label: "Sofía", subtitle: "Lo que atiende el agente por WhatsApp" },
  propiedades: { label: "Propiedades", subtitle: "Demanda e inventario" },
} as const;

type Tab = keyof typeof TABS;

function filters(params: Params): Filters {
  return {
    from: params.from,
    to: params.to,
    canal: params.canal,
    vendedor: params.vendedor,
    operacion: params.operacion,
    tipo: params.tipo,
    zona: params.zona,
    clasificacion: params.clasificacion,
  };
}

function tabHref(params: Params, tab: Tab) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "tab") query.set(key, value);
  }
  query.set("tab", tab);
  return `/analiticas?${query.toString()}`;
}

async function load(tab: Tab, f: Filters) {
  switch (tab) {
    case "consultas":
      return { tab, data: await getAnalyticsLeads(f) } as const;
    case "sofia":
      return { tab, data: await getAnalyticsSofia(f) } as const;
    case "propiedades":
      return { tab, data: await getAnalyticsProperties(f) } as const;
    default:
      return { tab: "resumen", data: await getAnalyticsOverview(f) } as const;
  }
}

function comparisonText(period: AnalyticsPeriod) {
  if (!period.previous) return null;
  return `Las variaciones comparan contra el ${formatDate(period.previous.from)} al ${formatDate(period.previous.to)}.`;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const tab: Tab = params.tab && params.tab in TABS ? (params.tab as Tab) : "resumen";
  const [loaded, vendedores] = await Promise.all([load(tab, filters(params)), getVendedores()]);
  const period = loaded.data.period;
  // El reporte arranca en el mes del final del rango elegido; no hay meses futuros.
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Tucuman",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const reportMonth = period.to.slice(0, 7) > currentMonth ? currentMonth : period.to.slice(0, 7);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analíticas</h1>
          <p className="text-sm text-muted-foreground">
            {TABS[tab].subtitle} · {formatDate(period.from)} al {formatDate(period.to)}.
          </p>
        </div>
        <ReportButton defaultMonth={reportMonth} maxMonth={currentMonth} />
      </div>

      <nav className="flex overflow-x-auto border bg-background p-1" aria-label="Sección de analíticas">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Button key={key} asChild size="sm" variant={tab === key ? "default" : "ghost"} className="shrink-0">
            <Link href={tabHref(params, key)} prefetch={false} aria-current={tab === key ? "page" : undefined}>
              {TABS[key].label}
            </Link>
          </Button>
        ))}
      </nav>

      <AnalyticsFilters
        params={{ ...params, tab }}
        vendedores={vendedores}
        resolvedFrom={period.from}
        resolvedTo={period.to}
      />

      {loaded.tab === "resumen" ? <OverviewSections data={loaded.data} /> : null}
      {loaded.tab === "consultas" ? <LeadsSections data={loaded.data} /> : null}
      {loaded.tab === "sofia" ? <SofiaSections data={loaded.data} /> : null}
      {loaded.tab === "propiedades" ? <PropertiesSections data={loaded.data} /> : null}

      <p className="border-l-2 border-primary pl-3 text-xs text-muted-foreground">
        {period.cohort_definition} {comparisonText(period)} Los indicadores de inventario reflejan las propiedades actuales.
      </p>
    </div>
  );
}
