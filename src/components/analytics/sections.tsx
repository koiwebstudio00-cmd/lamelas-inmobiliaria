import {
  Bot,
  ChartNoAxesCombined,
  CheckCheck,
  CircleAlert,
  Clock3,
  ContactRound,
  House,
  HousePlus,
  Inbox,
  MessageCircleReply,
  MessagesSquare,
  Percent,
  SearchX,
  UserRoundCheck,
} from "lucide-react";
import { DailyVolume } from "@/components/analytics/daily-volume";
import { IdleProperties } from "@/components/analytics/idle-properties";
import {
  AGE_LABELS,
  CHANNEL_LABELS,
  CLASSIFICATION_LABELS,
  CLOSING_LABELS,
  closingSummary,
  HANDOFF_LABELS,
  INTENT_LABELS,
  OPERATION_LABELS,
  ORIGIN_LABELS,
  PROPERTY_RELATION_LABELS,
  PROPERTY_STATE_LABELS,
  LOST_REASON_LABELS,
  STATE_LABELS,
  TEMPERATURE_LABELS,
  TYPE_LABELS,
  WEEKDAY_LABELS,
  minutes,
} from "@/components/analytics/labels";
import { AnalyticsMetric, Breakdown } from "@/components/analytics/metric";
import { TimeDistribution } from "@/components/analytics/time-distribution";
import { TopProperties } from "@/components/analytics/top-properties";
import { ZoneDemand } from "@/components/analytics/zone-demand";
import type {
  AnalyticsLeads,
  AnalyticsOverview,
  AnalyticsProperties,
  AnalyticsSofia,
} from "@/lib/types";

// Las secciones de Analíticas, compartidas entre la pantalla (con filtros y
// pestañas) y el reporte mensual imprimible. `readOnly` saca lo interactivo
// (botón de destacar) para el PDF.

export function AnalyticsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t-2 border-foreground/15 pt-4 print:break-inside-avoid-page">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

// Horario comercial de referencia para resaltar lo que Martina atiende "fuera
// de hora": antes de las 9, después de las 20 y fines de semana.
const offHours = (hour: number) => hour < 9 || hour >= 20;
const weekend = (day: number) => day >= 6;

