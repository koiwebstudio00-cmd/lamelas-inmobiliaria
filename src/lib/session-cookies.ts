/**
 * Cookies de sesión que emite back-lamelas.
 *
 * Vive separado de `lib/api.ts` porque el middleware corre en el runtime edge y
 * no puede importar `next/headers`.
 */

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const CSRF_COOKIE = "csrf_token";

export const SESSION_COOKIES = [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE];

export const API_URL = (process.env.API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

/**
 * Cómo guardamos, en el dominio de Next, las cookies que devuelve la API. Dos
 * diferencias a propósito con las que emite el backend:
 *
 * - `path: "/"` también para el refresh. La API lo acota a `/v1/auth`, pero ese
 *   path no existe en Next: copiándolo igual el navegador no lo mandaría nunca
 *   y la sesión se moriría a los 15 minutos.
 * - `httpOnly` también para el csrf_token. La API lo deja legible por JS porque
 *   en un SPA lo reenvía el navegador; acá lo reenvía el servidor, así que el
 *   navegador no necesita verlo.
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export interface ParsedCookie {
  name: string;
  value: string;
  maxAge?: number;
}

/** Lee los Set-Cookie de una respuesta de la API y deja solo las de sesión. */
export function parseSetCookies(res: Response): ParsedCookie[] {
  const parsed: ParsedCookie[] = [];

  for (const raw of res.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;

    const name = pair.slice(0, eq).trim();
    if (!SESSION_COOKIES.includes(name)) continue;

    const maxAge = attrs
      .map((a) => a.trim().toLowerCase())
      .find((a) => a.startsWith("max-age="));

    parsed.push({
      name,
      value: decodeURIComponent(pair.slice(eq + 1).trim()),
      maxAge: maxAge ? Number(maxAge.slice("max-age=".length)) : undefined,
    });
  }

  return parsed;
}

/** Una cookie con valor vacío o Max-Age=0 es un borrado, no una asignación. */
export function isDeletion(cookie: ParsedCookie): boolean {
  return cookie.value === "" || cookie.maxAge === 0;
}
