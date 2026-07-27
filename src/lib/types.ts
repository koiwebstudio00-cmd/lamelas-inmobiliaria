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

// ── Sitio público ────────────────────────────────────────────────────────────

/**
 * Key de lectura que usa lamelas-web. La key completa se ve una sola vez, al
 * crearla: en la base queda solo el hash y el prefijo.
 */
export type ApiKey = {
  id: string;
  nombre: string;
  prefix: string;
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
