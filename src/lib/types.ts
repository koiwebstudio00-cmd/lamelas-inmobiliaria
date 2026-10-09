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

// ── Analíticas comerciales (cohortes con datos actuales) ────────────────────

export type AnalyticsPeriod = {
  from: string;
  to: string;
  timezone: string;
  /** Período de comparación: mes calendario anterior si el rango es un mes
   * completo; si no, los mismos días inmediatamente antes. */
  previous: { from: string; to: string } | null;
  cohort_definition: string;
};

export type AnalyticsOverview = {
  period: AnalyticsPeriod;
  kpis: {
    leads_created: number;
    leads_taken: number;
    take_rate: number;
    median_take_minutes: number | null;
    nuevas: number;
    en_contacto: number;
    ganadas: number;
    /** Desglose del cierre; ganadas − (venta + alquiler) = sin operación cargada. */
    ganadas_venta: number;
    ganadas_alquiler: number;
    perdidas: number;
    cohort_conversion_rate: number;
    sofia_conversations: number;
    handed_off_conversations: number;
    handoff_rate: number;
    active_properties: number;
    active_properties_without_leads: number;
  };
  previous_kpis: {
    leads_created: number;
    leads_taken: number;
    take_rate: number;
    median_take_minutes: number | null;
    ganadas: number;
    /** Desglose del cierre; ganadas − (venta + alquiler) = sin operación cargada. */
    ganadas_venta: number;
    ganadas_alquiler: number;
    perdidas: number;
    cohort_conversion_rate: number;
    sofia_conversations: number;
    handed_off_conversations: number;
    handoff_rate: number;
  } | null;
};

export type AnalyticsLeads = {
  period: AnalyticsPeriod;
  summary: {
    total: number;
    taken: number;
    untaken: number;
    take_rate: number;
    assigned: number;
    unassigned: number;
    median_take_minutes: number | null;
    p90_take_minutes: number | null;
  };
  previous_summary: {
    total: number;
    taken: number;
    untaken: number;
    take_rate: number;
    median_take_minutes: number | null;
    p90_take_minutes: number | null;
  } | null;
  by_channel: Record<string, number>;
  by_state: Record<string, number>;
  by_classification: Record<string, number>;
  by_property_relation: Record<string, number>;
  by_taken_origin: Record<string, number>;
  pending_by_age: Record<string, number>;
  daily: { date: string; canal: string; count: number }[];
  /** Ranking de propiedades por consultas recibidas en el período — ver
   * DestacarButton, es donde el admin decide qué destacar con este dato. */
  top_properties: {
    property_id: string;
    titulo: string;
    destacada: boolean;
    consultas: number;
  }[];
};

export type AnalyticsSofiaSummary = {
  conversations: number;
  handed_off: number;
  handoff_rate: number;
  median_handoff_take_minutes: number | null;
  lead_messages: number;
  ai_messages: number;
  seller_messages: number;
  median_lead_messages: number | null;
  followed_up: number;
  recovered_by_followup: number;
  recovery_rate: number;
  still_with_bot: number;
};

export type AnalyticsSofia = {
  period: AnalyticsPeriod;
  summary: AnalyticsSofiaSummary;
  previous_summary: AnalyticsSofiaSummary | null;
  by_handoff_result: Record<string, number>;
  by_temperature: Record<string, number>;
  by_intent: Record<string, number>;
  by_classification: Record<string, number>;
  /** 24 filas (hora 0–23, zona horaria de Tucumán). */
  by_hour: { bucket: number; count: number }[];
  /** 7 filas (1 = lunes … 7 = domingo). */
  by_weekday: { bucket: number; count: number }[];
};

export type AnalyticsPropertiesSummary = {
  created: number;
  leads_with_property: number;
  properties_with_leads: number;
  available_without_leads: number;
};

