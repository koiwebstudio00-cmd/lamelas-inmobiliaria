"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { propertySchema, estadoSchema } from "@/lib/validations/property";

export type PropertyFormState = {
  errors?: Record<string, string>;
  error?: string;
  // id de la propiedad creada: el cliente sube las fotos y navega al detalle
  id?: string;
  // La propiedad se creó pero quedó incompleta (ver createProperty).
  warning?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Traduce un error de la API al estado del formulario. */
function apiState(error: unknown, fallback: string): PropertyFormState {
  if (error instanceof ApiError) {
    const errors = error.fieldErrors();
    if (Object.keys(errors).length > 0) return { errors };
    return { error: error.message };
  }
  return { error: fallback };
}

type PropertyInput = ReturnType<typeof propertySchema.parse>;

/** Los campos que la API acepta en el alta rápida; el resto va por PATCH. */
const CAMPOS_ALTA = ["titulo", "operacion", "tipo", "precio", "moneda", "estado"] as const;

function altaRapida(data: PropertyInput) {
  const { titulo, operacion, tipo, precio, moneda, estado } = data;
  return { titulo, operacion, tipo, precio, moneda, estado };
}

/** El resto de los campos, sin los vacíos (una propiedad nueva ya viene en null). */
function detalle(data: PropertyInput) {
  const alta: readonly string[] = CAMPOS_ALTA;
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => !alta.includes(key) && value !== null && value !== undefined
    )
  );
}

/**
 * El alta es en dos pasos porque la API separa el alta rápida (solo lo
 * obligatorio) del resto de los datos. Si el segundo paso falla igual
 * devolvemos el id: la propiedad ya existe y reintentar crearía un duplicado.
 * El formulario avisa que quedó incompleta y se completa desde la edición.
 */
export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) };
  }

  let id: string;
  try {
    const { property } = await apiFetch<{ property: { id: string } }>("/v1/properties", {
      method: "POST",
      body: altaRapida(parsed.data),
    });
    id = property.id;
  } catch (error) {
    return apiState(error, "No pudimos guardar la propiedad. Intentá de nuevo.");
  }

  const resto = detalle(parsed.data);
  let warning: string | undefined;
  if (Object.keys(resto).length > 0) {
    try {
      await apiFetch(`/v1/properties/${id}`, { method: "PATCH", body: resto });
    } catch {
      warning =
        "Guardamos la propiedad, pero algunos datos no se pudieron cargar. Revisalos y guardá de nuevo.";
    }
  }

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  // Sin redirect: el formulario sube las fotos seleccionadas y navega al detalle
  return { id, warning };
}

export async function updateProperty(
  id: string,
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) };
  }

  try {
    // Mandamos todo, nulls incluidos: así se vacía un campo que se borró.
    await apiFetch(`/v1/properties/${id}`, { method: "PATCH", body: parsed.data });
  } catch (error) {
    return apiState(error, "No pudimos actualizar la propiedad.");
  }

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  revalidatePath(`/propiedades/${id}`);
  redirect(`/propiedades/${id}`);
}

/** Devuelve el mensaje de error, o null si salió bien. */
export async function updateEstado(
  id: string,
  formData: FormData
): Promise<string | null> {
  const parsed = estadoSchema.safeParse({ estado: formData.get("estado") });
  if (!parsed.success) return "Ese estado no es válido.";

  try {
    await apiFetch(`/v1/properties/${id}/estado`, {
      method: "PATCH",
      body: { estado: parsed.data.estado },
    });
  } catch (error) {
    return error instanceof ApiError
      ? error.message
      : "No pudimos actualizar el estado.";
  }

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  revalidatePath(`/propiedades/${id}`);
  return null;
}

/** Prende/apaga el destacado (botón rápido). Devuelve el error, o null si salió bien. */
export async function updateDestacada(
  id: string,
  destacada: boolean
): Promise<string | null> {
  try {
    await apiFetch(`/v1/properties/${id}/destacada`, {
      method: "PATCH",
      body: { destacada },
    });
  } catch (error) {
    return error instanceof ApiError
      ? error.message
      : "No pudimos actualizar el destacado.";
  }

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  revalidatePath(`/propiedades/${id}`);
  return null;
}

/**
 * Borra la propiedad. La API se encarga de las fotos en R2 y de que solo el
 * dueño pueda hacerlo. Devuelve el error, o redirige si salió bien.
 */
export async function deleteProperty(id: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/properties/${id}`, { method: "DELETE" });
  } catch (error) {
    return error instanceof ApiError
      ? error.message
      : "No pudimos eliminar la propiedad.";
  }

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  redirect("/propiedades");
}
