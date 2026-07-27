"use client";

import { confirmPhotos, presignPhotos } from "@/actions/images";
import { resizeImage } from "@/lib/resize-image";

/**
 * Sube fotos a R2 con URLs firmadas.
 *
 * 1. Le pedimos a la API una URL firmada por foto.
 * 2. El navegador manda cada archivo directo a R2. Es el único lugar donde el
 *    front habla con algo que no sea Next: R2 no usa cookies, así que no
 *    necesita el intermediario.
 * 3. Confirmamos las que llegaron. La API asigna orden y portada.
 *
 * Si una foto falla, las demás siguen: se confirman solo las subidas.
 */

/** Sin credenciales de R2 el backend devuelve una URL de mentira (modo dev). */
function isStub(url: string): boolean {
  return url.includes("/dev-r2-upload/");
}

export async function uploadPropertyPhotos(
  propertyId: string,
  files: File[]
): Promise<{ ok: number; failed: number; error?: string }> {
  if (files.length === 0) return { ok: 0, failed: 0 };

  const { uploads, error } = await presignPhotos(propertyId, files.length);
  if (!uploads) return { ok: 0, failed: files.length, error };

  const subidas: string[] = [];
  let failed = 0;

  // En serie: son fotos grandes desde el celular y no queremos saturar la red.
  for (const [i, file] of files.entries()) {
    const slot = uploads[i];
    if (!slot) {
      failed++;
      continue;
    }
    try {
      const blob = await resizeImage(file);
      if (!isStub(slot.upload_url)) {
        const res = await fetch(slot.upload_url, {
          method: "PUT",
          headers: { "Content-Type": "image/webp" },
          body: blob,
        });
        if (!res.ok) throw new Error(`R2 respondió ${res.status}`);
      }
      subidas.push(slot.r2_key);
    } catch {
      failed++;
    }
  }

  const confirmed = await confirmPhotos(propertyId, subidas);
  if (confirmed.error) {
    return { ok: 0, failed: files.length, error: confirmed.error };
  }
  return { ok: confirmed.ok, failed };
}
