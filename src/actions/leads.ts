"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Consultas (leads).
 *
 * Quién puede qué lo decide la API, no estas actions: un vendedor solo ve y
 * edita las consultas que tiene asignadas, y reasignar es exclusivo de un
 * admin. Acá solo traducimos el error al castellano de la pantalla.
 */

export type LeadFormState = { error?: string; success?: string };

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function revalidar(id?: string) {
  revalidatePath("/");
  revalidatePath("/consultas");
  if (id) revalidatePath(`/consultas/${id}`);
}

const estadoSchema = z.enum(["nueva", "en_contacto", "ganada", "perdida"]);

const leadSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre de quien consulta"),
  telefono: z.string().trim().max(50).optional(),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]).optional(),
  mensaje: z.string().trim().min(1, "Escribí de qué se trata la consulta"),
  // El <select> manda "" cuando es "Ninguna en particular"; z.uuid() lo
  // rechaza, asi que normalizamos ese vacio a undefined antes de validar.
  property_id: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().uuid("Elegí una propiedad válida de la lista.").optional()
  ),
});

/** Devuelve el mensaje de error, o null si salió bien. */
export async function updateLeadEstado(id: string, estado: string): Promise<string | null> {
  const parsed = estadoSchema.safeParse(estado);
  if (!parsed.success) return "Ese estado no es válido.";
  try {
    await apiFetch(`/v1/leads/${id}`, { method: "PATCH", body: { estado: parsed.data } });
  } catch (error) {
    return message(error, "No pudimos actualizar la consulta.");
  }
  revalidar(id);
  return null;
}

/**
 * Reasigna la consulta a otro vendedor, o la deja sin asignar con "".
 * Solo un admin puede: si no, la API responde 403 y mostramos ese mensaje.
 */
export async function assignLead(id: string, userId: string): Promise<string | null> {
  const assigned = userId === "" ? null : userId;
  if (assigned !== null && !z.string().uuid().safeParse(assigned).success) {
    return "Ese vendedor no es válido.";
  }
  try {
    await apiFetch(`/v1/leads/${id}`, { method: "PATCH", body: { assigned_to: assigned } });
  } catch (error) {
    return message(error, "No pudimos reasignar la consulta.");
  }
  revalidar(id);
  return null;
}

/** Nota interna: no la ve quien consultó, solo el equipo. */
export async function addLeadNote(
  leadId: string,
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const nota = String(formData.get("nota") ?? "").trim();
  if (!nota) return { error: "Escribí la nota antes de guardarla." };
  if (nota.length > 5000) return { error: "La nota es demasiado larga." };

  try {
    await apiFetch(`/v1/leads/${leadId}/notes`, { method: "POST", body: { nota } });
  } catch (error) {
    return { error: message(error, "No pudimos guardar la nota.") };
  }
  revalidar(leadId);
  return { success: "Nota guardada." };
}

/** Editar los datos básicos del lead (nombre y email). El teléfono no se edita acá. */
const datosSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre de quien consulta"),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]).optional(),
});

export async function updateLeadDatos(
  id: string,
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = datosSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    // email "" borra el email en la API (lo normaliza a null).
    await apiFetch(`/v1/leads/${id}`, {
      method: "PATCH",
      body: { nombre: parsed.data.nombre, email: parsed.data.email ?? "" },
    });
  } catch (error) {
    return { error: message(error, "No pudimos guardar los cambios.") };
  }
  revalidar(id);
  return { success: "Datos actualizados." };
}

/** Elimina la consulta (solo admin; la API rechaza a un vendedor). Borra en cascada. */
export async function deleteLead(id: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/leads/${id}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No pudimos eliminar la consulta.");
  }
  revalidatePath("/");
  revalidatePath("/consultas");
  redirect("/consultas");
}

/**
 * Alta manual: alguien llamó por teléfono o pasó por la oficina. La API la
 * asigna a quien la carga y la marca con canal "manual".
 */
export async function createLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, telefono, ...resto } = parsed.data;
  if (!email && !telefono) {
    return { error: "Cargá al menos un teléfono o un email para poder responder." };
  }

  let id: string;
  try {
    const { lead } = await apiFetch<{ lead: { id: string } }>("/v1/leads", {
      method: "POST",
      body: { ...resto, ...(email ? { email } : {}), ...(telefono ? { telefono } : {}) },
    });
    id = lead.id;
  } catch (error) {
    return { error: message(error, "No pudimos guardar la consulta.") };
  }

  revalidar();
  redirect(`/consultas/${id}`);
}
