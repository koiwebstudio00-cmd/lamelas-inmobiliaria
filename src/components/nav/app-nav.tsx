"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronRight,
  HeartHandshake,
  Home,
  Inbox,
  KeyRound,
  Megaphone,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Logo } from "@/components/logo";
import { NavUser } from "@/components/nav/nav-user";
import { esAdmin } from "@/lib/permisos";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Rol } from "@/lib/types";

type Sub = {
  href: string;
  label: string;
  /** Rutas hijas que también marcan activo a este sub (ej. el detalle). */
  incluye?: string[];
};

type Item = {
  href?: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  soloAdmin: boolean;
  subs: Sub[];
};

/**
 * Navegación del panel. Las secciones con pantallas propias son grupos
 * desplegables: tocar el padre abre y cierra, no navega — el listado de la
 * sección es el primer hijo. Así cada fila hace una sola cosa, que en el
 * celular es la diferencia entre abrir el grupo y salir navegando sin querer.
 */
const ITEMS: Item[] = [
  { href: "/", label: "Inicio", icon: Home, soloAdmin: false, subs: [] },
  {
    label: "Propiedades",
    icon: Building2,
    soloAdmin: false,
    subs: [
      // El detalle y la edición cuelgan de /propiedades/:id, así que marcan
      // activo al listado. `nueva` es la excepción: tiene su propia fila.
      { href: "/propiedades", label: "Todas las propiedades", incluye: ["/propiedades/"] },
      { href: "/mis-propiedades", label: "Mis propiedades" },
      { href: "/propiedades/nueva", label: "Nueva propiedad" },
    ],
  },
  {
    label: "Consultas",
    icon: Inbox,
    soloAdmin: false,
    subs: [
      { href: "/consultas", label: "Todas las consultas", incluye: ["/consultas/"] },
      { href: "/consultas/nueva", label: "Nueva consulta" },
    ],
  },
  {
    label: "Feedback",
    icon: Megaphone,
    soloAdmin: false,
    subs: [
      { href: "/feedback/sugerencias", label: "Sugerencias", incluye: ["/feedback/sugerencias/"] },
      { href: "/feedback/reportes", label: "Reportes de error", incluye: ["/feedback/reportes/"] },
    ],
  },
  {
    label: "WhatsApp",
    icon: WhatsappIcon,
    soloAdmin: true,
    subs: [
      { href: "/probar-agente", label: "Probar agente" },
      { href: "/whatsapp/conectar", label: "Conectar número" },
    ],
  },
  { href: "/clientes", label: "Clientes", icon: HeartHandshake, soloAdmin: true, subs: [] },
  { href: "/equipo", label: "Equipo", icon: Users, soloAdmin: true, subs: [] },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: KeyRound,
    soloAdmin: true,
    subs: [],
  },
];

/** "/" solo marca activo en su propia ruta; el resto también en sus hijos. */
function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Un sub marca activo en su ruta exacta y, si lo declara, en los prefijos de
 * `incluye`. Se evalúan de más específico a menos: `/propiedades/nueva` gana
 * sobre el prefijo `/propiedades/` del listado.
 */
function subActivo(pathname: string, sub: Sub, hermanos: Sub[]) {
  if (pathname === sub.href) return true;
  if (!sub.incluye?.some((p) => pathname.startsWith(p))) return false;
  return !hermanos.some((h) => h !== sub && pathname === h.href);
}

export function AppNav({
  nombre,
  email,
  rol,
}: {
  nombre: string;
  email: string;
  rol: Rol;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const items = ITEMS.filter((i) => !i.soloAdmin || esAdmin(rol));

  // En el celular el cajón tapa la pantalla: al tocar un link hay que cerrarlo.
  // En escritorio la barra es fija y no hay nada que cerrar.
  const alNavegar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-16 gap-3 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:gap-0 [&>svg]:size-10"
            >
              <Link href="/" prefetch={false} onClick={alNavegar}>
                <Logo className="shrink-0" />
                <span className="flex flex-col font-semibold leading-tight">
                  <span>Lamelas &amp;</span>
                  <span>Chaumont</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                // Sección sin hijos: la fila es un link común.
                if (item.subs.length === 0) {
                  const activo = esActivo(pathname, item.href!);
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild isActive={activo} tooltip={item.label}>
                        <Link
                          href={item.href!}
                          prefetch={false}
                          onClick={alNavegar}
                          aria-current={activo ? "page" : undefined}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Grupo desplegable: arranca abierto si estás parado en alguno
                // de sus hijos, para que nunca tengas que buscar dónde estás.
                const hayHijoActivo = item.subs.some((s) => subActivo(pathname, s, item.subs));

                return (
                  <Collapsible
                    key={item.label}
                    asChild
                    defaultOpen={hayHijoActivo}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={hayHijoActivo} tooltip={item.label}>
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subs.map((sub) => {
                            const activo = subActivo(pathname, sub, item.subs);
                            return (
                              <SidebarMenuSubItem key={sub.href}>
                                <SidebarMenuSubButton asChild isActive={activo}>
                                  <Link
                                    href={sub.href}
                                    prefetch={false}
                                    onClick={alNavegar}
                                    aria-current={activo ? "page" : undefined}
                                  >
                                    <span>{sub.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser nombre={nombre} email={email} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
