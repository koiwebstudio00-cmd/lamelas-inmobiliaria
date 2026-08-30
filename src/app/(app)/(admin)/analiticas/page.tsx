import Link from "next/link";
import {
  Bot,
  ChartNoAxesCombined,
  CheckCheck,
  CircleAlert,
  Clock3,
  ContactRound,
  House,
  Inbox,
  Percent,
  UserRoundCheck,
} from "lucide-react";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { DailyVolume } from "@/components/analytics/daily-volume";
import { AnalyticsMetric, Breakdown } from "@/components/analytics/metric";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsLeads,
  getAnalyticsOverview,
  getVendedores,
  type AnalyticsFilters as Filters,
} from "@/lib/queries";

export const metadata = { title: "Analíticas — Lamelas & Chaumont" };

type Params = Record<string, string | undefined>;

const CHANNEL_LABELS = {
  web: "Web",
  whatsapp: "WhatsApp",
  manual: "Carga manual",
  instagram: "Instagram",
  messenger: "Messenger",
};

const STATE_LABELS = {
  nueva: "Nuevas",
  en_contacto: "En contacto",
  ganada: "Ganadas",
  perdida: "Perdidas",
};

const CLASSIFICATION_LABELS = {
  potencial: "Potenciales",
  fantasma: "Fantasmas",
  sin_clasificar: "Sin clasificar",
};

const PROPERTY_LABELS = {
  con_propiedad: "Con propiedad",
  general: "Consulta general",
};

const ORIGIN_LABELS = {
  panel: "Tomadas desde el panel",
  whatsapp_business_app: "Tomadas desde WhatsApp",
  sistema: "Tomadas por el sistema",
  sin_tomar: "Sin tomar",
  origen_no_registrado: "Tomadas antes de registrar el origen",
};

const AGE_LABELS = {
  under_1h: "Menos de 1 hora",
  from_1_to_4h: "Entre 1 y 4 horas",
  from_4_to_24h: "Entre 4 y 24 horas",
  over_24h: "Más de 24 horas",
};

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

function tabHref(params: Params, tab: "resumen" | "consultas") {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "tab") query.set(key, value);
  }
  query.set("tab", tab);
  return `/analiticas?${query.toString()}`;
}

