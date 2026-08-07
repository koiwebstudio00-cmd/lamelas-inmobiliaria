// Redimensiona una imagen client-side a máx. 1600px y la pasa a WebP (regla 5
// de CLAUDE.md / design-system). Devuelve un Blob listo para subir.
//
// Robustez mobile — los vendedores publican desde el celular (Safari iOS,
// WebViews de WhatsApp/Instagram, Android viejo) y ahí el pipeline de canvas es
// frágil:
//   - `createImageBitmap` no existe en iOS Safari viejo ni en varios WebViews.
//   - `canvas.toBlob(…, "image/webp")` no encodea WebP en Safari < 16.4 (cae a
//     PNG) y en algunos WebViews devuelve null.
// Antes cualquiera de esas fallas tiraba una excepción y la foto se perdía en
// silencio: el vendedor veía la propiedad creada pero SIN imágenes. Ahora:
//   1) decodificamos con <img> (soporte universal; además respeta la
//      orientación EXIF, así no salen fotos de costado) y, si hiciera falta,
//      caemos a createImageBitmap;
//   2) intentamos WebP y, si el navegador no lo produce, caemos a JPEG (más
//      chico que PNG y con soporte universal);
//   3) si TODO el resize falla, subimos el archivo original: mejor una foto
//      pesada que ninguna.
//
// El PUT a R2 manda siempre `Content-Type: image/webp` porque así está firmada
// la URL (ver presignUpload en el back). R2 no mira los bytes y el <img> del
// panel los sniffa, así que aunque el blob real sea JPEG/PNG las fotos se ven
// bien igual.
const MAX_SIZE = 1600;
const WEBP_QUALITY = 0.75;
const JPEG_QUALITY = 0.82;

interface Decoded {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  close: () => void;
}

/** Decodifica con <img> (lo más portable en mobile) y cae a createImageBitmap. */
async function decodificar(file: File): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    if (typeof img.decode === "function") {
      await img.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
      });
    }
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("Imagen vacía");
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch (errImg) {
    URL.revokeObjectURL(url);
    // Plan B: createImageBitmap. Puede no existir; si tampoco anda, propagamos.
    if (typeof createImageBitmap !== "function") throw errImg;
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      close: () => bitmap.close(),
    };
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

async function shrink(file: File): Promise<Blob> {
  const src = await decodificar(file);
  try {
    const scale = Math.min(1, MAX_SIZE / Math.max(src.width, src.height));
    const width = Math.max(1, Math.round(src.width * scale));
    const height = Math.max(1, Math.round(src.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    src.draw(ctx, width, height);

    // WebP primero; si el navegador no lo soporta, JPEG. Nunca dejamos que un
    // null sin plan B se convierta en foto perdida.
    const webp = await toBlob(canvas, "image/webp", WEBP_QUALITY);
    if (webp && webp.type === "image/webp") return webp;
    const jpeg = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
    if (jpeg) return jpeg;
    if (webp) return webp; // un PNG disfrazado de otra cosa: igual sirve
    throw new Error("No se pudo convertir la imagen");
  } finally {
    src.close();
  }
}

export async function resizeImage(file: File): Promise<Blob> {
  try {
    return await shrink(file);
  } catch {
    // Último recurso: subir el original sin tocar. Preferimos una foto pesada
    // antes que perderla; la mayoría de las veces el shrink igual funciona.
    return file;
  }
}
