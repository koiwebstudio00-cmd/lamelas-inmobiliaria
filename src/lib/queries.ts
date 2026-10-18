/**
 * Capa de adaptación entre back-lamelas y las pantallas del panel.
 *
 * La API habla camelCase y manda los `numeric` como string (son Decimal en
 * Prisma). Los componentes hablan snake_case y esperan números. Toda esa
 * traducción vive acá: si cambia la API, se toca solo este archivo.
 */

import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import { normalizarDatos } from "@/lib/captacion";
import type { PropertyCardData } from "@/components/properties/property-card";
import type {
  Captacion,
  AnalyticsLeads,
  AnalyticsOverview,
  AnalyticsProperties,
  AnalyticsSofia,
  ApiKey,
  ApiKeyScope,
  CanalConversacion,
  CanalLead,
  ChannelAccount,
  ClasificacionLead,
  Conversacion,
  ConversacionMensaje,
  CitaMensaje,
  AnuncioOrigen,
  AdjuntoMensaje,
  Edificio,
  EstadoConversacion,
  EstadoLead,
  EstadoPropiedad,
  EstadoUsuario,
  FeedbackDetalle,
  FeedbackEstado,
  FeedbackItem,
  FeedbackTipo,
  PlanAgente,
  Incidente,
  Invitacion,
  Lead,
  LeadAvance,
  LeadDetalle,
  Moneda,
  Notificacion,
  Operacion,
  Property,
  PropertyImage,
  Rol,
  RolMensaje,
  ScopeOption,
  TipoMensaje,
  TipoPropiedad,
  Usuario,
} from "@/lib/types";
import { MOTIVOS_DERIVACION } from "@/lib/types";
import type {
  AvanceResultado,
  DerivacionLead,
  MotivoDerivacion,
  OperacionCierre,
} from "@/lib/types";

export const PAGE_SIZE = 24;

export interface PropertyFilters {
  q?: string;
  operacion?: string;
  tipo?: string;
  estado?: string;
  vendedor?: string;
  /** id del edificio → solo sus unidades. */
  edificio?: string;
  dormitorios?: string;
  /** "true" → solo las que tienen zona vacía o fuera de ZONAS. */
  zona_revisar?: string;
  pagina?: number;
}

// --- Lo que devuelve la API -------------------------------------------------

interface ApiImage {
  id: string;
  propertyId: string;
  url: string;
  esPortada: boolean;
  orden: number;
  createdAt: string;
}

interface ApiProperty {
  id: string;
  tenantId: string;
  userId: string;
  titulo: string;
  operacion: Operacion;
  tipo: TipoPropiedad;
  precio: string;
  moneda: Moneda;
  precioAlquiler: string | null;
  monedaAlquiler: Moneda | null;
  descripcion: string | null;
  direccion: string | null;
  zona: string | null;
  puntoReferencia: string | null;
  ciudad: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  supCubierta: string | null;
  supTotal: string | null;
  estado: EstadoPropiedad;
  destacada: boolean;
  notas: string | null;
  requisitos: string | null;
  destino: Property["destino"];
  plazoContrato: Property["plazo_contrato"];
  plazoOtro: string | null;
  ajuste: Property["ajuste"];
  ajusteOtro: string | null;
  indiceAjuste: Property["indice_ajuste"];
  indiceFijoPct: string | null;
  expensas: string | null;
  mascotas: Property["mascotas"];
  amoblado: Property["amoblado"];
  lat: string | null;
  lng: string | null;
  linkMaps: string | null;
  edificioId: string | null;
  unidad: string | null;
  createdAt: string;
  updatedAt: string;
  images?: ApiImage[];
  user?: { id: string; nombre: string } | null;
  edificio?: { id: string; nombre: string } | null;
}

interface ListResponse {
  data: ApiProperty[];
  meta: { page: number; limit: number; total: number };
}

// --- Traducción -------------------------------------------------------------

const num = (v: string | null): number | null => (v === null ? null : Number(v));

function toCard(p: ApiProperty): PropertyCardData {
  return {
    id: p.id,
    titulo: p.titulo,
    operacion: p.operacion,
    tipo: p.tipo,
    precio: Number(p.precio),
    moneda: p.moneda,
    precio_alquiler: p.precioAlquiler != null ? Number(p.precioAlquiler) : null,
    moneda_alquiler: p.monedaAlquiler ?? null,
    estado: p.estado,
    destacada: p.destacada,
    zona: p.zona,
    edificio: p.edificio?.nombre ?? null,
    unidad: p.unidad ?? null,
    vendedor: p.user?.nombre ?? null,
    // En el listado la API manda solo la portada (o nada, si no hay fotos).
    portada: p.images?.[0]?.url ?? null,
    created_at: p.createdAt,
  };
}

