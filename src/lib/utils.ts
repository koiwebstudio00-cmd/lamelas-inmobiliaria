import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * La API ya devuelve la URL absoluta de la foto (R2 resuelto del lado del
 * backend). Queda como identidad para no tocar los componentes que la llaman.
 *
 * OJO: `npx shadcn add` reescribe este archivo con su versión por defecto y se
 * lleva puestas todas estas funciones. Si después de correr el CLI el build
 * falla con "Export formatDateTime doesn't exist", es esto.
 */
export function imageUrl(path: string) {
  return path;
}

export function formatPrice(precio: number, moneda: string) {
  return `${moneda} ${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(precio)}`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Tucuman",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Link `wa.me` para escribirle por WhatsApp al teléfono de un lead, o null si
 * no se puede armar con certeza (entonces se muestra solo el teléfono).
 *
 * Los teléfonos llegan como los escribió la persona ("0381 15-577-3949",
 * "381 5773949", "+54 9 381 577-3949") o como los guarda el proveedor de
 * WhatsApp ("543815773949", sin el 9 de celular). WhatsApp necesita 54 9 +
 * característica + número, sin el 0 ni el 15. Un número de otro país (con +)
 * queda tal cual. Misma lógica que el backend: back-lamelas/src/lib/telefono.ts.
 */
export function waLink(
  telefono: string | null | undefined,
  canal?: string | null
): string | null {
  if (!telefono) return null;
  const crudo = telefono.trim();
  let d = crudo.replace(/\D/g, "");
  // Los de WhatsApp los guarda el proveedor ya en formato internacional, sin
  // "+" (un número de España llega como 34612345678).
  const internacional = crudo.startsWith("+") || d.startsWith("00") || canal === "whatsapp";
  if (d.startsWith("00")) d = d.slice(2);
  if (internacional && !d.startsWith("54")) {
    return d.length >= 8 && d.length <= 15 ? `https://wa.me/${d}` : null;
  }
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 12) {
    for (const largo of [3, 4, 2]) {
      if (d.slice(largo, largo + 2) === "15") {
        d = d.slice(0, largo) + d.slice(largo + 2);
        break;
      }
    }
  }
  return d.length === 10 ? `https://wa.me/549${d}` : null;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Tucuman",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Tiempo relativo corto para listas de actividad: "recién", "hace 5 min",
 * "hace 3 h", "ayer"; pasados dos días, la fecha. `now` es inyectable para que
 * el server y el cliente puedan renderizar lo mismo.
 */
export function formatRelative(iso: string, now: Date = new Date()) {
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  if (horas < 48) return "ayer";
  return formatDate(iso);
}
