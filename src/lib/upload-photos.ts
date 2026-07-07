"use client";

import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/resize-image";

// Sube fotos directo a Storage (path {property_id}/{uuid}.webp) e inserta
// las filas en property_images. La primera queda como portada si no hay una.
export async function uploadPropertyPhotos(
  propertyId: string,
  files: File[],
  opts: { hasPortada: boolean; startOrden: number } = {
    hasPortada: false,
    startOrden: 0,
  }
): Promise<{ ok: number; failed: number }> {
  const supabase = createClient();
  let hasPortada = opts.hasPortada;
  let orden = opts.startOrden;
  let ok = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const blob = await resizeImage(file);
      const path = `${propertyId}/${crypto.randomUUID()}.webp`;

      const { error: upErr } = await supabase.storage
        .from("property-images")
        .upload(path, blob, { contentType: "image/webp" });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("property_images").insert({
        property_id: propertyId,
        url: path,
        es_portada: !hasPortada,
        orden: orden++,
      });
      if (dbErr) throw dbErr;

      hasPortada = true;
      ok++;
    } catch {
      failed++;
    }
  }

  return { ok, failed };
}
