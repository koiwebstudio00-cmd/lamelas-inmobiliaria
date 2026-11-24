"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { propertySchema, estadoSchema, formDataAObjeto } from "@/lib/validations/property";

export type PropertyFormState = {
  errors?: Record<string, string>;
  error?: string;
  /** Campos que le faltan para publicarse (422 INCOMPLETE de la API). */
  faltantes?: string[];
  // id de la propiedad creada: el cliente sube las fotos y navega al detalle
  id?: string;
  // Guardada, pero con un aviso para mostrar (ej. quedó como borrador).
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
    // Faltan datos para publicar: lista de campos + el mensaje de la API.
    if (error.code === "INCOMPLETE") {
      return { errors, error: error.message, faltantes: Object.keys(errors) };
    }
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

/**
 * Body de la API a partir del formulario (FORM-UNICO-01):
 * - "Guardar como borrador" manda `estado: borrador`; "Publicar"/"Guardar
 *   cambios", el estado elegido (nunca borrador).
 * - Llaves, visitas y el detalle de la garantía especial (qué pide el
 *   propietario) van juntos en `datos_internos`: nunca salen al sitio ni a Martina.
 * - `user_id` solo si vino (el select de responsable es del admin).
 */
function cuerpoApi(data: Omit<PropertyInput, "edificio_nuevo">) {
  const {
    intent,
    user_id,
    llaves,
    visitas,
    garantia_detalle,
    estado,
    ...campos
  } = data;
  return {
    ...campos,
    estado: intent === "borrador" ? "borrador" : estado === "borrador" ? "disponible" : estado,
    datos_internos: { llaves, visitas, garantia_detalle },
    ...(user_id ? { user_id } : {}),
  };
}

/**
 * Alta en un solo pedido: la API acepta todo junto y valida la completitud si
 * no es borrador (422 INCOMPLETE con los campos que faltan). Así no queda una
 * propiedad a medio cargar si algo falla.
 */
export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = propertySchema.safeParse(formDataAObjeto(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) };
  }

  let id: string;
  try {
    const data = await resolverEdificio(parsed.data);
    const { property } = await apiFetch<{ property: { id: string } }>("/v1/properties", {
      method: "POST",
      body: cuerpoApi(data),
    });
    id = property.id;
  } catch (error) {
    return apiState(error, "No pudimos guardar la propiedad. Intentá de nuevo.");
  }

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  // Sin redirect: el formulario sube las fotos seleccionadas y navega al detalle
  return {
    id,
    warning:
      parsed.data.intent === "borrador"
        ? "Quedó como borrador: no la ven el sitio ni Martina hasta que la publiques."
        : undefined,
  };
}

export async function updateProperty(
  id: string,
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = propertySchema.safeParse(formDataAObjeto(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) };
  }

  try {
    // Mandamos todo, nulls incluidos: así se vacía un campo que se borró.
    // `destacada` no viaja nunca por acá — ni está en propertySchema.
    const data = await resolverEdificio(parsed.data);
    await apiFetch(`/v1/properties/${id}`, { method: "PATCH", body: cuerpoApi(data) });
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
