"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  Inbox,
  KeyRound,
  LogOut,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
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
import { signOut } from "@/actions/auth";
import type { Rol } from "@/lib/types";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  soloAdmin: boolean;
  subs: { href: string; label: string }[];
};

/**
 * Navegación del panel, armada sobre el bloque `sidebar-03` de shadcn: un ítem
 * por sección y, colgando de las que tienen pantallas propias, un submenú.
 */
const ITEMS: Item[] = [
  { href: "/", label: "Inicio", icon: Home, soloAdmin: false, subs: [] },
  {
    href: "/propiedades",
    label: "Propiedades",
    icon: Building2,
    soloAdmin: false,
    subs: [
      { href: "/mis-propiedades", label: "Mis propiedades" },
      { href: "/propiedades/nueva", label: "Cargar propiedad" },
    ],
  },
  {
    href: "/consultas",
    label: "Consultas",
    icon: Inbox,
    soloAdmin: false,
    subs: [{ href: "/consultas/nueva", label: "Cargar consulta" }],
  },
  { href: "/equipo", label: "Equipo", icon: Users, soloAdmin: true, subs: [] },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: KeyRound,
    soloAdmin: true,
    subs: [],
  },
  { href: "/perfil", label: "Mi perfil", icon: UserCog, soloAdmin: false, subs: [] },
];

/** "/" solo marca activo en su propia ruta; el resto también en sus hijos. */
function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ nombre, rol }: { nombre: string; rol: Rol }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const esAdmin = rol === "admin" || rol === "super_admin";
  const items = ITEMS.filter((i) => !i.soloAdmin || esAdmin);

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
            <SidebarMenuButton asChild size="lg">
              <Link href="/" onClick={alNavegar}>
                <Logo className="size-7 shrink-0" />
                <span className="truncate font-semibold">Lamelas &amp; Chaumont</span>
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
                const subActivo = item.subs.some((s) => esActivo(pathname, s.href));
                // El padre se apaga cuando el activo es un hijo, así nunca
                // quedan dos ítems marcados a la vez.
                const activo = esActivo(pathname, item.href) && !subActivo;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={activo} tooltip={item.label}>
                      <Link
                        href={item.href}
                        onClick={alNavegar}
                        aria-current={activo ? "page" : undefined}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.subs.length > 0 && (
                      <SidebarMenuSub>
                        {item.subs.map((sub) => {
                          const subEsActivo = esActivo(pathname, sub.href);
                          return (
                            <SidebarMenuSubItem key={sub.href}>
                              <SidebarMenuSubButton asChild isActive={subEsActivo}>
                                <Link
                                  href={sub.href}
                                  onClick={alNavegar}
                                  aria-current={subEsActivo ? "page" : undefined}
                                >
                                  <span>{sub.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <p className="min-w-0 truncate px-2 text-xs text-muted-foreground">{nombre}</p>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Cerrar sesión">
              <LogOut />
            </Button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
