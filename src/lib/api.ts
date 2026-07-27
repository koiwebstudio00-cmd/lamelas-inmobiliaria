/**
 * Transporte hacia back-lamelas.
 *
 * El navegador nunca habla con la API: siempre pasa por el servidor de Next,
 * que reenvía las cookies de sesión del usuario. Todo lo de este archivo corre
 * en el servidor (importa `next/headers`), nunca en un componente cliente.
 */

import { cache } from "react";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  API_URL,
  COOKIE_OPTIONS,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIES,
  isDeletion,
  parseSetCookies,
  type ParsedCookie,
} from "@/lib/session-cookies";
import type { SessionUser } from "@/lib/types";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Un campo que la API rechazó, tal como viene en `error.details`. */
export interface ApiErrorDetail {
  field: string;
  message: string;
}

/**
 * Error con la respuesta de la API. `message` ya viene en castellano desde el
 * backend, así que se puede mostrar tal cual en la UI.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(message: string, status: number, code = "ERROR", details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** `{ titulo: "Requerido" }`, listo para el `errors` de un form state. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const d of this.details) {
      if (d.field && !out[d.field]) out[d.field] = d.message;
    }
    return out;
  }
}

export interface ApiInit {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildUrl(path: string, query: ApiInit["query"]): string {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * El refresh token solo viaja a `/v1/auth`: es el path con el que lo emite el
 * backend y no tiene sentido mandarlo al resto. Al resto le alcanza con el
 * access y el csrf.
 */
function cookieHeader(path: string, store: CookieStore, fresh: Map<string, string>): string {
  const names = path.startsWith("/v1/auth") ? SESSION_COOKIES : [ACCESS_COOKIE, CSRF_COOKIE];

  return names
    .map((name) => {
      const value = fresh.get(name) ?? store.get(name)?.value;
      return value ? name + "=" + encodeURIComponent(value) : null;
    })
    .filter((c): c is string => c !== null)
    .join("; ");
}

function send(
  path: string,
  init: ApiInit,
  store: CookieStore,
  fresh: Map<string, string>
): Promise<Response> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  const cookie = cookieHeader(path, store, fresh);
  if (cookie) headers.Cookie = cookie;

  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  if (UNSAFE.has(method)) {
    const csrf = fresh.get(CSRF_COOKIE) ?? store.get(CSRF_COOKIE)?.value;
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  return fetch(buildUrl(path, init.query), {
    method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
}

const PROBE_COOKIE = "cookie_probe";

/**
 * `cookies()` es de solo lectura en un Server Component: ahí `set` tira. Hay
 * que saberlo *antes* de refrescar, porque el refresh rota el token: si
 * refrescamos y no podemos guardar el nuevo, el navegador se queda con uno ya
 * revocado y la sesión se cae en el request siguiente.
 *
 * La prueba es una cookie descartable y ya vencida: no toca la sesión.
 */
function canPersist(store: CookieStore): boolean {
  try {
    store.set(PROBE_COOKIE, "1", { ...COOKIE_OPTIONS, maxAge: 0 });
    store.delete(PROBE_COOKIE);
    return true;
  } catch {
    return false;
  }
}

/** Copia al dominio de Next las cookies que devolvio la API. */
function persist(store: CookieStore, list: ParsedCookie[]): void {
  try {
    for (const cookie of list) {
      if (isDeletion(cookie)) {
        store.delete(cookie.name);
      } else {
        store.set(cookie.name, cookie.value, {
          ...COOKIE_OPTIONS,
          ...(cookie.maxAge === undefined ? {} : { maxAge: cookie.maxAge }),
        });
      }
    }
  } catch {
    // Server Component: cookies() es de solo lectura acá.
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: ApiErrorDetail[] };
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();

  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const error = (json as ErrorBody | null)?.error;
    throw new ApiError(
      error?.message ?? "No pudimos conectarnos con el servidor. Probá de nuevo.",
      res.status,
      error?.code ?? "ERROR",
      error?.details ?? []
    );
  }

  return json as T;
}

/**
 * Llama a la API reenviando la sesión del usuario. Ante un 401 intenta un
 * refresh y reintenta una sola vez, siempre que estemos en un contexto que
 * pueda guardar las cookies nuevas.
 *
 * El caso normal ni pasa por acá: el middleware renueva la sesión antes de que
 * la página se ejecute.
 */
export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const store = await cookies();
  const fresh = new Map<string, string>();

  let res = await send(path, init, store, fresh);

  const canRefresh =
    res.status === 401 &&
    path !== "/v1/auth/refresh" &&
    store.has(REFRESH_COOKIE) &&
    canPersist(store);

  if (canRefresh) {
    const refreshed = await send("/v1/auth/refresh", { method: "POST" }, store, fresh);

    if (refreshed.ok) {
      const parsed = parseSetCookies(refreshed);
      persist(store, parsed);
      for (const cookie of parsed) {
        if (!isDeletion(cookie)) fresh.set(cookie.name, cookie.value);
      }
      res = await send(path, init, store, fresh);
    } else {
      persist(store, parseSetCookies(refreshed));
    }
  }

  return parse<T>(res);
}

/**
 * Login y aceptación de invitación: además de devolver el usuario, guardan las
 * cookies de sesión. Solo se puede llamar desde una server action o un route
 * handler (necesita escribir cookies).
 */
export async function startSession(path: string, body: unknown): Promise<SessionUser> {
  const store = await cookies();
  const res = await send(path, { method: "POST", body }, store, new Map());
  const data = await parse<{ user: SessionUser }>(res);

  persist(store, parseSetCookies(res));

  return data.user;
}

/** Cierra la sesión en la API y borra las cookies locales pase lo que pase. */
export async function endSession(): Promise<void> {
  const store = await cookies();

  try {
    await send("/v1/auth/logout", { method: "POST", body: {} }, store, new Map());
  } catch {
    // Si la API no responde igual cerramos la sesión del lado de Next.
  }

  for (const name of SESSION_COOKIES) {
    try {
      store.delete(name);
    } catch {
      // Server Component: no debería pasar, el logout es una server action.
    }
  }
}

/**
 * Usuario de la sesión actual, o null si no hay. Memoizado por request: varias
 * páginas y layouts lo piden y la API se llama una sola vez.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const { user } = await apiFetch<{ user: SessionUser }>("/v1/auth/me");
    return user;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
});