function toProperty(p: ApiProperty): Property {
  return {
    id: p.id,
    tenant_id: p.tenantId,
    user_id: p.userId,
    titulo: p.titulo,
    operacion: p.operacion,
    tipo: p.tipo,
    precio: Number(p.precio),
    moneda: p.moneda,
    precio_alquiler: p.precioAlquiler != null ? Number(p.precioAlquiler) : null,
    moneda_alquiler: p.monedaAlquiler ?? null,
    descripcion: p.descripcion,
    direccion: p.direccion,
    zona: p.zona,
    punto_referencia: p.puntoReferencia,
    ciudad: p.ciudad,
    ambientes: p.ambientes,
    dormitorios: p.dormitorios,
    banios: p.banios,
    sup_cubierta: num(p.supCubierta),
    sup_total: num(p.supTotal),
    estado: p.estado,
    destacada: p.destacada,
    notas: p.notas,
    requisitos: p.requisitos,
    destino: p.destino,
    plazo_contrato: p.plazoContrato,
    plazo_otro: p.plazoOtro,
    ajuste: p.ajuste,
    ajuste_otro: p.ajusteOtro,
    indice_ajuste: p.indiceAjuste,
    indice_fijo_pct: num(p.indiceFijoPct),
    expensas: p.expensas,
    mascotas: p.mascotas,
    amoblado: p.amoblado,
    lat: num(p.lat),
    lng: num(p.lng),
    link_maps: p.linkMaps,
    edificio: p.edificio ? { id: p.edificio.id, nombre: p.edificio.nombre } : null,
    unidad: p.unidad ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

function toImage(i: ApiImage): PropertyImage {
  return {
    id: i.id,
    property_id: i.propertyId,
    url: i.url,
    es_portada: i.esPortada,
    orden: i.orden,
    created_at: i.createdAt,
  };
}

// --- Filtros ----------------------------------------------------------------

const OPERACIONES = ["venta", "alquiler"] as const;
const TIPOS = [
  "monoambiente",
  "departamento",
  "casa",
  "duplex",
  "local_comercial",
  "oficina",
  "galpon",
  "estacionamiento",
  "terreno",
  "otro",
] as const;
const ESTADOS = [
  "disponible",
  "reservado",
  "proximamente",
  "pausado",
  "vendida",
  "alquilada",
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Los filtros llegan de la query string, así que pueden traer cualquier cosa.
 * La API valida con zod y responde 400: preferimos ignorar el valor raro y
 * mostrar el listado sin ese filtro, como hacía la versión anterior.
 */
function oneOf<T extends string>(values: readonly T[], value?: string): T | undefined {
  return values.includes(value as T) ? (value as T) : undefined;
}

async function list(path: string, filters: PropertyFilters) {
  const page = Math.max(1, filters.pagina || 1);
  // Dormitorios como mínimo. Ignoramos valores no numéricos (query string).
  const dormitorios = /^\d+$/.test(filters.dormitorios ?? "")
    ? Number(filters.dormitorios)
    : undefined;

  const { data, meta } = await apiFetch<ListResponse>(path, {
    query: {
      q: filters.q?.trim(),
      operacion: oneOf(OPERACIONES, filters.operacion),
      tipo: oneOf(TIPOS, filters.tipo),
      estado: oneOf(ESTADOS, filters.estado),
      vendedor: UUID.test(filters.vendedor ?? "") ? filters.vendedor : undefined,
      edificio_id: UUID.test(filters.edificio ?? "") ? filters.edificio : undefined,
      dormitorios,
      zona_revisar: filters.zona_revisar === "true" ? "true" : undefined,
      page,
      limit: PAGE_SIZE,
    },
  });

  return { properties: data.map(toCard), count: meta.total, page: meta.page };
}

// --- Consultas --------------------------------------------------------------

/** Todas las propiedades de la inmobiliaria. */
export function getProperties(filters: PropertyFilters) {
  return list("/v1/properties", filters);
}

/** Solo las del usuario logueado; el filtro lo aplica la API. */
export function getMyProperties(filters: PropertyFilters) {
  return list("/v1/properties/mine", filters);
}

export interface PropertyDetail {
  property: Property;
  vendedor: string | null;
  images: PropertyImage[];
}

/** Edificios del tenant, alfabéticos, con su cantidad de unidades. */
export async function getEdificios(): Promise<Edificio[]> {
  const { data } = await apiFetch<{ data: Edificio[] }>("/v1/edificios");
  return data.map((e) => ({ id: e.id, nombre: e.nombre, unidades: e.unidades }));
}

/**
 * Las otras unidades del mismo edificio, para la ficha de una propiedad. Todas
 * (no solo las disponibles): en el panel interesa ver también cuáles ya se
 * vendieron o alquilaron.
 */
export async function getOtrasUnidades(
  edificioId: string,
  exceptoId: string
): Promise<PropertyCardData[]> {
  const { data } = await apiFetch<ListResponse>("/v1/properties", {
    query: { edificio_id: edificioId, page: 1, limit: 100 },
  });
  return data
    .filter((p) => p.id !== exceptoId)
    .map(toCard)
    .sort((a, b) => (a.unidad ?? "").localeCompare(b.unidad ?? "", "es", { numeric: true }));
}

/** Devuelve null si no existe (o si el id ni siquiera es un uuid). */
export async function getProperty(id: string): Promise<PropertyDetail | null> {
  try {
    const { property } = await apiFetch<{ property: ApiProperty }>(`/v1/properties/${id}`);
    return {
      property: toProperty(property),
      vendedor: property.user?.nombre ?? null,
      images: (property.images ?? []).map(toImage),
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

/** Para el filtro por vendedor. La API ordena por antigüedad; acá alfabético. */
export async function getVendedores(): Promise<{ id: string; nombre: string }[]> {
  const { data } = await apiFetch<{ data: { id: string; nombre: string }[] }>("/v1/users", {
    query: { estado: "activo" },
  });

  return data
    .map((u) => ({ id: u.id, nombre: u.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  created_at: string;
}

/**
 * Datos del usuario logueado para la pantalla de perfil. `/auth/me` no manda
 * la fecha de alta, así que la sacamos del listado de usuarios del tenant.
 */
export async function getPerfil(): Promise<Perfil | null> {
  const me = await getCurrentUser();
  if (!me) return null;

  const { data } = await apiFetch<{ data: (Perfil & { createdAt: string })[] }>("/v1/users");
  const row = data.find((u) => u.id === me.id);

  return {
    id: me.id,
    nombre: me.nombre,
    email: me.email,
    rol: me.rol,
    created_at: row?.createdAt ?? "",
  };
}

// ── CRM: consultas ───────────────────────────────────────────────────────────

interface ApiLead {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  mensaje: string;
  canal: CanalLead;
  canalRef?: string | null;
  estado: EstadoLead;
  operacionCierre?: OperacionCierre | null;
  propiedadCierre?: { id: string; titulo: string } | null;
  cerradoAt?: string | null;
  // En el listado la API manda `ultimo_avance`; en el detalle, `avances` completo.
  ultimo_avance?: { resultado: AvanceResultado; comentario: string | null; createdAt: string } | null;
  avance_pendiente?: boolean;
  avances?: ApiLeadAvance[];
  clasificacion?: ClasificacionLead | null;
  // La API aplana la última derivación del lead (ver crm/service.ts).
  derivacion?: { motivo: string; pendiente: boolean; asignado_at: string } | null;
  assignedTo: string | null;
  tomadoAt: string | null;
  tomadoPor: string | null;
  tomadoOrigen?: "panel" | "whatsapp_business_app" | "sistema" | null;
  createdAt: string;
  property?: { id: string; titulo: string; operacion?: Operacion; precio?: string } | null;
  assignee?: { id: string; nombre: string } | null;
  takenBy?: { id: string; nombre: string } | null;
  notes?: ApiLeadNote[];
}

interface ApiLeadAvance {
  id: string;
  resultado: AvanceResultado;
  comentario: string | null;
  createdAt: string;
  user?: { id: string; nombre: string } | null;
}

interface ApiLeadNote {
  id: string;
  nota: string;
  origen?: "humano" | "agente" | "sistema";
  createdAt: string;
  user?: { id: string; nombre: string } | null;
}

/** Descarta un motivo desconocido en vez de romper la lista. */
function derivacionDe(d: ApiLead["derivacion"]): DerivacionLead | null {
  if (!d) return null;
  const motivo = d.motivo as MotivoDerivacion;
  if (!(motivo in MOTIVOS_DERIVACION)) return null;
  return { motivo, pendiente: d.pendiente, asignado_at: d.asignado_at };
}

function toLead(l: ApiLead): Lead {
  return {
    id: l.id,
    nombre: l.nombre,
    email: l.email,
    telefono: l.telefono,
    mensaje: l.mensaje,
    canal: l.canal,
    canal_ref: l.canalRef ?? null,
    estado: l.estado,
    operacion_cierre: l.operacionCierre ?? null,
    propiedad_cierre: l.propiedadCierre
      ? { id: l.propiedadCierre.id, titulo: l.propiedadCierre.titulo }
      : null,
    cerrado_at: l.cerradoAt ?? null,
    // El detalle no trae `ultimo_avance`: sale del primero del historial.
    ultimo_avance: l.ultimo_avance
      ? {
          resultado: l.ultimo_avance.resultado,
          comentario: l.ultimo_avance.comentario,
          created_at: l.ultimo_avance.createdAt,
        }
      : l.avances?.[0]
        ? {
            resultado: l.avances[0].resultado,
            comentario: l.avances[0].comentario,
            created_at: l.avances[0].createdAt,
          }
        : null,
    avance_pendiente: l.avance_pendiente ?? false,
    clasificacion: l.clasificacion ?? null,
    derivacion: derivacionDe(l.derivacion),
    assigned_to: l.assignedTo,
    asignado: l.assignee?.nombre ?? null,
    tomado_at: l.tomadoAt,
    tomado_por: l.tomadoPor,
    tomado_origen: l.tomadoOrigen ?? null,
    tomado_por_nombre: l.takenBy?.nombre ?? null,
    propiedad: l.property
      ? {
          id: l.property.id,
          titulo: l.property.titulo,
          ...(l.property.operacion ? { operacion: l.property.operacion } : {}),
          ...(l.property.precio ? { precio: Number(l.property.precio) } : {}),
        }
      : null,
    created_at: l.createdAt,
  };
}

export interface LeadFilters {
  q?: string;
  estado?: string;
  canal?: string;
  clasificacion?: string;
  /** "true" → solo los que tienen una derivación sin tomar. */
  atencion?: string;
  /** "pendiente" → solo las que esperan que el vendedor cargue un avance. */
  avance?: string;
  /** "true" → por atender: abiertas, asignadas y sin tomar. */
  sinTomar?: string;
  /** "venta" | "alquiler" → ganadas cerradas con esa operación. */
  cierre?: string;
  asignado?: string;
  pagina?: number;
}

const ESTADOS_LEAD_VALUES = ["nueva", "en_contacto", "ganada", "perdida"] as const;
const CANALES_VALUES = ["web", "whatsapp", "instagram", "messenger", "manual"] as const;
const CLASIF_VALUES = ["potencial", "fantasma"] as const;

export async function getLeads(filters: LeadFilters) {
  const page = Math.max(1, filters.pagina || 1);

  const { data, meta } = await apiFetch<{
    data: ApiLead[];
    meta: { page: number; limit: number; total: number };
  }>("/v1/leads", {
    query: {
      q: filters.q?.trim(),
      estado: oneOf(ESTADOS_LEAD_VALUES, filters.estado),
      canal: oneOf(CANALES_VALUES, filters.canal),
      clasificacion: oneOf(CLASIF_VALUES, filters.clasificacion),
      atencion: filters.atencion === "true" ? "true" : undefined,
      avance: filters.avance === "pendiente" ? "pendiente" : undefined,
      por_atender: filters.sinTomar === "true" ? "true" : undefined,
      operacion_cierre: oneOf(["venta", "alquiler"] as const, filters.cierre),
      assigned_to: UUID.test(filters.asignado ?? "") ? filters.asignado : undefined,
      // Separacion agente/consultas: el backend excluye las conversaciones del
      // agente web (canal "web" con canal_ref). Asi count y paginacion salen bien.
      excluir_agente_web: true,
      page,
      limit: PAGE_SIZE,
    },
  });

  const leads = data.map(toLead);
  return { leads, count: meta.total, page: meta.page };
}

/** Consultas por atender del usuario actual (o del equipo, si es admin): burbuja del menú. */
export async function getConsultasSinTomarCount(): Promise<number> {
  try {
    const { meta } = await apiFetch<{ meta: { total: number } }>("/v1/leads", {
      query: {
        por_atender: true,
        excluir_agente_web: true,
        page: 1,
        limit: 1,
      },
    });
    return meta.total;
  } catch {
    return 0;
  }
}

/**
 * Cuántas consultas esperan avance. Para un vendedor, las suyas; para un admin
 * (sin `userId`), las de todo el equipo. 0 si la API falla: es un contador de
 * apoyo y no debe romper la pantalla.
 */
export async function getAvancesPendientesCount(userId?: string): Promise<number> {
  try {
    const { meta } = await apiFetch<{ meta: { total: number } }>("/v1/leads", {
      query: {
        avance: "pendiente",
        assigned_to: userId,
        excluir_agente_web: true,
        page: 1,
        limit: 1,
      },
    });
    return meta.total;
  } catch {
    return 0;
  }
}

export interface LeadStats {
  por_estado: Record<string, number>;
  por_canal: Record<string, number>;
  /** Cuenta por clasificación; los sin clasificar caen en "sin_clasificar". */
  por_clasificacion: Record<string, number>;
}

/** Métricas de consultas (solo admin). Devuelve null si la API responde 403. */
export async function getLeadStats(): Promise<LeadStats | null> {
  try {
    return await apiFetch<LeadStats>("/v1/leads/stats");
  } catch {
    return null;
  }
}

// ── Analíticas comerciales ─────────────────────────────────────────────────

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  canal?: string;
  vendedor?: string;
  operacion?: string;
  tipo?: string;
  zona?: string;
  clasificacion?: string;
}

function analyticsQuery(filters: AnalyticsFilters) {
  return {
    from: filters.from,
    to: filters.to,
    timezone: "America/Argentina/Tucuman",
    canal: oneOf(CANALES_VALUES, filters.canal),
    seller_id: UUID.test(filters.vendedor ?? "") ? filters.vendedor : undefined,
    operacion: oneOf(["venta", "alquiler", "ambos"] as const, filters.operacion),
    tipo: oneOf(
      [
        "monoambiente",
        "departamento",
        "casa",
        "duplex",
        "local_comercial",
        "oficina",
        "galpon",
        "estacionamiento",
        "terreno",
        "otro",
      ] as const,
      filters.tipo
    ),
    zona: filters.zona?.trim(),
    clasificacion: oneOf(CLASIF_VALUES, filters.clasificacion),
  };
}

export function getAnalyticsOverview(filters: AnalyticsFilters) {
  return apiFetch<AnalyticsOverview>("/v1/analytics/overview", {
    query: analyticsQuery(filters),
  });
}

export function getAnalyticsLeads(filters: AnalyticsFilters) {
  return apiFetch<AnalyticsLeads>("/v1/analytics/leads", {
    query: analyticsQuery(filters),
  });
}

/**
 * Uso del plan de conversaciones del agente en un mes (`AAAA-MM`; por defecto
 * el actual). Nunca lanza: sin dato, no se muestra el medidor.
 */
export async function getPlanAgente(mes?: string): Promise<PlanAgente | null> {
  try {
    return await apiFetch<PlanAgente>("/v1/analytics/plan", {
      query: mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? { mes } : {},
    });
  } catch {
    return null;
  }
}

export function getAnalyticsSofia(filters: AnalyticsFilters) {
  return apiFetch<AnalyticsSofia>("/v1/analytics/sofia", {
    query: analyticsQuery(filters),
  });
}

export function getAnalyticsProperties(filters: AnalyticsFilters) {
  return apiFetch<AnalyticsProperties>("/v1/analytics/properties", {
    query: analyticsQuery(filters),
  });
}

/** Devuelve null si no existe o si el usuario no tiene permiso de verla. */
export async function getLead(id: string): Promise<LeadDetalle | null> {
  try {
    const { lead } = await apiFetch<{ lead: ApiLead }>(`/v1/leads/${id}`);
    return {
      ...toLead(lead),
      asignado: lead.assignee?.nombre ?? null,
      notas: (lead.notes ?? []).map((n) => ({
        id: n.id,
        nota: n.nota,
        autor: n.user?.nombre ?? null,
        origen: n.origen ?? "humano",
        created_at: n.createdAt,
      })),
      avances: (lead.avances ?? []).map(
        (a): LeadAvance => ({
          id: a.id,
          resultado: a.resultado,
          comentario: a.comentario,
          autor: a.user?.nombre ?? null,
          created_at: a.createdAt,
        })
      ),
    };
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) return null;
    throw error;
  }
}

// ── Agente de IA: conversaciones ─────────────────────────────────────────────
// `/v1/conversations/*` ya viaja en snake_case (lo arma el módulo agent), así
// que acá casi no hay traducción: solo normalizamos `zonas` (puede venir como
// string suelto) y tipamos lo que consume el panel.

interface ApiConversacion {
  id: string;
  lead_id: string;
  canal: CanalConversacion;
  canal_ref: string;
  estado: EstadoConversacion;
  bot_activo: boolean;
  vendedor_id: string | null;
  perfil: {
    intencion: string | null;
    tipo_propiedad: string[] | string | null;
    ciudad: string | null;
    zonas: string[] | string | null;
    presupuesto_min: number | null;
    presupuesto_max: number | null;
    moneda: Moneda | null;
    dormitorios_min: number | null;
    property_id: string | null;
    temperatura: string | null;
  };
  resumen_at: string | null;
  creada_at: string;
}

interface ApiMensaje {
  id: string;
  rol: RolMensaje;
  tipo: TipoMensaje;
  contenido: string;
  media_url: string | null;
  creado_at: string;
  cita?: CitaMensaje | null;
  anuncio?: AnuncioOrigen | null;
  adjuntos?: AdjuntoMensaje[];
}

// Algunos campos del perfil son arrays en la API (columnas de array en la BD),
// pero pueden llegar como valor suelto: se normalizan a array acá.
const aArray = (v: string[] | string | null): string[] | null =>
  Array.isArray(v) ? v : v ? [v] : null;

function toConversacion(c: ApiConversacion): Conversacion {
  return {
    id: c.id,
    lead_id: c.lead_id,
    canal: c.canal,
    canal_ref: c.canal_ref,
    estado: c.estado,
    bot_activo: c.bot_activo,
    vendedor_id: c.vendedor_id,
    perfil: {
      ...c.perfil,
      tipo_propiedad: aArray(c.perfil.tipo_propiedad),
      zonas: aArray(c.perfil.zonas),
    },
    resumen_at: c.resumen_at,
    creada_at: c.creada_at,
  };
}

function toMensaje(m: ApiMensaje): ConversacionMensaje {
  return {
    id: m.id,
    rol: m.rol,
    tipo: m.tipo,
    contenido: m.contenido,
    media_url: m.media_url,
    creado_at: m.creado_at,
    // Opcionales en la API vieja: un backend sin CHAT-WHATSAPP-01 no los manda.
    cita: m.cita ?? null,
    anuncio: m.anuncio ?? null,
    adjuntos: m.adjuntos ?? [],
  };
}

/**
 * La conversación del agente para un lead (si la hay) junto con su hilo de
 * mensajes. Un lead cargado a mano no tiene conversación: devuelve null.
 */
export async function getConversacionDeLead(
  leadId: string
): Promise<{ conversacion: Conversacion; mensajes: ConversacionMensaje[] } | null> {
  try {
    const { data } = await apiFetch<{ data: ApiConversacion[] }>("/v1/conversations", {
      query: { lead_id: leadId, limit: 1 },
    });
    const conv = data[0];
    if (!conv) return null;

    const { data: mensajes } = await apiFetch<{ data: ApiMensaje[] }>(
      `/v1/conversations/${conv.id}/messages`
    );

    return { conversacion: toConversacion(conv), mensajes: mensajes.map(toMensaje) };
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) return null;
    throw error;
  }
}

// ── Equipo ───────────────────────────────────────────────────────────────────

interface ApiUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
  createdAt: string;
}

/** Todos los del tenant, activos e inactivos. La API ordena por antigüedad. */
export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await apiFetch<{ data: ApiUsuario[] }>("/v1/users");
  return data.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    estado: u.estado,
    created_at: u.createdAt,
  }));
}

/** Solo admin. Las vencidas y las ya aceptadas no vienen. */
export async function getInvitaciones(): Promise<Invitacion[]> {
  const { data } = await apiFetch<{
    data: { id: string; email: string; rol: Rol; expiresAt: string; createdAt: string }[];
  }>("/v1/invitations");
  return data.map((i) => ({
    id: i.id,
    email: i.email,
    rol: i.rol,
    expira: i.expiresAt,
    created_at: i.createdAt,
  }));
}

// ── Integraciones ────────────────────────────────────────────────────────────

/** Solo admin. Las revocadas no vienen. */
export async function getApiKeys(): Promise<ApiKey[]> {
  const { data } = await apiFetch<{
    data: {
      id: string;
      nombre: string;
      prefix: string;
      scopes: ApiKeyScope[];
      lastUsedAt: string | null;
      createdAt: string;
    }[];
  }>("/v1/integrations/api-keys");
  return data.map((k) => ({
    id: k.id,
    nombre: k.nombre,
    prefix: k.prefix,
    scopes: k.scopes ?? [],
    last_used_at: k.lastUsedAt,
    created_at: k.createdAt,
  }));
}

/**
 * Catálogo de permisos para armar el formulario. Se pide a la API en vez de
 * hardcodear las etiquetas: si mañana aparece un scope nuevo (un portal, otra
 * integración), el panel lo muestra sin tocar el código.
 */
export async function getApiKeyScopes(): Promise<ScopeOption[]> {
  const { data } = await apiFetch<{ data: ScopeOption[] }>("/v1/integrations/scopes");
  return data;
}

export interface FollowupSettings {
  agentEnabled: boolean;
  enabled: boolean;
  firstMessage: string;
  secondMessage: string;
}

export async function getFollowupSettings(): Promise<FollowupSettings> {
  const { tenant } = await apiFetch<{
    tenant: {
      agentEnabled: boolean;
      followupEnabled: boolean;
      followupFirstMessage: string;
      followupSecondMessage: string;
    };
  }>("/v1/tenants/current");
  return {
    agentEnabled: tenant.agentEnabled,
    enabled: tenant.followupEnabled,
    firstMessage: tenant.followupFirstMessage,
    secondMessage: tenant.followupSecondMessage
  };
}

// ── Correos de operación (Configuración → Correos, solo admin) ───────────────

export type TipoCorreo = "lead_asignado";
export type CorreosActivos = Record<TipoCorreo, boolean>;

export interface CorreoReciente {
  id: string;
  tipo: TipoCorreo;
  destinatario: string;
  asunto: string;
  estado: "pendiente" | "enviando" | "enviado" | "fallido";
  intentos: number;
  error: string | null;
  lead_id: string | null;
  created_at: string;
  enviado_at: string | null;
}

export async function getCorreosConfig(): Promise<CorreosActivos> {
  const { tenant } = await apiFetch<{ tenant: { correosActivos?: Partial<CorreosActivos> } }>(
    "/v1/tenants/current"
  );
  return { lead_asignado: tenant.correosActivos?.lead_asignado ?? true };
}

export async function getCorreosRecientes(): Promise<CorreoReciente[]> {
  const { data } = await apiFetch<{
    data: {
      id: string;
      tipo: TipoCorreo;
      destinatario: string;
      asunto: string;
      estado: CorreoReciente["estado"];
      intentos: number;
      error: string | null;
      leadId: string | null;
      createdAt: string;
      enviadoAt: string | null;
    }[];
  }>("/v1/correos", { query: { limit: 20 } });
  return data.map((c) => ({
    id: c.id,
    tipo: c.tipo,
    destinatario: c.destinatario,
    asunto: c.asunto,
    estado: c.estado,
    intentos: c.intentos,
    error: c.error,
    lead_id: c.leadId,
    created_at: c.createdAt,
    enviado_at: c.enviadoAt,
  }));
}

// ── Resumen de la home ───────────────────────────────────────────────────────

// El resumen de la home muestra tres contadores; no necesita todos los estados.
export interface Resumen {
  propiedades: Record<"disponible" | "reservado" | "vendida", number>;
  /** Abiertas, asignadas y sin tomar: del vendedor, o de todo el equipo para el admin. */
  consultasPorAtender: number;
  ultimasConsultas: Lead[];
  ultimasPropiedades: PropertyCardData[];
}

/**
 * Un contador por estado sale de pedir una página de tamaño 1 y quedarse con
 * `meta.total`: no traemos filas que no vamos a mostrar. Deliberadamente no usa
 * `/v1/leads/stats`, que es solo para admins.
 *
 * El vendedor ve su propio trabajo, no el de la inmobiliaria: sus propiedades
 * salen de `/v1/properties/mine` y sus consultas de filtrar por `assigned_to`.
 * RLS ya le impide ver lo ajeno; esto es para que la pantalla no le informe
 * números del negocio que no le corresponden.
 */
export async function getResumen(): Promise<Resumen> {
  const me = await getCurrentUser();
  const soloMio = me ? !esAdmin(me.rol) : false;

  const pathPropiedades = soloMio ? "/v1/properties/mine" : "/v1/properties";
  const misConsultas = soloMio && me ? { assigned_to: me.id } : {};

  const total = (estado: EstadoPropiedad) =>
    apiFetch<{ meta: { total: number } }>(pathPropiedades, {
      query: { estado, page: 1, limit: 1 },
    }).then((r) => r.meta.total);

  const [disponible, reservado, vendida, porAtender, consultas, propiedades] = await Promise.all([
    total("disponible"),
    total("reservado"),
    total("vendida"),
    // "Por atender": el backend ya acota al vendedor a las suyas. Es el mismo
    // filtro que la burbuja del menú y el listado (?sin_tomar=true), así los
    // tres números coinciden.
    apiFetch<{ meta: { total: number } }>("/v1/leads", {
      query: { por_atender: true, excluir_agente_web: true, page: 1, limit: 1 },
    }).then((r) => r.meta.total),
    apiFetch<{ data: ApiLead[] }>("/v1/leads", {
      query: { ...misConsultas, excluir_agente_web: true, page: 1, limit: 5 },
    }),
    apiFetch<ListResponse>(pathPropiedades, { query: { page: 1, limit: 4 } }),
  ]);

  return {
    propiedades: { disponible, reservado, vendida },
    consultasPorAtender: porAtender,
    ultimasConsultas: consultas.data.map(toLead),
    ultimasPropiedades: propiedades.data.map(toCard),
  };
}

/**
 * Listado liviano para el select de "cargar consulta": solo id y titulo de las
 * disponibles. Pide 100 (el máximo de la API) porque no tiene paginado: si
 * alguna vez hay más propiedades que eso, hay que cambiarlo por un buscador.
 */
export async function getPropiedadesParaSelect(): Promise<{ id: string; titulo: string }[]> {
  // Traemos TODAS las disponibles, no solo las primeras 100: la API topa el
  // limit en 100, asi que paginamos hasta juntarlas todas (si no, una propiedad
  // disponible "vieja" no aparecia en el selector).
  const acc: { id: string; titulo: string }[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await apiFetch<ListResponse>("/v1/properties", {
      query: { estado: "disponible", page, limit: 100 },
    });
    acc.push(...data.map((p) => ({ id: p.id, titulo: p.titulo })));
    if (data.length === 0 || acc.length >= meta.total) break;
  }
  return acc.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
}

// ── Feedback: canal del equipo ───────────────────────────────────────────────

interface ApiFeedback {
  id: string;
  tipo: FeedbackTipo;
  titulo: string;
  descripcion: string;
  estado: FeedbackEstado;
  urlContexto: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
  autor?: { id: string; nombre: string } | null;
  _count?: { adjuntos: number; comentarios: number };
  ultimaRespuestaAt?: string | null;
  adjuntos?: { id: string; url: string; orden: number }[];
  comentarios?: { id: string; cuerpo: string; createdAt: string; autor?: { id: string; nombre: string } | null }[];
}

function toFeedback(f: ApiFeedback): FeedbackItem {
  return {
    id: f.id,
    tipo: f.tipo,
    titulo: f.titulo,
    descripcion: f.descripcion,
    estado: f.estado,
    url_contexto: f.urlContexto,
    autor: f.autor ? { id: f.autor.id, nombre: f.autor.nombre } : null,
    adjuntos_count: f._count?.adjuntos ?? 0,
    comentarios_count: f._count?.comentarios ?? 0,
    ultima_respuesta_at: f.ultimaRespuestaAt ?? null,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  };
}

export interface FeedbackListFilters {
  tipo?: string;
  estado?: string;
  q?: string;
  pagina?: number;
}

const FEEDBACK_TIPOS = ["error", "problema", "sugerencia"] as const;
const FEEDBACK_ESTADOS = ["nuevo", "en_revision", "planificada", "resuelta", "descartada"] as const;

export async function getFeedbackList(filters: FeedbackListFilters) {
  const page = Math.max(1, filters.pagina || 1);
  const { data, meta } = await apiFetch<{
    data: ApiFeedback[];
    meta: { page: number; limit: number; total: number };
  }>("/v1/feedback", {
    query: {
      tipo: oneOf(FEEDBACK_TIPOS, filters.tipo),
      estado: oneOf(FEEDBACK_ESTADOS, filters.estado),
      q: filters.q?.trim(),
      page,
      limit: PAGE_SIZE,
    },
  });
  return { items: data.map(toFeedback), count: meta.total, page: meta.page };
}

export async function getFeedbackItem(id: string): Promise<FeedbackDetalle | null> {
  try {
    const { item } = await apiFetch<{ item: ApiFeedback }>(`/v1/feedback/${id}`);
    return {
      ...toFeedback(item),
      user_agent: item.userAgent ?? null,
      adjuntos: (item.adjuntos ?? []).map((a) => ({ id: a.id, url: a.url, orden: a.orden })),
      comentarios: (item.comentarios ?? []).map((c) => ({
        id: c.id,
        cuerpo: c.cuerpo,
        autor: { id: c.autor?.id ?? "", nombre: c.autor?.nombre ?? "Soporte" },
        created_at: c.createdAt,
      })),
    };
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) return null;
    throw error;
  }
}

