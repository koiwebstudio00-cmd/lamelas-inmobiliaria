"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, estadoSchema } from "@/lib/validations/property";

export type PropertyFormState = {
  errors?: Record<string, string>;
  error?: string;
  // id de la propiedad creada: el cliente sube las fotos y navega al detalle
  id?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No pudimos guardar la propiedad. Intentá de nuevo." };
  }

  revalidatePath("/propiedades");
  // Sin redirect: el formulario sube las fotos seleccionadas y navega al detalle
  return { id: data.id };
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

  const supabase = await createClient();
  // RLS garantiza que solo el dueño puede actualizar (HU-5)
  const { error } = await supabase.from("properties").update(parsed.data).eq("id", id);

  if (error) {
    return { error: "No pudimos actualizar la propiedad." };
  }

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${id}`);
  redirect(`/propiedades/${id}`);
}

export async function updateEstado(id: string, formData: FormData) {
  const parsed = estadoSchema.safeParse({ estado: formData.get("estado") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("properties").update({ estado: parsed.data.estado }).eq("id", id);

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${id}`);
  revalidatePath("/mis-propiedades");
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();

  // Verificar propiedad y dueño antes de tocar Storage
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: property } = await supabase
    .from("properties")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!property || !user || property.user_id !== user.id) return;

  // Borrar fotos del bucket (las filas caen por cascade)
  const { data: files } = await supabase.storage
    .from("property-images")
    .list(id, { limit: 100 });
  if (files && files.length > 0) {
    await supabase.storage
      .from("property-images")
      .remove(files.map((f) => `${id}/${f.name}`));
  }

  await supabase.from("properties").delete().eq("id", id);

  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  redirect("/propiedades");
}
