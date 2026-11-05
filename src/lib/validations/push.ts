import { z } from "zod";

// Lo que devuelve PushSubscription.toJSON() en el navegador. La API vuelve a
// validar; esto es para no mandar basura.
export const suscripcionSchema = z.object({
  endpoint: z.string().url().startsWith("https://"),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
  etiqueta: z.string().trim().max(60).nullable().optional(),
});

export const preferenciasSchema = z
  .object({ push: z.boolean().optional(), correo: z.boolean().optional() })
  .refine((v) => v.push !== undefined || v.correo !== undefined);

export type SuscripcionInput = z.input<typeof suscripcionSchema>;
