// Etiquetas compartidas entre la pantalla de Analíticas y el reporte mensual.

export const CHANNEL_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  manual: "Carga manual",
  instagram: "Instagram",
  messenger: "Messenger",
};

/** Origen del lead: separa el WhatsApp que vino de un anuncio del directo. */
export const LEAD_ORIGIN_LABELS: Record<string, string> = {
  whatsapp_anuncio: "WhatsApp desde un anuncio",
  whatsapp_directo: "WhatsApp directo",
  formulario: "Formulario del sitio",
  manual: "Carga manual",
  instagram: "Instagram",
  messenger: "Messenger",
};

export const STATE_LABELS: Record<string, string> = {
  nueva: "Nuevas",
  en_contacto: "En contacto",
  ganada: "Ganadas",
  perdida: "Perdidas",
};

/** Perdidas por motivo (último avance del vendedor). */
export const LOST_REASON_LABELS: Record<string, string> = {
  no_interesado: "No le interesa",
  no_califica: "No califica",
  otro: "Otro motivo / sin avance",
};

/** Desglose de las ganadas por lo que se concretó. */
export const CLOSING_LABELS: Record<string, string> = {
  venta: "Ventas",
  alquiler: "Alquileres",
  sin_operacion: "Sin indicar",
};

/** "3 ventas, 2 alquileres" (omite lo que está en cero). */
export function closingSummary(venta: number, alquiler: number) {
  return [
    venta > 0 ? `${venta} ${venta === 1 ? "venta" : "ventas"}` : null,
    alquiler > 0 ? `${alquiler} ${alquiler === 1 ? "alquiler" : "alquileres"}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

export const CLASSIFICATION_LABELS: Record<string, string> = {
  potencial: "Potenciales",
  fantasma: "Fantasmas",
  sin_clasificar: "Sin clasificar",
  sin_dato: "Sin clasificar",
};

export const PROPERTY_RELATION_LABELS: Record<string, string> = {
  con_propiedad: "Con propiedad",
  general: "Consulta general",
};

export const ORIGIN_LABELS: Record<string, string> = {
  panel: "Tomadas desde el panel",
  whatsapp_business_app: "Tomadas desde WhatsApp",
  sistema: "Tomadas por el sistema",
  sin_tomar: "Sin tomar",
  origen_no_registrado: "Tomadas antes de registrar el origen",
};

export const AGE_LABELS: Record<string, string> = {
  under_1h: "Menos de 1 hora",
  from_1_to_4h: "Entre 1 y 4 horas",
  from_4_to_24h: "Entre 4 y 24 horas",
  over_24h: "Más de 24 horas",
};

export const HANDOFF_LABELS: Record<string, string> = {
  tomado: "Tomadas por el vendedor",
  pendiente: "Esperando que las tomen",
  timeout_reasignado: "Reasignadas por demora",
  rechazado: "Rechazadas",
};

export const TEMPERATURE_LABELS: Record<string, string> = {
  caliente: "Calientes",
  tibia: "Tibias",
  fria: "Frías",
  sin_dato: "Sin dato",
};

export const INTENT_LABELS: Record<string, string> = {
  comprar: "Comprar",
  alquilar: "Alquilar",
  vender: "Vender",
  tasar: "Tasar",
  consulta: "Consulta general",
  sin_dato: "Sin dato",
};

export const PROPERTY_STATE_LABELS: Record<string, string> = {
  disponible: "Disponibles",
  reservado: "Reservadas",
  proximamente: "Próximamente",
  pausado: "Pausadas",
  vendida: "Vendidas",
  alquilada: "Alquiladas",
  privado: "Privadas",
};

export const TYPE_LABELS: Record<string, string> = {
  monoambiente: "Monoambiente",
  departamento: "Departamento",
  casa: "Casa",
  duplex: "Dúplex",
  local_comercial: "Local comercial",
  oficina: "Oficina",
  galpon: "Galpón",
  estacionamiento: "Estacionamiento",
  terreno: "Terreno",
  otro: "Otro",
};

export const OPERATION_LABELS: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  ambos: "Venta y alquiler",
};

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function minutes(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value < 60) return `${value} min`;
  return `${Math.round((value / 60) * 10) / 10} h`;
}

export function formatDate(value: string) {
  return value.split("-").reverse().join("/");
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-09" → "septiembre 2026" */
export function monthName(month: string) {
  const [year, m] = month.split("-").map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${year}`;
}
