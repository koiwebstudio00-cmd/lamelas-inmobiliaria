import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre completo"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const recoverSchema = z.object({
  email: z.string().trim().email("Email inválido"),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
