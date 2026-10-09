import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Colores suaves para distinguir de un vistazo quién escribe en el hilo.
const COLORES = [
  "bg-emerald-100 text-emerald-900",
  "bg-sky-100 text-sky-900",
  "bg-violet-100 text-violet-900",
  "bg-amber-100 text-amber-900",
  "bg-rose-100 text-rose-900",
  "bg-teal-100 text-teal-900",
];

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : (partes[0] ?? "?").slice(0, 2);
  return letras.toUpperCase();
}

function color(clave: string) {
  let h = 0;
  for (const c of clave) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}

/** Avatar con iniciales y un color estable por persona. */
export function AutorAvatar({
  id,
  nombre,
  className,
}: {
  id: string;
  nombre: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9", className)} aria-hidden>
      <AvatarFallback className={cn("text-xs font-semibold", color(id || nombre))}>
        {iniciales(nombre)}
      </AvatarFallback>
    </Avatar>
  );
}
