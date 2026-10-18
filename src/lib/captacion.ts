/**
 * Captación de alquileres (CAPTACION-01): opciones, reglas y armado del
 * mensaje. Replica el formulario que el equipo usaba en Netlify
 * (formularioalquilerlyc) y el mensaje que pegaban en el grupo de WhatsApp.
 * Es código puro: lo usan el formulario (validación por paso) y la Server
 * Action (validación completa antes de guardar).
 */

export const TIPOS_INMUEBLE = [
  "Casa",
  "Departamento",
  "Dúplex",
  "Local comercial",
  "Oficina",
  "Galpón / Depósito",
  "Cochera",
  "Quinta / Country",
  "Terreno / Lote",
] as const;
export type TipoInmueble = (typeof TIPOS_INMUEBLE)[number];

export const LOCALIDADES = [
  "San Miguel de Tucumán",
  "Yerba Buena",
  "Tafí Viejo",
  "Las Talitas",
  "Alderetes",
  "Banda del Río Salí",
  "El Manantial",
  "Lules",
  "Famaillá",
  "Tafí del Valle",
  "Otra",
] as const;

export const BARRIOS = [
  "Centro",
  "Barrio Norte",
  "Barrio Sur",
  "Villa Luján",
  "Villa 9 de Julio",
  "Barrio Jardín",
  "Ciudadela",
  "El Bajo",
  "Parque Guillermina",
  "Lomas de Tafí",
  "Barrio Sarmiento",
  "San Cayetano",
  "Otro",
] as const;

export const COCHERA = ["No tiene", "1 auto", "2 autos", "3 o más"] as const;

export const AMBIENTES = [
  "Cocina",
  "Kitchenette",
  "Comedor",
  "Comedor diario",
  "Living",
  "Living-comedor",
  "Toilet",
  "Lavadero",
  "Escritorio",
  "Dep. de servicio",
  "Vestidor",
  "Placards",
  "Altillo",
  "Sótano",
  "Baulera",
] as const;

export const COMODIDADES = [
  "Balcón",
  "Terraza",
  "Patio",
  "Jardín",
  "Galería",
  "Quincho",
  "Parrilla",
  "Pileta",
  "Ascensor",
  "Seguridad 24 h",
  "Portero",
] as const;

export const SERVICIOS = [
  "Agua corriente",
  "Energía eléctrica",
  "Cloacas",
  "Internet",
  "Gas natural",
  "Gas envasado",
  "Todo eléctrico",
] as const;

export const AMOBLADO = ["Sí", "No", "Semiamoblado"] as const;
export const SI_NO_CONVENIR = ["Sí", "No", "A convenir"] as const;

export const PLAZOS = ["12 meses", "24 meses", "36 meses", "Otro — indicar meses", "A convenir"] as const;
export const INDICES = [
  "ICL (BCRA)",
  "IPC (INDEC)",
  "Casa Propia",
  "Porcentaje fijo pactado",
  "Otro — detallar",
  "A convenir con el propietario",
] as const;
export const FRECUENCIAS = ["Trimestral", "Cuatrimestral", "Semestral", "Anual", "Otro — indicar meses"] as const;
export const GARANTIAS = ["Solicitante y garante con recibo de sueldo", "Especial — detallar"] as const;
export const DEPOSITOS = ["Sin depósito", "1 mes", "2 meses", "En dólares — indicar monto", "Otra — detallar"] as const;
export const DISPONIBILIDAD = [
  "Disponible — ingreso inmediato",
  "Se puede mostrar a partir del…",
  "Alquilado, se desocupa el…",
  "A convenir con el propietario",
] as const;
export const LLAVES = [
  "En la oficina",
  "Con el propietario",
  "Con el inquilino",
  "Con el encargado",
  "Sin llaves aún",
] as const;
export const PUBLICACION = ["Se puede publicar", "No publicar — solo ofrecer"] as const;

