import { z } from "zod";

// Validación mínima del lado del panel; la API vuelve a validar con Zod.
export const feedbackSchema = z.object({
  titulo: z.string().trim().min(3, "El título es obligatorio (mín. 3 caracteres)").max(200),
  descripcion: z
    .string()
    .trim()
    .min(5, "Contanos un poco más (mín. 5 caracteres)")
    .max(5000),
  url_contexto: z.string().trim().max(500).optional(),
});

export type FeedbackFormValues = z.input<typeof feedbackSchema>;
