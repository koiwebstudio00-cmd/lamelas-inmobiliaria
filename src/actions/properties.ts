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

/**
 * Si el formulario trae "Nuevo edificio", lo crea y devuelve los datos con su
 * id. Un 409 significa que ya existía con ese nombre (lo creó otro vendedor, o
 * difiere solo en mayúsculas): se usa ese en vez de fallar. Una propiedad sin
 * edificio no lleva unidad.
 */
async function resolverEdificio(
  data: PropertyInput
): Promise<Omit<PropertyInput, "edificio_nuevo">> {
  const { edificio_nuevo, ...resto } = data;
  const nombre = edificio_nuevo?.trim();
  if (nombre) {
    try {
      const { edificio } = await apiFetch<{ edificio: { id: string } }>("/v1/edificios", {
        method: "POST",
        body: { nombre },
      });
      resto.edificio_id = edificio.id;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 409) throw error;
      const { data: lista } = await apiFetch<{ data: { id: string; nombre: string }[] }>(
        "/v1/edificios"
      );
      const existente = lista.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase());
      if (!existente) throw error;
      resto.edificio_id = existente.id;
    }
    revalidatePath("/propiedades/edificios");
  }
  if (!resto.edificio_id) resto.unidad = null;
  return resto;
}

/** Los campos que la API acepta en el alta rápida; el resto va por PATCH. */
const CAMPOS_ALTA = ["titulo", "operacion", "tipo", "precio", "moneda", "estado"] as const;

function altaRapida(data: Omit<PropertyInput, "edificio_nuevo">) {
  const { titulo, operacion, tipo, precio, moneda, estado } = data;
  return { titulo, operacion, tipo, precio, moneda, estado };
}

/** El resto de los campos, sin los vacíos (una propiedad nueva ya viene en null). */
function detalle(data: Omit<PropertyInput, "edificio_nuevo">) {
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
  let data: Omit<PropertyInput, "edificio_nuevo">;
  try {
    data = await resolverEdificio(parsed.data);
    const { property } = await apiFetch<{ property: { id: string } }>("/v1/properties", {
      method: "POST",
      body: altaRapida(data),
    });
    id = property.id;
  } catch (error) {
    return apiState(error, "No pudimos guardar la propiedad. Intentá de nuevo.");
  }

  const resto = detalle(data);
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
    // `destacada` no viaja nunca por acá — ni está en propertySchema.
    const data = await resolverEdificio(parsed.data);
    await apiFetch(`/v1/properties/${id}`, { method: "PATCH", body: data });
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
  // El ranking de "más consultadas" en analíticas muestra el estado de
  // destacada — si se togglea desde ahí, tiene que refrescarse ahí también.
  revalidatePath("/analiticas");
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
