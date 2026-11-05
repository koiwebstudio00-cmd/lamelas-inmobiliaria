// Utilidades del navegador para la app instalable y el push (PUSH-PWA-01).
// Solo para Client Components: todo esto toca `window`/`navigator`.
import { useSyncExternalStore } from "react";

const sinCambios = () => () => {};

/**
 * Lee un valor que solo existe en el navegador. En el server (y en la primera
 * hidratación) devuelve `servidor`, así no hay diferencias de render.
 */
export function useEnNavegador<T>(leer: () => T, servidor: T): T {
  return useSyncExternalStore(sinCambios, leer, () => servidor);
}

/** ¿Se está usando como app instalada (pantalla de inicio)? */
export function esAppInstalada(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari en iPhone (propiedad no estándar).
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone o iPad (el iPad moderno se presenta como Mac con pantalla táctil). */
export function esIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function soportaPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Nombre corto para reconocer el dispositivo en el perfil. */
export function etiquetaDispositivo(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (esIOS()) return "iPad";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "Celular Android" : "Tablet Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Computadora Windows";
  return "Navegador";
}

/** La clave VAPID viaja en base64url; pushManager.subscribe la pide en bytes. */
export function claveABytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/** Suscripción push actual de este navegador, si hay. */
export async function suscripcionActual(): Promise<PushSubscription | null> {
  if (!soportaPush()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Pide permiso (tiene que venir de un toque del usuario) y suscribe. */
export async function suscribir(vapidPublicKey: string): Promise<PushSubscription> {
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") throw new Error("permiso");
  const reg = (await registrarServiceWorker()) ?? (await navigator.serviceWorker.ready);
  const existente = await reg.pushManager.getSubscription();
  if (existente) return existente;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: claveABytes(vapidPublicKey),
  });
}

// ── Aviso de instalación de Android/Chrome ───────────────────────────────────
// `beforeinstallprompt` se dispara una sola vez, al cargar: hay que guardarlo
// apenas llega para poder usarlo cuando el usuario toque "Instalar app".

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let avisoGuardado: BeforeInstallPromptEvent | null = null;
const oyentes = new Set<() => void>();

export function escucharAvisoInstalacion() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    avisoGuardado = e as BeforeInstallPromptEvent;
    oyentes.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    avisoGuardado = null;
    oyentes.forEach((f) => f());
  });
}

export function avisoInstalacion() {
  return avisoGuardado;
}

export function suscribirseAlAviso(f: () => void) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

export function consumirAvisoInstalacion() {
  avisoGuardado = null;
  oyentes.forEach((f) => f());
}
