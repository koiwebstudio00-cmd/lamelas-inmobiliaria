import { z } from "zod";

const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const recoverSchema = z.object({
  email: z.string().trim().email("Email inválido"),
});

/** Cambio de contraseña desde el link de recuperación: el token viaja en el form. */
export const updatePasswordSchema = z.object({
  token: z.string().trim().min(1, "El link no es válido. Pedí uno nuevo."),
  password,
});

/** Alta desde una invitación: la persona elige su nombre y su contraseña. */
export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1, "El link no es válido. Pedí que te inviten de nuevo."),
  nombre: z.string().trim().min(2, "Ingresá tu nombre completo"),
  password,
});
