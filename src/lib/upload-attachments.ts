"use client";

import { confirmAdjuntos, presignAdjuntos } from "@/actions/feedback";
import { resizeImage } from "@/lib/resize-image";

/**
 * Sube imágenes de un reporte de error a R2 con URLs firmadas. Mismo flujo que
 * `upload-photos.ts`: pedimos URLs, el navegador manda cada archivo directo a
 * R2 (único lugar donde el front habla con algo que no es Next), y confirmamos.
 */

function isStub(url: string): boolean {
  return url.includes("/dev-r2-upload/");
}

export async function uploadAttachments(
  feedbackId: string,
  files: File[]
): Promise<{ ok: number; failed: number; error?: string }> {
  if (files.length === 0) return { ok: 0, failed: 0 };

  const { uploads, error } = await presignAdjuntos(feedbackId, files.length);
  if (!uploads) return { ok: 0, failed: files.length, error };

  const subidas: string[] = [];
  let failed = 0;

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

  const confirmed = await confirmAdjuntos(feedbackId, subidas);
  if (confirmed.error) {
    return { ok: 0, failed: files.length, error: confirmed.error };
  }
  return { ok: confirmed.ok, failed };
}
