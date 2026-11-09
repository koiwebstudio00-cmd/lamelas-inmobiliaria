import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { AppNav } from "@/components/nav/app-nav";
import { BarraInferior } from "@/components/nav/barra-inferior";
import { SelectorTema } from "@/components/nav/selector-tema";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { PwaInit } from "@/components/pwa/pwa-init";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import {
  getConsultasSinTomarCount,
  getIncidentesCriticosAbiertosCount,
  getResumenNotificaciones,
} from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // El middleware ya frena a quien no tiene sesión; esto cubre el caso de un
  // access vencido entre medio y le da a la navegación el rol para filtrarse.
  const mePromise = getCurrentUser();
  const [me, consultasSinTomar, notificaciones, incidentesCriticos] = await Promise.all([
    mePromise,
    getConsultasSinTomarCount(),
    getResumenNotificaciones(),
    // Solo admin (a un vendedor la API le responde 403). Encadenado al usuario
    // para que corra en paralelo con el resto y no sume un viaje más.
    mePromise.then((u) => (u && esAdmin(u.rol) ? getIncidentesCriticosAbiertosCount() : 0)),
  ]);
  if (!me) redirect("/login");

  // `sidebar_state` la escribe el propio SidebarProvider al abrir o cerrar la
  // barra. Leerla acá, en el server, evita que la primera pintura muestre la
  // barra abierta y después salte a cerrada.
  const cookieStore = await cookies();
  const abiertaPorDefecto = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={abiertaPorDefecto}>
      {/* Service worker de la app instalable y de los avisos push (PUSH-PWA-01). */}
      <PwaInit />
      <AppNav
        nombre={me.nombre}
        email={me.email}
        rol={me.rol}
        consultasSinTomar={consultasSinTomar}
        incidentesCriticos={incidentesCriticos}
      />
      {/* `min-w-0`: sin esto una tabla ancha estira la página entera en vez de
          scrollear dentro de su contenedor (y la campanita queda fuera de vista). */}
      <SidebarInset className="min-w-0 bg-muted/50">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-lg print:hidden">
          {/* En el celular el menú está en la barra inferior: arriba va la marca. */}
          <SidebarTrigger className="hidden md:inline-flex" />
          <Link href="/" prefetch={false} className="flex items-center gap-2 font-semibold md:hidden">
            <Logo className="size-7" />
            Lamelas &amp; Chaumont
          </Link>
          {/* Campanita a la derecha: avisos internos (reemplazan a los correos). */}
          <div className="ml-auto flex items-center gap-1">
            <SelectorTema />
            <NotificationsBell inicial={notificaciones} />
          </div>
        </header>
        <div className="mx-auto w-full p-4 sm:p-6 print:p-0">{children}</div>
        <BarraInferior consultasSinTomar={consultasSinTomar} />
      </SidebarInset>
    </SidebarProvider>
  );
}
