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

// RF-2.2: solo título, operación, tipo y precio son obligatorios
export const propertySchema = z.object({
  titulo: z.string().trim().min(3, "El título es obligatorio (mín. 3 caracteres)"),
  operacion: z.enum(["venta", "alquiler"], { message: "Elegí la operación" }),
  tipo: z.enum(["casa", "departamento", "terreno", "local", "otro"], {
    message: "Elegí el tipo de propiedad",
  }),
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
  notas: optionalText,
});

export const estadoSchema = z.object({
  estado: z.enum(["disponible", "reservada", "vendida"]),
});

export type PropertyFormValues = z.input<typeof propertySchema>;
