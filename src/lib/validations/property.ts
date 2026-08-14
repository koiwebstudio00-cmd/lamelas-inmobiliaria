import { z } from "zod";

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

const TIPOS_VALUES = [
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

const ESTADOS_VALUES = [
  "disponible",
  "reservado",
  "proximamente",
  "pausado",
  "vendida",
  "alquilada",
] as const;

// RF-2.2: solo título, operación, tipo y precio son obligatorios
export const propertySchema = z.object({
  titulo: z.string().trim().min(3, "El título es obligatorio (mín. 3 caracteres)"),
  operacion: z.enum(["venta", "alquiler"], { message: "Elegí la operación" }),
  tipo: z.enum(TIPOS_VALUES, { message: "Elegí el tipo de propiedad" }),
  precio: z.coerce
    .number({ message: "Ingresá un precio válido" })
    .min(0, "El precio no puede ser negativo"),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  descripcion: optionalText,
  direccion: optionalText,
  zona: optionalText,
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
  ] as const),
  plazo_otro: optionalText,
  ajuste: optionalEnum(["trimestral", "cuatrimestral", "otro"] as const),
  ajuste_otro: optionalText,
  indice_ajuste: optionalEnum(["icl", "ipc", "fijo"] as const),
  indice_fijo_pct: optionalDecimal,
  expensas: optionalText,
  mascotas: optionalEnum(["se_permiten", "no_se_permiten", "sin_especificar"] as const),
  amoblado: optionalEnum(["amoblado", "sin_amoblar", "sin_especificar"] as const),
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