// ── Probador del agente ──────────────────────────────────────────────────────

export interface ConversacionPrueba {
  lead_id: string;
  session_id: string;
  estado: EstadoLead;
  created_at: string;
}

/**
 * Conversaciones de prueba: leads de canal `web` cuyo `canal_ref` (el session_id)
 * empieza con `prueba-`. Se sobre-traen y filtran en el cliente (bien mientras el
 * volumen sea bajo). Ordenadas de la más nueva a la más vieja.
 */
export async function getConversacionesPrueba(): Promise<ConversacionPrueba[]> {
  const { data } = await apiFetch<{ data: ApiLead[]; meta: { total: number } }>("/v1/leads", {
    query: { canal: "web", page: 1, limit: 100 },
  });
  return data
    .filter((l) => (l.canalRef ?? "").startsWith("prueba-"))
    .map((l) => ({
      lead_id: l.id,
      session_id: l.canalRef as string,
      estado: l.estado,
      created_at: l.createdAt,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Cuentas de mensajería conectadas por Zernio (hoy solo WhatsApp). La API ya
 * las devuelve en snake_case porque `channelPayload` del backend las arma así
 * — es de las pocas respuestas que no hay que traducir acá.
 */
export async function getChannels(): Promise<ChannelAccount[]> {
  const { data } = await apiFetch<{ data: ChannelAccount[] }>("/v1/integrations/channels");
  return data;
}

// ── Notificaciones internas (campanita) ──────────────────────────────────────

interface ApiNotificacion {
  id: string;
  tipo: Notificacion["tipo"];
  titulo: string;
  cuerpo: string;
  link: string | null;
  prioridad?: Notificacion["prioridad"];
  leidaAt: string | null;
  createdAt: string;
}

function toNotificacion(n: ApiNotificacion): Notificacion {
  return {
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    link: n.link,
    // Un backend anterior a los incidentes no manda el campo.
    prioridad: n.prioridad ?? "normal",
    leida_at: n.leidaAt,
    created_at: n.createdAt,
  };
}

export interface NotificacionesPagina {
  notificaciones: Notificacion[];
  /** Total del listado pedido (respeta el filtro de no leídas). */
  count: number;
  page: number;
  /** Sin leer en total: el número de la campanita, no depende del filtro. */
  noLeidas: number;
}

export async function getNotificaciones(opts: {
  pagina?: number;
  soloNoLeidas?: boolean;
  limit?: number;
  /** Campanita: las críticas sin leer primero. */
  fijarCriticas?: boolean;
}): Promise<NotificacionesPagina> {
  const { data, meta } = await apiFetch<{
    data: ApiNotificacion[];
    meta: { page: number; limit: number; total: number; no_leidas: number };
  }>("/v1/notifications", {
    query: {
      solo_no_leidas: opts.soloNoLeidas ? "true" : undefined,
      fijar_criticas: opts.fijarCriticas ? "true" : undefined,
      page: Math.max(1, opts.pagina || 1),
      limit: opts.limit ?? PAGE_SIZE,
    },
  });
  return {
    notificaciones: data.map(toNotificacion),
    count: meta.total,
    page: meta.page,
    noLeidas: meta.no_leidas,
  };
}

/** Cuántas muestra el desplegable de la campanita. */
export const NOTIFICACIONES_CAMPANITA = 6;

export interface ResumenNotificaciones {
  ultimas: Notificacion[];
  noLeidas: number;
}

/**
 * Lo que necesita la campanita: las últimas 6 y el contador. Si la API falla
 * devuelve vacío — la campanita vive en el layout y un error ahí dejaría todo
 * el panel sin poder usarse.
 */
export async function getResumenNotificaciones(): Promise<ResumenNotificaciones> {
  try {
    const { notificaciones, noLeidas } = await getNotificaciones({
      limit: NOTIFICACIONES_CAMPANITA,
      fijarCriticas: true,
    });
    return { ultimas: notificaciones, noLeidas };
  } catch {
    return { ultimas: [], noLeidas: 0 };
  }
}

// ── Incidentes del agente (solo admin) ───────────────────────────────────────

interface ApiIncidente {
  id: string;
  tipo: Incidente["tipo"];
  gravedad: Incidente["gravedad"];
  titulo: string;
  detalle: string | null;
  workflow: string | null;
  nodo: string | null;
  executionId: string | null;
  executionUrl: string | null;
  ocurrencias: number;
  primeraAt: string;
  ultimaAt: string;
  estado: Incidente["estado"];
  resueltoAt: string | null;
  resueltoPorUser: { id: string; nombre: string } | null;
}

function toIncidente(i: ApiIncidente): Incidente {
  return {
    id: i.id,
    tipo: i.tipo,
    gravedad: i.gravedad,
    titulo: i.titulo,
    detalle: i.detalle,
    workflow: i.workflow,
    nodo: i.nodo,
    execution_id: i.executionId,
    execution_url: i.executionUrl,
    ocurrencias: i.ocurrencias,
    primera_at: i.primeraAt,
    ultima_at: i.ultimaAt,
    estado: i.estado,
    resuelto_at: i.resueltoAt,
    resuelto_por: i.resueltoPorUser,
  };
}

export interface IncidentesPagina {
  incidentes: Incidente[];
  count: number;
  page: number;
  abiertos: number;
  criticosAbiertos: number;
}

export async function getIncidentes(opts: {
  estado?: Incidente["estado"];
  gravedad?: Incidente["gravedad"];
  pagina?: number;
}): Promise<IncidentesPagina> {
  const { data, meta } = await apiFetch<{
    data: ApiIncidente[];
    meta: { page: number; total: number; abiertos: number; criticos_abiertos: number };
  }>("/v1/incidents", {
    query: {
      estado: opts.estado,
      gravedad: opts.gravedad,
      page: Math.max(1, opts.pagina || 1),
      limit: PAGE_SIZE,
    },
  });
  return {
    incidentes: data.map(toIncidente),
    count: meta.total,
    page: meta.page,
    abiertos: meta.abiertos,
    criticosAbiertos: meta.criticos_abiertos,
  };
}

export async function getIncidente(id: string): Promise<Incidente | null> {
  try {
    const { incidente } = await apiFetch<{ incidente: ApiIncidente }>(`/v1/incidents/${id}`);
    return toIncidente(incidente);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Badge del menú. Nunca rompe el layout: ante cualquier error, 0. */
export async function getIncidentesCriticosAbiertosCount(): Promise<number> {
  try {
    const { meta } = await apiFetch<{ meta: { criticos_abiertos: number } }>("/v1/incidents", {
      query: { estado: "abierto", gravedad: "critica", limit: 1 },
    });
    return meta.criticos_abiertos;
  } catch {
    return 0;
  }
}

// ── Captaciones (CAPTACION-01) ───────────────────────────────────────────────
type ApiCaptacion = {
  id: string;
  operacion: "alquiler";
  tipo: string;
  direccion: string;
  localidad: string | null;
  barrio: string | null;
  datos: unknown;
  mensaje: string;
  autor: { id: string; nombre: string } | null;
  responsable: { id: string; nombre: string } | null;
  createdAt: string;
  updatedAt: string;
};

function toCaptacion(c: ApiCaptacion): Captacion {
  return {
    id: c.id,
    operacion: c.operacion,
    tipo: c.tipo,
    direccion: c.direccion,
    localidad: c.localidad,
    barrio: c.barrio,
    datos: normalizarDatos(c.datos),
    mensaje: c.mensaje,
    autor: { id: c.autor?.id ?? "", nombre: c.autor?.nombre ?? "—" },
    responsable: c.responsable ? { id: c.responsable.id, nombre: c.responsable.nombre } : null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export async function getCaptaciones(filters: { q?: string; mias?: boolean; pagina?: number }) {
  const page = Math.max(1, filters.pagina || 1);
  const { data, meta } = await apiFetch<{
    data: ApiCaptacion[];
    meta: { page: number; limit: number; total: number };
  }>("/v1/captaciones", {
    query: {
      q: filters.q?.trim() || undefined,
      mias: filters.mias ? "true" : undefined,
      page,
      limit: PAGE_SIZE,
    },
  });
  return { items: data.map(toCaptacion), count: meta.total, page: meta.page };
}

export async function getCaptacion(id: string): Promise<Captacion | null> {
  try {
    const { item } = await apiFetch<{ item: ApiCaptacion }>(`/v1/captaciones/${id}`);
    return toCaptacion(item);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}
