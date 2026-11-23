import { z } from "zod";
import { AMBIENTES_LISTA, COMODIDADES, SERVICIOS } from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optionalInt = z
  .union([z.literal(""), z.coerce.number().int().min(0, "Debe ser ≥ 0")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optionalDecimal = z
  .union([z.literal(""), z.coerce.number().min(0, "Debe ser ≥ 0")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

// Un enum que además acepta "" (nada elegido) → null. Los selects de alquiler
// arrancan vacíos y se pueden dejar sin completar.
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.literal(""), z.enum(values)])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

// Coordenada opcional: "" → null, con rango válido.
const optionalCoord = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().min(min).max(max)])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

// Sin monoambiente: es un departamento con 0 dormitorios (FORM-UNICO-01).
const TIPOS_VALUES = [
  "departamento",
  "casa",
  "duplex",
  "quinta",
  "local_comercial",
  "oficina",
  "galpon",
  "estacionamiento",
  "terreno",
  "otro",
] as const;

const ESTADOS_VALUES = [
  "disponible",
  "reservado",
  "proximamente",
  "pausado",
  "vendida",
  "alquilada",
  "privado",
  "borrador",
] as const;

// Casillas: llegan como lista (FormData.getAll) y se validan contra la lista
// cerrada de la API.
const casillas = <T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).optional();

const optionalDate = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí una fecha válida.")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

// Para guardar alcanzan título, operación, tipo y precio. Lo que hace falta
// para PUBLICAR lo valida la API (completitud, 422 INCOMPLETE); el formulario
// solo guía con la copia de src/lib/completitud.ts.
export const propertySchema = z.object({
  // Qué botón se tocó: "publicar" (o "Guardar cambios") o "borrador".
  intent: z.enum(["publicar", "borrador"]).default("publicar"),
  // Responsable: solo lo manda el form del admin. La API lo vuelve a validar.
  user_id: z.union([z.literal(""), z.string().uuid()]).transform((v) => (v === "" ? undefined : v)).optional(),
  titulo: z.string().trim().min(3, "El título es obligatorio (mín. 3 caracteres)"),
  operacion: z.enum(["venta", "alquiler", "ambos"], { message: "Elegí la operación" }),
  tipo: z.enum(TIPOS_VALUES, { message: "Elegí el tipo de propiedad" }),
  precio: z.coerce
    .number({ message: "Ingresá un precio válido" })
    .min(0, "El precio no puede ser negativo"),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  // Precio de alquiler: se usa cuando operacion=ambos (precio = venta).
  precio_alquiler: optionalDecimal,
  moneda_alquiler: optionalEnum(["ARS", "USD"] as const),
  // El estado se puede fijar ya en el alta/edición (ej: cargar una privada).
  estado: z.enum(ESTADOS_VALUES).default("disponible"),
  // `destacada` NO está en este schema: este form nunca la toca. Se cambia
  // solo con el botón "Destacar" del detalle (admin-only) — ver [[destacadas]].
  descripcion: optionalText,
  direccion: optionalText,
  zona: optionalText,
  // Referencia libre; no es la zona ni la dirección.
  punto_referencia: optionalText,
  ciudad: optionalText,
  ambientes: optionalInt,
  dormitorios: optionalInt,
  banios: optionalInt,
  sup_cubierta: optionalDecimal,
  sup_total: optionalDecimal,
  requisitos: optionalText,
  notas: optionalText,
  // Alquiler
  destino: optionalEnum(["vivienda", "comercial", "profesional", "otro"] as const),
  plazo_contrato: optionalEnum([
    "meses_12",
    "meses_18",
    "meses_24",
    "meses_36",
    "otro",
    "a_convenir",
  ] as const),
  plazo_otro: optionalText,
  ajuste: optionalEnum(["trimestral", "cuatrimestral", "semestral", "anual", "otro"] as const),
  ajuste_otro: optionalText,
  indice_ajuste: optionalEnum(["icl", "ipc", "fijo", "casa_propia", "otro", "a_convenir"] as const),
  indice_otro: optionalText,
  indice_fijo_pct: optionalDecimal,
  expensas: optionalText,
  mascotas: optionalEnum(["se_permiten", "no_se_permiten", "sin_especificar", "a_convenir"] as const),
  amoblado: optionalEnum(["amoblado", "sin_amoblar", "sin_especificar", "semiamoblado"] as const),
  // Campos de la captación (FORM-UNICO-01)
  cochera: optionalEnum(["no_tiene", "un_auto", "dos_autos", "tres_o_mas"] as const),
  // Checkbox con un hidden "" delante: "on" marcado, "" desmarcado, ausente si
  // el tipo no lo usa (entonces no se toca lo guardado).
  cochera_cubierta: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "on")),
  ambientes_lista: casillas(AMBIENTES_LISTA),
  medidas_lote: optionalText,
  comodidades: casillas(COMODIDADES),
  servicios: casillas(SERVICIOS),
  acepta_ninos: optionalEnum(["si", "no", "a_convenir"] as const),
  garantia: optionalEnum(["recibo_sueldo", "especial"] as const),
  garantia_detalle: optionalText,
  deposito: optionalEnum(["sin_deposito", "un_mes", "dos_meses", "dolares", "otro"] as const),
  deposito_detalle: optionalText,
  disponibilidad: optionalEnum(["inmediata", "mostrar_desde", "se_desocupa", "a_convenir"] as const),
  disponible_desde: optionalDate,
  // Datos internos (van a `datos_internos` en la API; nunca salen al sitio ni a Martina).
  llaves: optionalEnum(["oficina", "propietario", "inquilino", "encargado", "sin_llaves"] as const),
  visitas: optionalText,
  pide_propietario: optionalText,
  propietario_nombre: optionalText,
  propietario_telefono: optionalText,
  // Edificio al que pertenece la unidad. "" = propiedad suelta. Cuando el
  // vendedor elige "Nuevo edificio" llega el nombre en `edificio_nuevo` y la
  // action lo crea antes de guardar (ver resolverEdificio en actions).
  edificio_id: z
    .union([z.literal(""), z.string().uuid("Elegí un edificio de la lista.")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  edificio_nuevo: z.string().trim().max(120, "El nombre es demasiado largo.").optional(),
  unidad: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  // Ubicación en el mapa
  lat: optionalCoord(-90, 90),
  lng: optionalCoord(-180, 180),
  link_maps: z
    .union([z.literal(""), z.string().trim().url("Debe ser un link válido.")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export const estadoSchema = z.object({
  estado: z.enum(ESTADOS_VALUES),
});

export type PropertyFormValues = z.input<typeof propertySchema>;

/** Campos que se mandan como lista (varias casillas con el mismo name). */
export const CAMPOS_LISTA = ["ambientes_lista", "comodidades", "servicios"] as const;

/** Marca que el formulario mostró las casillas de `campo` (ver formDataAObjeto). */
export const presente = (campo: (typeof CAMPOS_LISTA)[number]) => `${campo}__presente`;

/**
 * FormData → objeto para el schema, con las casillas como listas. Una lista
 * sin ninguna casilla marcada no viaja en el FormData: por eso el formulario
 * manda un `<campo>__presente` cuando muestra el grupo. Si está, la lista va
 * (vacía si no se marcó nada, para poder desmarcar todo); si no está (el tipo
 * no la usa), no se manda y la API no toca lo guardado.
 */
export function formDataAObjeto(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = Object.fromEntries(formData);
  for (const campo of CAMPOS_LISTA) {
    if (formData.has(presente(campo))) out[campo] = formData.getAll(campo).map(String);
    else delete out[campo];
  }
  return out;
}