export function OverviewSections({ data }: { data: AnalyticsOverview }) {
  const { kpis } = data;
  const prev = data.previous_kpis;

  return (
    <>
      <AnalyticsSection
        title="Actividad comercial"
        description="Volumen, velocidad de atención y avance de los leads recibidos."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsMetric
            label="Consultas recibidas"
            value={kpis.leads_created}
            detail="Altas dentro del período"
            icon={Inbox}
            comparison={{ current: kpis.leads_created, previous: prev?.leads_created, format: "count" }}
          />
          <AnalyticsMetric
            label="Consultas tomadas"
            value={kpis.leads_taken}
            detail={`${kpis.take_rate}% de las recibidas`}
            icon={UserRoundCheck}
            comparison={{ current: kpis.take_rate, previous: prev?.take_rate, format: "pct" }}
          />
          <AnalyticsMetric
            label="Tiempo mediano de toma"
            value={minutes(kpis.median_take_minutes)}
            detail="Desde la entrada hasta la primera toma"
            icon={Clock3}
            comparison={{
              current: kpis.median_take_minutes,
              previous: prev?.median_take_minutes,
              format: "minutes",
              lowerIsBetter: true,
            }}
          />
          <AnalyticsMetric
            label="Conversión actual"
            value={`${kpis.cohort_conversion_rate}%`}
            detail={
              `${kpis.ganadas} leads marcados como ganados` +
              (closingSummary(kpis.ganadas_venta, kpis.ganadas_alquiler)
                ? ` · ${closingSummary(kpis.ganadas_venta, kpis.ganadas_alquiler)}`
                : "")
            }
            icon={Percent}
            comparison={{ current: kpis.cohort_conversion_rate, previous: prev?.cohort_conversion_rate, format: "pct" }}
          />
        </div>
        <Breakdown
          title="Estado actual de los leads"
          description="Cómo se encuentran hoy los leads que ingresaron en el período."
          values={{ nueva: kpis.nuevas, en_contacto: kpis.en_contacto, ganada: kpis.ganadas, perdida: kpis.perdidas }}
          labels={STATE_LABELS}
        />
        {kpis.ganadas > 0 && (
          <Breakdown
            title="Ganadas: ventas y alquileres"
            description="Qué se concretó en los leads ganados del período."
            values={{
              venta: kpis.ganadas_venta,
              alquiler: kpis.ganadas_alquiler,
              sin_operacion: Math.max(0, kpis.ganadas - kpis.ganadas_venta - kpis.ganadas_alquiler),
            }}
            labels={CLOSING_LABELS}
          />
        )}
      </AnalyticsSection>

      <div className="grid gap-5 lg:grid-cols-2 print:grid-cols-2">
        <AnalyticsSection
          title="Martina y derivaciones"
          description="Conversaciones atendidas por el agente y transferidas al equipo."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyticsMetric
              label="Conversaciones de Martina"
              value={kpis.sofia_conversations}
              detail="Iniciadas dentro del período"
              icon={Bot}
              comparison={{ current: kpis.sofia_conversations, previous: prev?.sofia_conversations, format: "count" }}
            />
            <AnalyticsMetric
              label="Derivadas al equipo"
              value={kpis.handed_off_conversations}
              detail={`${kpis.handoff_rate}% de las conversaciones`}
              icon={ContactRound}
              comparison={{ current: kpis.handoff_rate, previous: prev?.handoff_rate, format: "pct" }}
            />
          </div>
        </AnalyticsSection>
        <AnalyticsSection title="Inventario" description="Estado actual de las propiedades disponibles.">
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyticsMetric label="Disponibles" value={kpis.active_properties} detail="Inventario activo actual" icon={House} />
            <AnalyticsMetric
              label="Sin consultas nunca"
              value={kpis.active_properties_without_leads}
              detail="Disponibles sin ninguna consulta registrada"
              icon={ChartNoAxesCombined}
            />
          </div>
        </AnalyticsSection>
      </div>
    </>
  );
}

export function LeadsSections({ data, readOnly = false }: { data: AnalyticsLeads; readOnly?: boolean }) {
  const delayed = data.pending_by_age.over_24h ?? 0;
  const prev = data.previous_summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric
          label="Leads recibidos"
          value={data.summary.total}
          detail="Una consulta recibida crea un lead"
          icon={Inbox}
          comparison={{ current: data.summary.total, previous: prev?.total, format: "count" }}
        />
        <AnalyticsMetric
          label="Leads tomados"
          value={data.summary.taken}
          detail={`${data.summary.take_rate}% ya tiene atención`}
          icon={CheckCheck}
          comparison={{ current: data.summary.take_rate, previous: prev?.take_rate, format: "pct" }}
        />
        <AnalyticsMetric
          label="Pendientes de toma"
          value={data.summary.untaken}
          detail={delayed > 0 ? `${delayed} con más de 24 horas` : "Sin pendientes demorados"}
          icon={CircleAlert}
          comparison={{ current: data.summary.untaken, previous: prev?.untaken, format: "count", lowerIsBetter: true }}
        />
        <AnalyticsMetric
          label="Tiempo típico de toma"
          value={minutes(data.summary.median_take_minutes)}
          detail="Mediana desde que ingresan"
          icon={Clock3}
          comparison={{
            current: data.summary.median_take_minutes,
            previous: prev?.median_take_minutes,
            format: "minutes",
            lowerIsBetter: true,
          }}
        />
      </div>

      <AnalyticsSection
        title="Entrada de consultas"
        description="Cuándo llegan, por qué canal y si están vinculadas a una propiedad."
      >
        <DailyVolume rows={data.daily} />
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          <Breakdown title="Canal de entrada" values={data.by_channel} labels={CHANNEL_LABELS} />
          <Breakdown title="Consulta general o por propiedad" values={data.by_property_relation} labels={PROPERTY_RELATION_LABELS} />
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
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          {readOnly ? null : (
            <Breakdown title="Pendientes por antigüedad" values={data.pending_by_age} labels={AGE_LABELS} />
          )}
          <Breakdown title="Dónde se tomó el lead" values={data.by_taken_origin} labels={ORIGIN_LABELS} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Estado comercial"
        description="Avance y calidad actual de los leads creados en el período."
      >
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          <Breakdown title="Etapa actual" values={data.by_state} labels={STATE_LABELS} />
          <Breakdown title="Clasificación" values={data.by_classification} labels={CLASSIFICATION_LABELS} />
          <Breakdown title="Perdidas por motivo" values={data.by_lost_reason ?? {}} labels={LOST_REASON_LABELS} />
        </div>
      </AnalyticsSection>
    </>
  );
}

