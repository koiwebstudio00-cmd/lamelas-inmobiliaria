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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Link `wa.me` para abrir un chat de WhatsApp con el teléfono del lead.
 *
 * Kapso guarda los números argentinos sin el `9` de celular (ej.
 * `543815773949`), pero WhatsApp lo necesita para celulares. Si el número
 * empieza en `54` y no tiene el `9` justo después, se lo inserta. Números de
 * otros países quedan tal cual (solo se limpian los no-dígitos).
 */
export function waLink(telefono: string) {
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("54") && d[2] !== "9") {
    d = "549" + d.slice(2);
  }
  return `https://wa.me/${d}`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
