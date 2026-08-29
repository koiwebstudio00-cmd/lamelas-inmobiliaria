// Modelo que consumen los componentes del panel, en snake_case.
// La API (back-lamelas) habla camelCase: la traducción vive en src/lib/queries.ts
// y ningún componente conoce el formato de la API.

export type Operacion = "venta" | "alquiler" | "ambos";
export type TipoPropiedad =
  | "monoambiente"
  | "departamento"
  | "casa"
  | "duplex"
  | "local_comercial"
  | "oficina"
  | "galpon"
  | "estacionamiento"
  | "terreno"
  | "otro";
export type Moneda = "ARS" | "USD";
export type EstadoPropiedad =
  | "disponible"
  | "reservado"
  | "proximamente"
  | "pausado"
  | "vendida"
  | "alquilada"
  | "privado";

// Campos de alquiler (enums de la API). "otro" habilita el texto acompañante.
export type DestinoAlquiler = "vivienda" | "comercial" | "profesional" | "otro";
export type PlazoContrato = "meses_12" | "meses_18" | "meses_24" | "meses_36" | "otro";
export type AjusteAlquiler = "trimestral" | "cuatrimestral" | "otro";
export type IndiceAjuste = "icl" | "ipc" | "fijo";
export type MascotasAlquiler = "se_permiten" | "no_se_permiten" | "sin_especificar";
export type AmobladoAlquiler = "amoblado" | "sin_amoblar" | "sin_especificar";

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
  // operacion=ambos: precio/moneda = venta; estos = alquiler (null si no aplica).
  precio_alquiler: number | null;
  moneda_alquiler: Moneda | null;
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
  destacada: boolean;
  notas: string | null;
  requisitos: string | null;
  // Alquiler (nullable)
  destino: DestinoAlquiler | null;
  plazo_contrato: PlazoContrato | null;
  plazo_otro: string | null;
  ajuste: AjusteAlquiler | null;
  ajuste_otro: string | null;
  indice_ajuste: IndiceAjuste | null;
  indice_fijo_pct: number | null;
  expensas: string | null;
  mascotas: MascotasAlquiler | null;
  amoblado: AmobladoAlquiler | null;
  // Ubicación en el mapa
  lat: number | null;
  lng: number | null;
  link_maps: string | null;
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
  { value: "ambos", label: "Venta y alquiler" },
];

export const TIPOS: { value: TipoPropiedad; label: string }[] = [
  { value: "monoambiente", label: "Monoambiente" },
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "duplex", label: "Dúplex" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "oficina", label: "Oficina" },
  { value: "galpon", label: "Galpón" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "terreno", label: "Terreno" },
  { value: "otro", label: "Otro" },
];

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

export const ESTADOS: { value: EstadoPropiedad; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "reservado", label: "Reservado" },
  { value: "proximamente", label: "Próximamente" },
  { value: "pausado", label: "Pausado" },
  { value: "vendida", label: "Vendida" },
  { value: "alquilada", label: "Alquilada" },
  { value: "privado", label: "Privado (no se publica)" },
];

// ── Opciones de alquiler (etiqueta ↔ valor canónico de la API) ───────────────
export const DESTINOS: { value: DestinoAlquiler; label: string }[] = [
  { value: "vivienda", label: "Vivienda" },
  { value: "comercial", label: "Comercial" },
  { value: "profesional", label: "Profesional" },
  { value: "otro", label: "Otro" },
];

export const PLAZOS: { value: PlazoContrato; label: string }[] = [
  { value: "meses_12", label: "12 meses" },
  { value: "meses_18", label: "18 meses" },
  { value: "meses_24", label: "24 meses" },
  { value: "meses_36", label: "36 meses" },
  { value: "otro", label: "Otro" },
];

export const AJUSTES: { value: AjusteAlquiler; label: string }[] = [
  { value: "trimestral", label: "Trimestral" },
  { value: "cuatrimestral", label: "Cuatrimestral" },
  { value: "otro", label: "Otro" },
];

export const INDICES: { value: IndiceAjuste; label: string }[] = [
  { value: "icl", label: "ICL" },
  { value: "ipc", label: "IPC" },
  { value: "fijo", label: "Fijo (%)" },
];

