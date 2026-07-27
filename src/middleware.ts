import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  API_URL,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
  isDeletion,
  parseSetCookies,
  type ParsedCookie,
} from "@/lib/session-cookies";

/** Rutas que se pueden ver sin sesión. */
const PUBLIC_PATHS = ["/login", "/recuperar", "/actualizar-clave", "/aceptar-invitacion"];

/**
 * Renueva la sesión contra la API. Es el único lugar del panel que puede
 * hacerlo bien: el middleware siempre puede escribir cookies, una página no.
 *
 * Si falla no borramos nada — sin access el usuario va a /login igual, y
 * conservar el refresh evita cerrarle la sesión por un error momentáneo de red.
 */
async function renew(refreshToken: string): Promise<ParsedCookie[]> {
  try {
    const res = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}` },
      cache: "no-store",
    });
    return res.ok ? parseSetCookies(res) : [];
  } catch {
    return [];
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // El refresh rota el token: si dos requests renuevan a la vez, el segundo
  // recibe uno ya revocado. Los prefetch de Next son la fuente más probable de
  // esa carrera y no le muestran nada al usuario, así que no renuevan.
  const isPrefetch =
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch";

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let renewed: ParsedCookie[] = [];

  // El access dura 15 minutos; cuando el navegador lo deja de mandar, lo
  // renovamos acá para que la página ya lo reciba vigente.
  if (!request.cookies.has(ACCESS_COOKIE) && refreshToken && !isPrefetch) {
    renewed = await renew(refreshToken);
    for (const cookie of renewed) {
      if (isDeletion(cookie)) request.cookies.delete(cookie.name);
      else request.cookies.set(cookie.name, cookie.value);
    }
  }

  const hasSession = request.cookies.has(ACCESS_COOKIE);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let response: NextResponse;

  if (!hasSession && !isPublic) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (hasSession && isPublic && !searchParams.has("token")) {
    // Con sesión abierta no tiene sentido volver al login. La excepción es
    // llegar con un token en la URL: ahí el link (invitación o cambio de
    // contraseña) manda, aunque haya sesión.
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
    response = NextResponse.next({ request });
  }

  for (const cookie of renewed) {
    if (isDeletion(cookie)) {
      response.cookies.delete(cookie.name);
    } else {
      response.cookies.set(cookie.name, cookie.value, {
        ...COOKIE_OPTIONS,
        ...(cookie.maxAge === undefined ? {} : { maxAge: cookie.maxAge }),
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
