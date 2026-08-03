/**
 * Capa de adaptación entre back-lamelas y las pantallas del panel.
 *
 * La API habla camelCase y manda los `numeric` como string (son Decimal en
 * Prisma). Los componentes hablan snake_case y esperan números. Toda esa
 * traducción vive acá: si cambia la API, se toca solo este archivo.
 */

import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import type { PropertyCardData } from "@/components/properties/property-card";
import type {
  ApiKey,
  ApiKeyScope,
  CanalConversacion,
  CanalLead,
  Conversacion,
  ConversacionMensaje,
  EstadoConversacion,
  EstadoLead,
  EstadoPropiedad,
  EstadoUsuario,
  Invitacion,
  Lead,
  LeadDetalle,
  Moneda,
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

export const PAGE_SIZE = 24;

export interface PropertyFilters {
  q?: string;
  operacion?: string;
  tipo?: string;
  estado?: string;
  vendedor?: string;
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
  descripcion: string | null;
  direccion: string | null;
  zona: string | null;
  ciudad: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  supCubierta: string | null;
  supTotal: string | null;
  estado: EstadoPropiedad;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  images?: ApiImage[];
  user?: { id: string; nombre: string } | null;
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
    estado: p.estado,
    zona: p.zona,
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
    descripcion: p.descripcion,
    direccion: p.direccion,
    zona: p.zona,
    ciudad: p.ciudad,
    ambientes: p.ambientes,
    dormitorios: p.dormitorios,
    banios: p.banios,
    sup_cubierta: num(p.supCubierta),
    sup_total: num(p.supTotal),
    estado: p.estado,
    notas: p.notas,
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
const TIPOS = ["casa", "departamento", "terreno", "local", "otro"] as const;
const ESTADOS = ["disponible", "reservada", "vendida"] as const;
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

  const { data, meta } = await apiFetch<ListResponse>(path, {
    query: {
      q: filters.q?.trim(),
      operacion: oneOf(OPERACIONES, filters.operacion),
      tipo: oneOf(TIPOS, filters.tipo),
      estado: oneOf(ESTADOS, filters.estado),
      vendedor: UUID.test(filters.vendedor ?? "") ? filters.vendedor : undefined,
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
  estado: EstadoLead;
  assignedTo: string | null;
  createdAt: string;
  property?: { id: string; titulo: string; operacion?: Operacion; precio?: string } | null;
  assignee?: { id: string; nombre: string } | null;
  notes?: ApiLeadNote[];
}

interface ApiLeadNote {
  id: string;
  nota: string;
  createdAt: string;
  user?: { id: string; nombre: string } | null;
}

function toLead(l: ApiLead): Lead {
  return {
    id: l.id,
    nombre: l.nombre,
    email: l.email,
    telefono: l.telefono,
    mensaje: l.mensaje,
    canal: l.canal,
    estado: l.estado,
    assigned_to: l.assignedTo,
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
  asignado?: string;
  pagina?: number;
}

const ESTADOS_LEAD_VALUES = ["nueva", "en_contacto", "ganada", "perdida"] as const;
const CANALES_VALUES = ["web", "whatsapp", "instagram", "messenger", "manual"] as const;

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
      assigned_to: UUID.test(filters.asignado ?? "") ? filters.asignado : undefined,
      page,
      limit: PAGE_SIZE,
    },
  });

  return { leads: data.map(toLead), count: meta.total, page: meta.page };
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
        created_at: n.createdAt,
      })),
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
    tipo_propiedad: string | null;
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
}

function toConversacion(c: ApiConversacion): Conversacion {
  const zonas = Array.isArray(c.perfil.zonas)
    ? c.perfil.zonas
    : c.perfil.zonas
      ? [c.perfil.zonas]
      : null;

  return {
    id: c.id,
    lead_id: c.lead_id,
    canal: c.canal,
    canal_ref: c.canal_ref,
    estado: c.estado,
    bot_activo: c.bot_activo,
    vendedor_id: c.vendedor_id,
    perfil: { ...c.perfil, zonas },
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

// ── Resumen de la home ───────────────────────────────────────────────────────

export interface Resumen {
  propiedades: Record<EstadoPropiedad, number>;
  consultasNuevas: number;
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

  const [disponible, reservada, vendida, nuevas, consultas, propiedades] = await Promise.all([
    total("disponible"),
    total("reservada"),
    total("vendida"),
    apiFetch<{ meta: { total: number } }>("/v1/leads", {
      query: { ...misConsultas, estado: "nueva", page: 1, limit: 1 },
    }).then((r) => r.meta.total),
    apiFetch<{ data: ApiLead[] }>("/v1/leads", {
      query: { ...misConsultas, page: 1, limit: 5 },
    }),
    apiFetch<ListResponse>(pathPropiedades, { query: { page: 1, limit: 4 } }),
  ]);

  return {
    propiedades: { disponible, reservada, vendida },
    consultasNuevas: nuevas,
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
  const { data } = await apiFetch<ListResponse>("/v1/properties", {
    query: { estado: "disponible", page: 1, limit: 100 },
  });

  return data
    .map((p) => ({ id: p.id, titulo: p.titulo }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
}