/** Todo como texto (así llega de los inputs); los checks, como listas. */
export interface CaptacionDatos {
  responsable_id: string;
  tipo: string;
  calle: string;
  piso_depto: string;
  localidad: string;
  localidad_otra: string;
  barrio: string;
  barrio_otro: string;
  referencia: string;
  dormitorios: string;
  banos: string;
  m2_cubiertos: string;
  m2_terreno: string;
  cochera: string;
  cochera_cubierta: boolean;
  medidas_lote: string;
  ambientes: string[];
  comodidades: string[];
  servicios: string[];
  amoblado: string;
  mascotas: string;
  ninos: string;
  precio: string;
  moneda: "ARS" | "USD";
  expensas: string;
  plazo: string;
  plazo_otro: string;
  indice: string;
  indice_otro: string;
  frecuencia: string;
  frecuencia_otro: string;
  garantia: string;
  garantia_detalle: string;
  deposito: string;
  deposito_usd: string;
  deposito_otro: string;
  disponibilidad: string;
  disponibilidad_fecha: string;
  llaves: string;
  visitas: string;
  publicacion: string;
  observaciones: string;
}

export const DATOS_VACIOS: CaptacionDatos = {
  responsable_id: "",
  tipo: "",
  calle: "",
  piso_depto: "",
  localidad: "",
  localidad_otra: "",
  barrio: "",
  barrio_otro: "",
  referencia: "",
  dormitorios: "",
  banos: "",
  m2_cubiertos: "",
  m2_terreno: "",
  cochera: "",
  cochera_cubierta: false,
  medidas_lote: "",
  ambientes: [],
  comodidades: [],
  servicios: [],
  amoblado: "",
  mascotas: "",
  ninos: "",
  precio: "",
  moneda: "ARS",
  expensas: "",
  plazo: "",
  plazo_otro: "",
  indice: "",
  indice_otro: "",
  frecuencia: "",
  frecuencia_otro: "",
  garantia: "",
  garantia_detalle: "",
  deposito: "",
  deposito_usd: "",
  deposito_otro: "",
  disponibilidad: "",
  disponibilidad_fecha: "",
  llaves: "",
  visitas: "",
  publicacion: "",
  observaciones: "",
};

/** Completa con los valores por defecto lo que falte (datos guardados de antes). */
export function normalizarDatos(raw: unknown): CaptacionDatos {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<CaptacionDatos>;
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const out = { ...DATOS_VACIOS } as Record<string, unknown>;
  for (const k of Object.keys(DATOS_VACIOS) as (keyof CaptacionDatos)[]) {
    const v = d[k];
    if (Array.isArray(DATOS_VACIOS[k])) out[k] = lista(v);
    else if (typeof DATOS_VACIOS[k] === "boolean") out[k] = v === true;
    else if (typeof v === "string" || typeof v === "number") out[k] = String(v);
  }
  if (out.moneda !== "USD") out.moneda = "ARS";
  return out as unknown as CaptacionDatos;
}

// ── Qué campos aplican a cada tipo ──────────────────────────────────────────
// El formulario original no publica sus reglas: estas salen del sentido de
// cada campo (un terreno no tiene dormitorios, una cochera no tiene ambientes).

const VIVIENDA = ["Casa", "Departamento", "Dúplex", "Quinta / Country"];
const CON_TERRENO = ["Casa", "Dúplex", "Quinta / Country", "Galpón / Depósito", "Terreno / Lote"];
const EN_EDIFICIO = ["Departamento", "Oficina", "Local comercial"];

