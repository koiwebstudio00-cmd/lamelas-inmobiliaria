/**
 * Origen de un anuncio de Meta (Facebook/Instagram) a partir del `source_url`
 * y el `source_type` del referral de WhatsApp. El dominio del link dice en qué
 * app tocó la persona el anuncio: fb.me o facebook.com → Facebook,
 * instagram.com → Instagram. Cualquier otro (wa.me, sin link) queda como
 * "Meta": no se puede saber la app y no se adivina. Debe coincidir con
 * PLATAFORMA_ANUNCIO de back-lamelas (analytics/repo.ts).
 */
export type PlataformaAnuncio = "facebook" | "instagram" | "meta";

export const PLATAFORMA_LABELS: Record<PlataformaAnuncio, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  meta: "Meta",
};

/** El link solo se ofrece si es https: viene de WhatsApp, no se confía a ciegas. */
export function linkSeguro(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function plataformaAnuncio(url: string | null | undefined): PlataformaAnuncio {
  const seguro = linkSeguro(url);
  if (!seguro) return "meta";
  const host = new URL(seguro).hostname.toLowerCase();
  const es = (dominio: string) => host === dominio || host.endsWith(`.${dominio}`);
  if (es("instagram.com")) return "instagram";
  if (es("fb.me") || es("facebook.com") || es("fb.com")) return "facebook";
  return "meta";
}

export function origenAnuncio(anuncio: { source_url?: string | null; source_type?: string | null }) {
  const plataforma = plataformaAnuncio(anuncio.source_url);
  const esPublicacion = anuncio.source_type === "post";
  const que = esPublicacion ? "una publicación" : "un anuncio";
  return {
    plataforma,
    /** "un anuncio de Instagram", "una publicación de Facebook", "un anuncio". */
    descripcion: plataforma === "meta" ? que : `${que} de ${PLATAFORMA_LABELS[plataforma]}`,
    accion: esPublicacion ? "Ver publicación" : "Ver anuncio",
    link: linkSeguro(anuncio.source_url),
  };
}
