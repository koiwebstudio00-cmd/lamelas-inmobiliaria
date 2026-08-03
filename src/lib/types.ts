// Modelo que consumen los componentes del panel, en snake_case.
// La API (back-lamelas) habla camelCase: la traducción vive en src/lib/queries.ts
// y ningún componente conoce el formato de la API.

export type Operacion = "venta" | "alquiler";
export type TipoPropiedad = "casa" | "departamento" | "terreno" | "local" | "otro";
export type Moneda = "ARS" | "USD";
export type EstadoPropiedad = "disponible" | "reservada" | "vendida";

export type Rol = "super_admin" | "admin" | "agente";

export type Tenant = {
  id: string;
  nombre: string;
  slug: string;
}

/** Lo que devuelve GET /v1/auth/me. Ojo: ahi la API no manda created_at. */
export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  tenantId: string;
  tenant: Tenant | null;
}

export type UserProfile = {
  id: string;
  tenant_id: string;
  nombre: string;
  email: string;
  created_at: string;
}

export type Property = {
  id: string;
  tenant_id: string;
  user_id: string;
  titulo: string;
  operacion: Operacion;
  tipo: TipoPropiedad;
  precio: number;
  moneda: Moneda;
  descripcion: string | null;
  direccion: string | null;
  zona: string | null;
  ciudad: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  sup_cubierta: number | null;
  sup_total: number | null;
  estado: EstadoPropiedad;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  es_portada: boolean;
  orden: number;
  created_at: string;
}

// Constantes para UI
export const OPERACIONES: { value: Operacion; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

export const TIPOS: { value: TipoPropiedad; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "terreno", label: "Terreno" },
  { value: "local", label: "Local" },
  { value: "otro", label: "Otro" },
];

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

export const ESTADOS: { value: EstadoPropiedad; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];

// ── CRM: consultas que entran por el sitio público o se cargan a mano ────────

export type EstadoLead = "nueva" | "en_contacto" | "ganada" | "perdida";
export type CanalLead = "web" | "whatsapp" | "instagram" | "messenger" | "manual";

/** Propiedad por la que consultaron. La API manda solo lo mínimo para el link. */
export type LeadPropiedad = {
  id: string;
  titulo: string;
  operacion?: Operacion;
  precio?: number;
};

export type Lead = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  mensaje: string;
  canal: CanalLead;
  estado: EstadoLead;
  assigned_to: string | null;
  propiedad: LeadPropiedad | null;
  created_at: string;
};

export type LeadNota = {
  id: string;
  nota: string;
  autor: string | null;
  created_at: string;
};

export type LeadDetalle = Lead & {
  /** Nombre del vendedor asignado, ya resuelto por la API. */
  asignado: string | null;
  notas: LeadNota[];
};

// ── Agente de IA: conversaciones ─────────────────────────────────────────────
// Ojo: estos endpoints (`/v1/conversations/*`) ya devuelven snake_case, a
// diferencia del resto de la API. La adaptación en queries.ts es casi identidad,
// pero pasa por ahí igual para que ningún componente dependa del formato crudo.

export type EstadoConversacion = "bot" | "esperando_humano" | "humano" | "cerrada";
export type CanalConversacion = "whatsapp" | "web";
export type RolMensaje = "lead" | "agente_ia" | "vendedor" | "sistema";
export type TipoMensaje = "texto" | "audio" | "imagen" | "documento" | "plantilla";

/** Lo que el agente fue infiriendo de lo que busca el lead. Todo opcional. */
export type PerfilConversacion = {
  intencion: string | null;
  tipo_propiedad: string | null;
  ciudad: string | null;
  zonas: string[] | null;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  moneda: Moneda | null;
  dormitorios_min: number | null;
  property_id: string | null;
  temperatura: string | null;
};

export type Conversacion = {
  id: string;
  lead_id: string;
  canal: CanalConversacion;
  canal_ref: string;
  estado: EstadoConversacion;
  bot_activo: boolean;
  vendedor_id: string | null;
  perfil: PerfilConversacion;
  resumen_at: string | null;
  creada_at: string;
};

export type ConversacionMensaje = {
  id: string;
  rol: RolMensaje;
  tipo: TipoMensaje;
  contenido: string;
  media_url: string | null;
  creado_at: string;
};

export const ESTADOS_CONVERSACION: { value: EstadoConversacion; label: string }[] = [
  { value: "bot", label: "Atiende el bot" },
  { value: "esperando_humano", label: "Esperando que la tomen" },
  { value: "humano", label: "La tomó un vendedor" },
  { value: "cerrada", label: "Cerrada" },
];

// ── Equipo ───────────────────────────────────────────────────────────────────

export type EstadoUsuario = "activo" | "inactivo";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
  created_at: string;
};

/** Invitación pendiente: la API solo lista las no aceptadas y sin vencer. */
export type Invitacion = {
  id: string;
  email: string;
  rol: Rol;
  expira: string;
  created_at: string;
};

// ── Integraciones ────────────────────────────────────────────────────────────

/**
 * Permisos de una key de integración. La lista la manda el backend
 * (`lib/scopes.ts`); acá se replica solo la unión porque TypeScript la necesita
 * en tiempo de compilación. Las etiquetas NO se duplican: salen del catálogo
 * `GET /v1/integrations/scopes` (ver `getApiKeyScopes` en queries.ts).
 */
export type ApiKeyScope = "export:read" | "agent:read" | "agent:write";

/** Una opción del catálogo de scopes, tal como la sirve la API. */
export type ScopeOption = { scope: ApiKeyScope; label: string };

/**
 * Key de un sistema externo: hoy el sitio público (`export:read`) y el agente
 * de IA (`agent:read` + `agent:write`). La key completa se ve una sola vez, al
 * crearla: en la base queda solo el hash y el prefijo.
 */
export type ApiKey = {
  id: string;
  nombre: string;
  prefix: string;
  scopes: ApiKeyScope[];
  last_used_at: string | null;
  created_at: string;
};

// Constantes para UI

export const ESTADOS_LEAD: { value: EstadoLead; label: string }[] = [
  { value: "nueva", label: "Nueva" },
  { value: "en_contacto", label: "En contacto" },
  { value: "ganada", label: "Ganada" },
  { value: "perdida", label: "Perdida" },
];

export const CANALES: { value: CanalLead; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
  { value: "manual", label: "Carga manual" },
];

export const ROLES: { value: "admin" | "agente"; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "agente", label: "Vendedor" },
];