export function aplica(tipo: string) {
  const vivienda = VIVIENDA.includes(tipo);
  const sinConstruccion = tipo === "Terreno / Lote";
  const esCochera = tipo === "Cochera";
  return {
    dormitorios: vivienda,
    banos: !sinConstruccion && !esCochera,
    m2_cubiertos: !sinConstruccion,
    terreno: CON_TERRENO.includes(tipo),
    cochera: !sinConstruccion && !esCochera,
    cochera_cubierta: EN_EDIFICIO.includes(tipo),
    ambientes: !sinConstruccion && !esCochera,
    ambientes_obligatorio: vivienda || tipo === "Oficina" || tipo === "Local comercial",
    comodidades: !sinConstruccion && !esCochera,
    servicios: !esCochera,
    vivienda,
  };
}

// ── Validación por paso ─────────────────────────────────────────────────────

export const PASOS = [
  { titulo: "Propiedad", subtitulo: "Tipo y dirección exacta." },
  { titulo: "Características", subtitulo: "Marcá todo lo que tiene. Lo que no marcás, el cliente lo pregunta después." },
  { titulo: "Condiciones", subtitulo: "Sin moneda declarada el precio no sirve. Es obligatorio." },
  { titulo: "Llaves y visitas", subtitulo: "Cómo se accede a la propiedad para mostrarla." },
] as const;

export type Errores = Partial<Record<keyof CaptacionDatos, string>>;

const vacio = (v: string) => v.trim() === "";
const noNumero = (v: string) => vacio(v) || !/^\d+([.,]\d+)?$/.test(v.trim());

export function validarPaso(d: CaptacionDatos, paso: number): Errores {
  const e: Errores = {};
  const a = aplica(d.tipo);
  if (paso === 0) {
    if (vacio(d.responsable_id)) e.responsable_id = "Elegí el responsable.";
    if (vacio(d.tipo)) e.tipo = "Elegí el tipo de inmueble.";
    if (vacio(d.calle)) e.calle = "Cargá calle y altura.";
    if (vacio(d.localidad)) e.localidad = "Elegí la localidad.";
    if (d.localidad === "Otra" && vacio(d.localidad_otra)) e.localidad_otra = "Escribí el nombre de la localidad.";
    if (vacio(d.barrio)) e.barrio = "Cargá el barrio.";
    if (d.barrio === "Otro" && vacio(d.barrio_otro)) e.barrio_otro = "Escribí el barrio.";
  }
  if (paso === 1) {
    if (a.dormitorios && noNumero(d.dormitorios)) e.dormitorios = "Falta.";
    if (a.banos && noNumero(d.banos)) e.banos = "Falta.";
    if (a.m2_cubiertos && noNumero(d.m2_cubiertos)) e.m2_cubiertos = "Falta.";
    if (a.terreno && noNumero(d.m2_terreno)) e.m2_terreno = "Falta.";
    if (a.terreno && vacio(d.medidas_lote)) e.medidas_lote = "Cargá las medidas.";
    if (a.cochera && vacio(d.cochera)) e.cochera = "Falta.";
    if (a.ambientes_obligatorio && d.ambientes.length === 0) e.ambientes = "Marcá al menos un ambiente.";
    if (a.servicios && d.servicios.length === 0) e.servicios = "Marcá al menos un servicio.";
    if (a.vivienda) {
      if (vacio(d.amoblado)) e.amoblado = "Falta.";
      if (vacio(d.mascotas)) e.mascotas = "Falta.";
      if (vacio(d.ninos)) e.ninos = "Falta.";
    }
  }
  if (paso === 2) {
    if (noNumero(d.precio)) e.precio = "Cargá precio y moneda.";
    if (noNumero(d.expensas)) e.expensas = "Cargá el monto (0 si no tiene).";
    if (vacio(d.plazo)) e.plazo = "Falta el plazo.";
    if (d.plazo.startsWith("Otro") && noNumero(d.plazo_otro)) e.plazo_otro = "Escribí la cantidad de meses.";
    if (vacio(d.indice)) e.indice = "Falta el índice.";
    if (d.indice.startsWith("Otro") && vacio(d.indice_otro)) e.indice_otro = "Detallá la actualización.";
    if (vacio(d.frecuencia)) e.frecuencia = "Falta.";
    if (d.frecuencia.startsWith("Otro") && noNumero(d.frecuencia_otro)) e.frecuencia_otro = "Escribí cada cuántos meses.";
    if (vacio(d.garantia)) e.garantia = "Elegí el tipo de garantía.";
    if (d.garantia.startsWith("Especial") && vacio(d.garantia_detalle)) e.garantia_detalle = "Detallá qué pide el propietario.";
    if (vacio(d.deposito)) e.deposito = "Falta.";
    if (d.deposito.startsWith("En dólares") && noNumero(d.deposito_usd)) e.deposito_usd = "Escribí el monto en dólares.";
    if (d.deposito.startsWith("Otra") && vacio(d.deposito_otro)) e.deposito_otro = "Detallá el depósito.";
    if (vacio(d.disponibilidad)) e.disponibilidad = "Indicá la disponibilidad.";
    if (d.disponibilidad.endsWith("…") && vacio(d.disponibilidad_fecha)) e.disponibilidad_fecha = "Elegí la fecha.";
  }
  if (paso === 3) {
    if (vacio(d.llaves)) e.llaves = "Indicá dónde están las llaves.";
    if (vacio(d.visitas)) e.visitas = "Cargá cómo se visita.";
    if (vacio(d.publicacion)) e.publicacion = "Indicá si se puede publicar.";
  }
  return e;
}