export type AnalyticsProperties = {
  period: AnalyticsPeriod;
  summary: AnalyticsPropertiesSummary & { available: number };
  previous_summary: AnalyticsPropertiesSummary | null;
  inventory_by_state: Record<string, number>;
  available_by_type: Record<string, number>;
  leads_by_type: Record<string, number>;
  leads_by_operation: Record<string, number>;
  demand_by_zone: { zona: string; consultas: number; disponibles: number }[];
  searched_zones: Record<string, number>;
  searched_types: Record<string, number>;
  top_properties: AnalyticsLeads["top_properties"];
  idle_properties: {
    property_id: string;
    titulo: string;
    zona: string | null;
    operacion: string;
    tipo: string;
    created_at: string;
    days_published: number;
  }[];
};

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
  punto_referencia: string | null;
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
  /** Edificio al que pertenece la unidad (null = propiedad suelta). */
  edificio: { id: string; nombre: string } | null;
  /** Cómo se distingue la unidad dentro del edificio ("3° B"). */
  unidad: string | null;
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

/**
 * Valor centinela del `<select>` de zona para habilitar el input libre. No se
 * guarda nunca: cuando está elegido, el campo `zona` que viaja al servidor es el
 * del input de texto.
 */
export const OTRA_ZONA = "__otra__";

/**
 * Sugerencias para el campo Ciudad. NO es una lista cerrada: el input acepta
 * cualquier texto (hay propiedades en localidades sueltas). Sirve para que
 * nadie escriba la misma ciudad de dos formas distintas.
 *
 * Curada a partir de las ciudades que ya aparecen en los datos, ya
 * normalizadas — a propósito NO se alimenta de los valores crudos de la base,
 * que es donde viven "Capital", "Tucuman" y "San Miguel".
 */
export const CIUDADES = [
  "San Miguel de Tucumán",
  "Yerba Buena",
  "Tafí Viejo",
  "Las Talitas",
  "Alderetes",
  "La Banda del Río Salí",
  "Lules",
  "El Manantial",
  "San Pablo",
  "Los Nogales",
  "Villa Carmela",
  "Raco",
  "San Pedro de Colalao",
  "El Cadillal",
  "Tafí del Valle",
  "Monteros",
  "Concepción",
  "Aguilares",
  "Bella Vista",
  "Famaillá",
  "La Cocha",
  "Termas de Río Hondo",
  "Salta",
] as const;

export const ZONAS = [
  "Barrio Norte",
  "Barrio Sur",
  "Microcentro",
  "Parque 9 de Julio",
  "Parque Avellaneda",
  "Ciudadela",
  "Villa 9 de Julio",
  "Villa Luján",
  "Zona Abasto",
  "Zona Quinta Agronómica",
  "Parque Guillermina",
  "Zona Portal",
  "Las Talitas",
  "Lomas de Tafí",
  "Tafí Viejo",
  "Yerba Buena",
  "La Banda del Río Salí",
  "Alderetes",
  "San Pablo",
  "Lules",
  "Monteros",
  "Concepción",
] as const;

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

/** Qué se concretó en una consulta ganada. */
export type OperacionCierre = "venta" | "alquiler";

/** Cómo le fue al vendedor al contactar la consulta. */
export type AvanceResultado =
  | "sin_respuesta"
  | "en_conversacion"
  | "visita_agendada"
  | "visita_realizada"
  | "en_negociacion"
  | "no_interesado";