export function SofiaSections({ data }: { data: AnalyticsSofia }) {
  const s = data.summary;
  const prev = data.previous_summary;
  const offHoursCount =
    data.by_hour.filter((row) => offHours(row.bucket)).reduce((sum, row) => sum + row.count, 0);
  const weekendCount =
    data.by_weekday.filter((row) => weekend(row.bucket)).reduce((sum, row) => sum + row.count, 0);
  const share = (part: number) => (s.conversations === 0 ? 0 : Math.round((part / s.conversations) * 100));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric
          label="Conversaciones"
          value={s.conversations}
          detail="Iniciadas por WhatsApp en el período"
          icon={Bot}
          comparison={{ current: s.conversations, previous: prev?.conversations, format: "count" }}
        />
        <AnalyticsMetric
          label="Derivadas al equipo"
          value={s.handed_off}
          detail={`${s.handoff_rate}% de las conversaciones`}
          icon={ContactRound}
          comparison={{ current: s.handoff_rate, previous: prev?.handoff_rate, format: "pct" }}
        />
        <AnalyticsMetric
          label="Toma de derivaciones"
          value={minutes(s.median_handoff_take_minutes)}
          detail="Mediana hasta que un vendedor la toma"
          icon={Clock3}
          comparison={{
            current: s.median_handoff_take_minutes,
            previous: prev?.median_handoff_take_minutes,
            format: "minutes",
            lowerIsBetter: true,
          }}
        />
        <AnalyticsMetric
          label="Recuperadas por seguimiento"
          value={s.recovered_by_followup}
          detail={`${s.recovery_rate}% de ${s.followed_up} con seguimiento automático`}
          icon={MessageCircleReply}
          comparison={{ current: s.recovery_rate, previous: prev?.recovery_rate, format: "pct" }}
        />
      </div>

      <AnalyticsSection
        title="Cuándo escriben"
        description={`${share(offHoursCount)}% de las conversaciones empezó fuera de horario (antes de las 9 o después de las 20) y ${share(weekendCount)}% un fin de semana: ahí Martina atiende sola.`}
      >
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr] print:grid-cols-[2fr_1fr]">
          <TimeDistribution
            title="Por hora del día"
            rows={data.by_hour}
            labelFor={(hour) => `${hour}h`}
            highlight={offHours}
          />
          <TimeDistribution
            title="Por día de la semana"
            rows={data.by_weekday}
            labelFor={(day) => WEEKDAY_LABELS[day - 1] ?? String(day)}
            highlight={weekend}
          />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Calidad de los contactos"
        description="Lo que Martina detecta en la charla: qué busca el lead, qué tan decidido está y si es un cliente real."
      >
        <div className="grid gap-3 lg:grid-cols-3 print:grid-cols-3">
          <Breakdown title="Clasificación" values={data.by_classification} labels={CLASSIFICATION_LABELS} />
          <Breakdown title="Temperatura" values={data.by_temperature} labels={TEMPERATURE_LABELS} />
          <Breakdown title="Intención" values={data.by_intent} labels={INTENT_LABELS} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Derivaciones y conversación"
        description="Qué pasa cuando Martina pasa la charla a un vendedor, y cuánto se conversa."
      >
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          <Breakdown title="Resultado de las derivaciones" values={data.by_handoff_result} labels={HANDOFF_LABELS} />
          <div className="grid gap-3 border bg-background p-4 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MessagesSquare className="size-3.5" /> Mensajes de leads</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{s.lead_messages}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mensajes enviados por Martina</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{s.messages_sent ?? s.ai_messages}</p>
              {s.messages_sent !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {s.replies_sent} respuestas · {s.followups_sent} seguimientos
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Promedio por conversación</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {(s.avg_messages_per_conversation ?? 0).toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-muted-foreground">
                mensajes de Martina en {s.conversations_with_messages ?? 0} conversaciones
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mensajes típicos por lead</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{s.median_lead_messages ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Siguen con Martina</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{s.still_with_bot}</p>
            </div>
          </div>
        </div>
      </AnalyticsSection>
    </>
  );
}

export function PropertiesSections({ data, readOnly = false }: { data: AnalyticsProperties; readOnly?: boolean }) {
  const s = data.summary;
  const prev = data.previous_summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric
          label="Disponibles"
          value={s.available}
          detail="Inventario publicado hoy"
          icon={House}
        />
        <AnalyticsMetric
          label="Propiedades nuevas"
          value={s.created}
          detail="Cargadas en el período"
          icon={HousePlus}
          comparison={{ current: s.created, previous: prev?.created, format: "count" }}
        />
        <AnalyticsMetric
          label="Consultas por propiedad"
          value={s.leads_with_property}
          detail={`Sobre ${s.properties_with_leads} propiedades distintas`}
          icon={Inbox}
          comparison={{ current: s.leads_with_property, previous: prev?.leads_with_property, format: "count" }}
        />
        <AnalyticsMetric
          label="Disponibles sin consultas"
          value={s.available_without_leads}
          detail="Ninguna consulta en el período"
          icon={SearchX}
          comparison={{
            current: s.available_without_leads,
            previous: prev?.available_without_leads,
            format: "count",
            lowerIsBetter: true,
          }}
        />
      </div>

      <AnalyticsSection
        title="Demanda por zona"
        description="Dónde se concentran las consultas y cuánta oferta hay para responderlas."
      >
        <ZoneDemand rows={data.demand_by_zone} />
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          <Breakdown
            title="Zonas que le piden a Martina"
            description="Lo que el lead dice que busca por WhatsApp, aunque no haya una propiedad publicada."
            values={data.searched_zones}
            labels={{}}
          />
          <Breakdown
            title="Tipos que le piden a Martina"
            values={data.searched_types}
            labels={TYPE_LABELS}
          />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Qué se consulta"
        description="Consultas del período sobre propiedades puntuales, por tipo y operación."
      >
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          <Breakdown title="Por tipo de propiedad" values={data.leads_by_type} labels={TYPE_LABELS} />
          <Breakdown title="Por operación" values={data.leads_by_operation} labels={OPERATION_LABELS} />
        </div>
        <TopProperties rows={data.top_properties} readOnly={readOnly} />
      </AnalyticsSection>

      <AnalyticsSection
        title="Inventario"
        description="Foto actual de las propiedades cargadas, y las disponibles que no están generando consultas."
      >
        <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
          <Breakdown title="Propiedades por estado" values={data.inventory_by_state} labels={PROPERTY_STATE_LABELS} />
          <Breakdown title="Disponibles por tipo" values={data.available_by_type} labels={TYPE_LABELS} />
        </div>
        <IdleProperties rows={data.idle_properties} total={s.available_without_leads} />
      </AnalyticsSection>
    </>
  );
}
