import { NextResponse } from "next/server";
import { ApiError, apiFetch } from "@/lib/api";
import { API_URL } from "@/lib/session-cookies";

// Adjunto de un chat (CHAT-MEDIA-01). El panel pide a la API un link firmado de
// 5 minutos —con las cookies del usuario, así la API decide si puede verlo— y
// redirige el navegador a ese link. El archivo baja directo de la API, igual
// que las fotos bajan directo de R2: no pasa por Vercel, que corta las
// respuestas de más de 4,5 MB.
//
// API_PUBLIC_URL: URL de la API vista desde el navegador, si difiere de
// API_URL (por ejemplo, si el panel llega a la API por una red interna).
const PUBLIC_API = (process.env.API_PUBLIC_URL ?? API_URL).replace(/\/+$/, "");
const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ conv: string; id: string }> }) {
  const { conv, id } = await params;
  if (!UUID.test(conv) || !UUID.test(id)) return new NextResponse(null, { status: 404 });
  try {
    const link = await apiFetch<{ url: string }>(`/v1/conversations/${conv}/media/${id}/link`);
    const res = NextResponse.redirect(`${PUBLIC_API}${link.url}`, 302);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    const status = err instanceof ApiError && err.status === 401 ? 401 : 404;
    return new NextResponse(null, { status });
  }
}