/** Valida los cuatro pasos; devuelve el primero con errores o null. */
export function primerPasoConErrores(d: CaptacionDatos): { paso: number; errores: Errores } | null {
  for (let paso = 0; paso < PASOS.length; paso++) {
    const errores = validarPaso(d, paso);
    if (Object.keys(errores).length > 0) return { paso, errores };
  }
  return null;
}

// ── Mensaje para el grupo ───────────────────────────────────────────────────

const miles = (n: number) => Math.round(n).toLocaleString("es-AR");
const numero = (v: string) => Number(v.trim().replace(/\./g, "").replace(",", "."));

function monto(v: string, moneda: "ARS" | "USD") {
  const n = numero(v);
  return moneda === "USD" ? `USD ${miles(n)}` : `$${miles(n)}`;
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const lista = (items: string[]) => items.map(minuscula).join(", ");

function fecha(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function direccionCompleta(d: CaptacionDatos) {
  return [d.calle.trim(), d.piso_depto.trim()].filter(Boolean).join(", ");
}
export const localidadDe = (d: CaptacionDatos) => (d.localidad === "Otra" ? d.localidad_otra.trim() : d.localidad);
export const barrioDe = (d: CaptacionDatos) => (d.barrio === "Otro" ? d.barrio_otro.trim() : d.barrio);

function contrato(d: CaptacionDatos) {
  const plazo = d.plazo.startsWith("Otro") ? `${d.plazo_otro.trim()} meses` : d.plazo === "A convenir" ? "a convenir" : d.plazo;
  const indice = d.indice.startsWith("Otro")
    ? d.indice_otro.trim()
    : d.indice === "A convenir con el propietario"
      ? "índice a convenir"
      : d.indice;
  const frecuencia = d.frecuencia.startsWith("Otro") ? `cada ${d.frecuencia_otro.trim()} meses` : minuscula(d.frecuencia);
  return `${plazo} · ${indice} (${frecuencia})`;
}

function deposito(d: CaptacionDatos) {
  if (d.deposito.startsWith("En dólares")) return `USD ${miles(numero(d.deposito_usd))}`;
  if (d.deposito.startsWith("Otra")) return d.deposito_otro.trim();
  return d.deposito;
}

function disponibilidad(d: CaptacionDatos) {
  if (d.disponibilidad === "Se puede mostrar a partir del…") return `Se puede mostrar a partir del ${fecha(d.disponibilidad_fecha)}`;
  if (d.disponibilidad === "Alquilado, se desocupa el…") return `Alquilado, se desocupa el ${fecha(d.disponibilidad_fecha)}`;
  return d.disponibilidad;
}

/**
 * Arma el mensaje con el mismo formato que el formulario de Netlify: negritas
 * de WhatsApp en los datos, separador y el cierre operativo sin negrita.
 */
export function armarMensaje(d: CaptacionDatos, responsable: string): string {
  const a = aplica(d.tipo);
  const b = (s: string) => `*${s}*`;
  const out: string[] = [];

  out.push(b(`ALQUILER · ${d.tipo.toUpperCase()}`));
  const ubicacion = [barrioDe(d), localidadDe(d)].filter(Boolean).join(", ");
  out.push(b(`📍 ${direccionCompleta(d)}${ubicacion ? ` — ${ubicacion}` : ""}`));
  if (d.referencia.trim()) out.push(b(`🧭 Ref.: ${d.referencia.trim()}`));
  out.push("");

  out.push(b(`💲 Precio: ${monto(d.precio, d.moneda)}`));
  out.push(b(`➕ Expensas: ${numero(d.expensas) > 0 ? monto(d.expensas, "ARS") : "no tiene"}`));
  out.push(b(`📆 Contrato: ${contrato(d)}`));
  out.push(b(`🔐 Depósito en garantía: ${deposito(d)}`));
  out.push(b(`📋 Garantías: ${d.garantia.startsWith("Especial") ? d.garantia_detalle.trim() : d.garantia}`));
  out.push("");

  const banos = numero(d.banos);
  const dormBanos = [
    a.dormitorios ? `${numero(d.dormitorios)} dorm.` : "",
    a.banos ? `${banos} ${banos === 1 ? "baño" : "baños"}` : "",
  ].filter(Boolean);
  if (dormBanos.length) out.push(b(`${a.dormitorios ? "🛏" : "🚿"} ${dormBanos.join(" · ")}`));

  const superficie = [
    a.m2_cubiertos ? `${numero(d.m2_cubiertos)} m² cubiertos` : "",
    a.terreno ? `${numero(d.m2_terreno)} m² de terreno` : "",
    a.terreno && d.medidas_lote.trim() ? `lote ${d.medidas_lote.trim()}` : "",
  ].filter(Boolean);
  if (superficie.length) out.push(b(`📐 ${superficie.join(" · ")}`));

  if (a.cochera) {
    const cubierta = a.cochera_cubierta && d.cochera_cubierta && d.cochera !== "No tiene" ? " (cubierta en edificio)" : "";
    out.push(b(`🚗 Cochera: ${d.cochera}${cubierta}`));
  }
  if (a.ambientes && d.ambientes.length) out.push(b(`🏠 Ambientes: ${lista(d.ambientes)}`));
  if (a.comodidades && d.comodidades.length) out.push(b(`🌿 Además: ${lista(d.comodidades)}`));
  if (a.servicios && d.servicios.length) out.push(b(`⚙️ Servicios: ${lista(d.servicios)}`));
  if (a.vivienda) out.push(b(`🪑 Amoblado: ${d.amoblado}`));

  if (d.observaciones.trim()) {
    out.push("");
    out.push(b(`📝 ${d.observaciones.trim()}`));
  }
  out.push("--------------------------------");
  out.push(`🗓 ${disponibilidad(d)}`);
  if (a.vivienda) out.push(`🐾 Mascotas: ${d.mascotas} · 👶 Niños: ${d.ninos}`);
  out.push(`🗝 Llaves: ${d.llaves}`);
  out.push(`👁 Visitas: ${d.visitas.trim()}`);
  if (d.publicacion === "No publicar — solo ofrecer") out.push("📣 No publicar — solo ofrecer");
  out.push(`👤 Responsable: ${responsable}`);
  return out.join("\n");
}

/** Link que abre WhatsApp con el texto listo para elegir el grupo. */
export const linkWhatsApp = (mensaje: string) => `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