function minutes(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${value} min`;
  return `${Math.round((value / 60) * 10) / 10} h`;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const tab = params.tab === "consultas" ? "consultas" : "resumen";
  const [data, vendedores] = await Promise.all([
    tab === "resumen"
      ? getAnalyticsOverview(filters(params))
      : getAnalyticsLeads(filters(params)),
    getVendedores(),
  ]);
  const period = data.period;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analíticas</h1>
          <p className="text-sm text-muted-foreground">
            {tab === "resumen" ? "Panorama comercial" : "Seguimiento de consultas y leads"} · {period.from.split("-").reverse().join("/")} al {period.to.split("-").reverse().join("/")}.
          </p>
        </div>
        <div className="flex border bg-background p-1" aria-label="Sección de analíticas">
          <Button asChild size="sm" variant={tab === "resumen" ? "default" : "ghost"}>
            <Link href={tabHref(params, "resumen")} prefetch={false}>Panorama</Link>
          </Button>
          <Button asChild size="sm" variant={tab === "consultas" ? "default" : "ghost"}>
            <Link href={tabHref(params, "consultas")} prefetch={false}>Consultas y leads</Link>
          </Button>
        </div>
      </div>

      <AnalyticsFilters
        params={{ ...params, tab }}
        vendedores={vendedores}
        resolvedFrom={period.from}
        resolvedTo={period.to}
      />

      {tab === "resumen" && "kpis" in data ? <Overview kpis={data.kpis} /> : null}
      {tab === "consultas" && "summary" in data ? <Leads data={data} /> : null}

      <p className="border-l-2 border-primary pl-3 text-xs text-muted-foreground">
        {period.cohort_definition} Los indicadores de inventario reflejan las propiedades disponibles actuales.
      </p>
    </div>
  );
}

function Overview({ kpis }: { kpis: Awaited<ReturnType<typeof getAnalyticsOverview>>["kpis"] }) {
  return (
    <>
      <AnalyticsSection
        title="Actividad comercial"
        description="Volumen, velocidad de atención y avance de los leads recibidos."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsMetric label="Consultas recibidas" value={kpis.leads_created} detail="Altas dentro del período" icon={Inbox} />
          <AnalyticsMetric label="Consultas tomadas" value={kpis.leads_taken} detail={`${kpis.take_rate}% de las recibidas`} icon={UserRoundCheck} />
          <AnalyticsMetric label="Tiempo mediano de toma" value={minutes(kpis.median_take_minutes)} detail="Desde la entrada hasta la primera toma" icon={Clock3} />
          <AnalyticsMetric label="Conversión actual" value={`${kpis.cohort_conversion_rate}%`} detail={`${kpis.ganadas} leads marcados como ganados`} icon={Percent} />
        </div>
        <Breakdown
          title="Estado actual de los leads"
          description="Cómo se encuentran hoy los leads que ingresaron en el período."
          values={{ nueva: kpis.nuevas, en_contacto: kpis.en_contacto, ganada: kpis.ganadas, perdida: kpis.perdidas }}
          labels={STATE_LABELS}
        />
      </AnalyticsSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsSection
          title="Sofía y derivaciones"
          description="Conversaciones atendidas por el agente y transferidas al equipo."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyticsMetric label="Conversaciones de Sofía" value={kpis.sofia_conversations} detail="Iniciadas dentro del período" icon={Bot} />
            <AnalyticsMetric label="Derivadas al equipo" value={kpis.handed_off_conversations} detail={`${kpis.handoff_rate}% de las conversaciones`} icon={ContactRound} />
          </div>
        </AnalyticsSection>
        <AnalyticsSection title="Inventario" description="Estado actual de las propiedades disponibles.">
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyticsMetric label="Disponibles" value={kpis.active_properties} detail="Inventario activo actual" icon={House} />
            <AnalyticsMetric label="Sin consultas" value={kpis.active_properties_without_leads} detail="Sin demanda registrada" icon={ChartNoAxesCombined} />
          </div>
        </AnalyticsSection>
      </div>
    </>
  );
}

function Leads({ data }: { data: Awaited<ReturnType<typeof getAnalyticsLeads>> }) {
  const delayed = data.pending_by_age.over_24h ?? 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric label="Leads recibidos" value={data.summary.total} detail="Una consulta recibida crea un lead" icon={Inbox} />
        <AnalyticsMetric label="Leads tomados" value={data.summary.taken} detail={`${data.summary.take_rate}% ya tiene atención`} icon={CheckCheck} />
        <AnalyticsMetric label="Pendientes de toma" value={data.summary.untaken} detail={delayed > 0 ? `${delayed} con más de 24 horas` : "Sin pendientes demorados"} icon={CircleAlert} />
        <AnalyticsMetric label="Tiempo típico de toma" value={minutes(data.summary.median_take_minutes)} detail="Mediana desde que ingresan" icon={Clock3} />
      </div>

      <AnalyticsSection
        title="Entrada de consultas"
        description="Cuándo llegan, por qué canal y si están vinculadas a una propiedad."
      >
        <DailyVolume rows={data.daily} />
        <div className="grid gap-3 lg:grid-cols-2">
          <Breakdown title="Canal de entrada" values={data.by_channel} labels={CHANNEL_LABELS} />
          <Breakdown title="Consulta general o por propiedad" values={data.by_property_relation} labels={PROPERTY_LABELS} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Atención del equipo"
        description="Qué tan rápido se toman los leads y cuáles necesitan seguimiento."
      >
        <div className="grid gap-3 border bg-background p-4 sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Asignados</p><p className="mt-1 text-xl font-semibold tabular-nums">{data.summary.assigned}</p></div>
          <div><p className="text-xs text-muted-foreground">Sin asignar</p><p className="mt-1 text-xl font-semibold tabular-nums">{data.summary.unassigned}</p></div>
          <div><p className="text-xs text-muted-foreground">El 90% se tomó antes de</p><p className="mt-1 text-xl font-semibold tabular-nums">{minutes(data.summary.p90_take_minutes)}</p></div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Breakdown title="Pendientes por antigüedad" values={data.pending_by_age} labels={AGE_LABELS} />
          <Breakdown title="Dónde se tomó el lead" values={data.by_taken_origin} labels={ORIGIN_LABELS} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Estado comercial"
        description="Avance y calidad actual de los leads creados en el período."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Breakdown title="Etapa actual" values={data.by_state} labels={STATE_LABELS} />
          <Breakdown title="Clasificación" values={data.by_classification} labels={CLASSIFICATION_LABELS} />
        </div>
      </AnalyticsSection>
    </>
  );
}

function AnalyticsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t-2 border-foreground/15 pt-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
