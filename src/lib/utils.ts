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

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