export const MASCOTAS: { value: MascotasAlquiler; label: string }[] = [
  { value: "se_permiten", label: "Se permiten" },
  { value: "no_se_permiten", label: "No se permiten" },
  { value: "sin_especificar", label: "Sin especificar" },
];

export const AMOBLADO_OPCIONES: { value: AmobladoAlquiler; label: string }[] = [
  { value: "amoblado", label: "Amoblado" },
  { value: "sin_amoblar", label: "Sin amoblar" },
  { value: "sin_especificar", label: "Sin especificar" },
];

// ── CRM: consultas que entran por el sitio público o se cargan a mano ────────

export type EstadoLead = "nueva" | "en_contacto" | "ganada" | "perdida";
export type CanalLead = "web" | "whatsapp" | "instagram" | "messenger" | "manual";
/** Clasificación comercial: cliente potencial vs fantasma (curioso). */
export type ClasificacionLead = "potencial" | "fantasma";

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
  canal_ref: string | null;
  estado: EstadoLead;
  clasificacion: ClasificacionLead | null;
  assigned_to: string | null;
  /** Nombre del vendedor asignado, ya resuelto por la API (null si sin asignar). */
  asignado: string | null;
  tomado_at: string | null;
  tomado_por: string | null;
  tomado_origen: "panel" | "whatsapp_business_app" | "sistema" | null;
  /** Nombre de quien tomó la consulta por primera vez. */
  tomado_por_nombre: string | null;
  propiedad: LeadPropiedad | null;
  created_at: string;
};

export type OrigenNota = "humano" | "agente";

export type LeadNota = {
  id: string;
  nota: string;
  autor: string | null;
  /** Quién la escribió: el equipo (`humano`) o el agente de IA (`agente`). */
  origen: OrigenNota;
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
  tipo_propiedad: string[] | null;
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
/**
 * Canales de mensajería que se pueden conectar por Zernio. Hoy solo WhatsApp:
 * el backend acota el `check` de la columna a propósito, y lo amplía cuando
 * haya pedido explícito de Instagram.
 */
export type ChannelCanal = "whatsapp";

export type ChannelEstado = "activa" | "desconectada" | "error";

/**
 * Una cuenta de mensajería conectada. `display_name` y `display_phone` son un
 * snapshot que guarda el backend al conectar, para no ir a pedirle los datos a
 * Zernio cada vez que se abre la pantalla.
 */
export type ChannelAccount = {
  id: string;
  canal: ChannelCanal;
  display_name: string | null;
  display_phone: string | null;
  estado: ChannelEstado;
  conectada_por: string | null;
  creada_at: string;
  actualizada_at: string;
};

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

export const CLASIFICACIONES: { value: ClasificacionLead; label: string }[] = [
  { value: "potencial", label: "Cliente potencial" },
  { value: "fantasma", label: "Fantasma (curioso)" },
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

// ── Feedback: sugerencias y reportes de error del panel ──────────────────────

export type FeedbackTipo = "sugerencia" | "error";
export type FeedbackEstado = "nuevo" | "en_revision" | "planificada" | "resuelta" | "descartada";

export type FeedbackAutor = { id: string; nombre: string };

export type FeedbackItem = {
  id: string;
  tipo: FeedbackTipo;
  titulo: string;
  descripcion: string;
  estado: FeedbackEstado;
  url_contexto: string | null;
  autor: FeedbackAutor | null;
  adjuntos_count: number;
  comentarios_count: number;
  created_at: string;
  updated_at: string;
};

export type FeedbackAdjunto = { id: string; url: string; orden: number };

export type FeedbackComentario = {
  id: string;
  cuerpo: string;
  autor: string | null;
  created_at: string;
};

export type FeedbackDetalle = FeedbackItem & {
  user_agent: string | null;
  adjuntos: FeedbackAdjunto[];
  comentarios: FeedbackComentario[];
};

export const ESTADOS_FEEDBACK: { value: FeedbackEstado; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_revision", label: "En revisión" },
  { value: "planificada", label: "Planificada" },
  { value: "resuelta", label: "Resuelta" },
  { value: "descartada", label: "Descartada" },
];