export type LeadAvance = {
  id: string;
  resultado: AvanceResultado;
  comentario: string | null;
  autor: string | null;
  created_at: string;
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
  /** Solo en ganadas: venta o alquiler (null = todavía sin indicar). */
  operacion_cierre: OperacionCierre | null;
  /** Solo en ganadas: la propiedad con la que se cerró. */
  propiedad_cierre: { id: string; titulo: string } | null;
  cerrado_at: string | null;
  /** Último avance que cargó el vendedor (null = nunca cargó). */
  ultimo_avance: Pick<LeadAvance, "resultado" | "comentario" | "created_at"> | null;
  /** true = abierta y sin novedades hace rato: toca contar cómo le fue. */
  avance_pendiente: boolean;
  clasificacion: ClasificacionLead | null;
  derivacion: DerivacionLead | null;
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

export type OrigenNota = "humano" | "agente" | "sistema";

export type LeadNota = {
  id: string;
  nota: string;
  autor: string | null;
  /**
   * Quién la escribió: el equipo (`humano`), el agente de IA (`agente`) o la
   * plataforma (`sistema`: registro automático, hoy las reasignaciones).
   */
  origen: OrigenNota;
  created_at: string;
};

export type LeadDetalle = Lead & {
  /** Nombre del vendedor asignado, ya resuelto por la API. */
  asignado: string | null;
  notas: LeadNota[];
  /** Historial de avances, del más nuevo al más viejo. */
  avances: LeadAvance[];
};

// ── Notificaciones internas (campanita) ──────────────────────────────────────

export type TipoNotificacion =
  | "lead_nuevo"
  | "lead_asignado"
  | "lead_quitado"
  | "avance_pendiente"
  | "feedback_error"
  | "incidente"
  | "incidente_resuelto";

/** `alta`: incidente crítico del agente. Se destaca y se fija arriba. */
export type PrioridadNotificacion = "normal" | "alta";

export type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  /** Ruta del panel a la que lleva; null si ya no se puede abrir. */
  link: string | null;
  prioridad: PrioridadNotificacion;
  leida_at: string | null;
  created_at: string;
};

// ── Incidentes del agente (solo admin) ───────────────────────────────────────

export type IncidenteTipo =
  | "n8n_ejecucion"
  | "n8n_sin_respuesta"
  | "n8n_sin_senal"
  | "whatsapp_desconectado";
export type IncidenteGravedad = "normal" | "critica";
export type IncidenteEstado = "abierto" | "resuelto";

export type Incidente = {
  id: string;
  tipo: IncidenteTipo;
  gravedad: IncidenteGravedad;
  titulo: string;
  detalle: string | null;
  workflow: string | null;
  nodo: string | null;
  execution_id: string | null;
  /** Link a la ejecución en n8n (pide iniciar sesión en n8n). */
  execution_url: string | null;
  ocurrencias: number;
  primera_at: string;
  ultima_at: string;
  estado: IncidenteEstado;
  resuelto_at: string | null;
  /** Null con `resuelto_at` cargado: se resolvió solo. */
  resuelto_por: { id: string; nombre: string } | null;
};

// ── Edificios ────────────────────────────────────────────────────────────────

export type Edificio = {
  id: string;
  nombre: string;
  /** Cantidad de propiedades (unidades) vinculadas. */
  unidades: number;
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

export const OPERACIONES_CIERRE: { value: OperacionCierre; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

/**
 * Resultados de un avance, en el orden en que se ofrecen. `no_interesado`
 * cierra la consulta como perdida (lo hace la API).
 */
export const AVANCE_RESULTADOS: { value: AvanceResultado; label: string }[] = [
  { value: "sin_respuesta", label: "No contestó" },
  { value: "en_conversacion", label: "Hablamos, sigue interesado" },
  { value: "visita_agendada", label: "Visita agendada" },
  { value: "visita_realizada", label: "Visita realizada" },
  { value: "en_negociacion", label: "En negociación" },
  { value: "no_interesado", label: "No le interesa" },
];

export const AVANCE_LABELS = Object.fromEntries(
  AVANCE_RESULTADOS.map((r) => [r.value, r.label])
) as Record<AvanceResultado, string>;

/** Motivos con los que Sofía deriva a un humano (contrato del agente). */
export type MotivoDerivacion =
  | "visita"
  | "reserva"
  | "tasacion"
  | "pedido_humano"
  | "fuera_de_alcance";

export const MOTIVOS_DERIVACION: Record<MotivoDerivacion, string> = {
  visita: "Quiere visitar",
  reserva: "Quiere reservar",
  tasacion: "Tasación / quiere vender",
  pedido_humano: "Pidió hablar con alguien",
  fuera_de_alcance: "Fuera de alcance",
};

/** Última derivación del lead; `pendiente` = nadie la tomó todavía. */
export interface DerivacionLead {
  motivo: MotivoDerivacion;
  pendiente: boolean;
  asignado_at: string;
}

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
