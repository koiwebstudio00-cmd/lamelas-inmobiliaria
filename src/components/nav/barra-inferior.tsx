"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type SVGProps } from "react";
import { Building2, ClipboardList, Home, Inbox, Menu, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Barra de navegación inferior, solo en el celular (< md). Deja a un toque lo
 * que más usan los vendedores (inicio, propiedades, consultas), un botón
 * central para cargar algo nuevo y "Menú", que abre el cajón con el resto.
 *
 * Se esconde en los formularios de alta y edición: ahí manda la barra de
 * guardar/siguiente del propio formulario y no conviene salir sin querer.
 */
const OCULTA_EN = [
  /^\/propiedades\/nueva$/,
  /^\/propiedades\/[^/]+\/editar$/,
  /^\/consultas\/nueva$/,
  /^\/captaciones\/nueva$/,
  /^\/captaciones\/[^/]+\/editar$/,
];

type Destino = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  activo: (p: string) => boolean;
};

const IZQUIERDA: Destino[] = [
  { href: "/", label: "Inicio", icon: Home, activo: (p) => p === "/" },
  {
    href: "/propiedades",
    label: "Propiedades",
    icon: Building2,
    activo: (p) => p.startsWith("/propiedades") || p.startsWith("/mis-propiedades"),
  },
];

const ACCIONES = [
  {
    href: "/propiedades/nueva",
    label: "Nueva propiedad",
    detalle: "Cargá una propiedad con fotos",
    icon: Building2,
  },
  {
    href: "/consultas/nueva",
    label: "Nueva consulta",
    detalle: "Registrá a alguien que te contactó",
    icon: Inbox,
  },
  {
    href: "/captaciones/nueva",
    label: "Nueva captación",
    detalle: "Armá el mensaje para el grupo de WhatsApp",
    icon: ClipboardList,
  },
];

export function BarraInferior({ consultasSinTomar }: { consultasSinTomar: number }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [nuevoAbierto, setNuevoAbierto] = useState(false);

  if (OCULTA_EN.some((r) => r.test(pathname))) return null;

  const consultasActivo = pathname.startsWith("/consultas");

  return (
    <>
      {/* Espacio para que la barra fija no tape el final de la página. */}
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden print:hidden" />

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden print:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {IZQUIERDA.map((d) => (
            <li key={d.href}>
              <ItemBarra {...d} activo={d.activo(pathname)} />
            </li>
          ))}

          <li className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setNuevoAbierto(true)}
              aria-label="Cargar algo nuevo"
              className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-[scale,box-shadow] duration-200 active:scale-90"
            >
              <Plus className="size-6" />
            </button>
          </li>

          <li>
            <ItemBarra
              href="/consultas"
              label="Consultas"
              icon={Inbox}
              activo={consultasActivo}
              badge={consultasSinTomar}
            />
          </li>

          <li>
            <button
              type="button"
              onClick={() => setOpenMobile(true)}
              className="group flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:text-foreground"
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,scale] duration-200 group-active:scale-90">
                <Menu className="size-5" />
              </span>
              Menú
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={nuevoAbierto} onOpenChange={setNuevoAbierto}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-0">
            <SheetTitle>¿Qué querés cargar?</SheetTitle>
            <SheetDescription className="sr-only">Accesos rápidos para cargar algo nuevo</SheetDescription>
          </SheetHeader>
          <ul className="space-y-1 px-2">
            {ACCIONES.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  prefetch={false}
                  onClick={() => setNuevoAbierto(false)}
                  className="flex items-center gap-3 rounded-xl p-3 transition-[background-color,scale] duration-200 hover:bg-muted active:scale-[0.98] active:bg-muted"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <a.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{a.label}</span>
                    <span className="block text-sm text-muted-foreground">{a.detalle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ItemBarra({
  href,
  label,
  icon: Icon,
  activo,
  badge = 0,
}: Omit<Destino, "activo"> & { activo: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "group flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
        activo ? "text-primary" : "text-muted-foreground active:text-foreground",
      )}
    >
      <span
        className={cn(
          "relative flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,scale] duration-200 group-active:scale-90",
          activo && "bg-accent",
        )}
      >
        <Icon className="size-5" />
        {badge > 0 && (
          <span className="absolute -top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
