import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav/app-nav";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/api";
import { getConsultasSinTomarCount, getResumenNotificaciones } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // El middleware ya frena a quien no tiene sesión; esto cubre el caso de un
  // access vencido entre medio y le da a la navegación el rol para filtrarse.
  const [me, consultasSinTomar, notificaciones] = await Promise.all([
    getCurrentUser(),
    getConsultasSinTomarCount(),
    getResumenNotificaciones(),
  ]);
  if (!me) redirect("/login");

  // `sidebar_state` la escribe el propio SidebarProvider al abrir o cerrar la
  // barra. Leerla acá, en el server, evita que la primera pintura muestre la
  // barra abierta y después salte a cerrada.
  const cookieStore = await cookies();
  const abiertaPorDefecto = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={abiertaPorDefecto}>
      <AppNav
        nombre={me.nombre}
        email={me.email}
        rol={me.rol}
        consultasSinTomar={consultasSinTomar}
      />
      {/* `min-w-0`: sin esto una tabla ancha estira la página entera en vez de
          scrollear dentro de su contenedor (y la campanita queda fuera de vista). */}
      <SidebarInset className="min-w-0 bg-secondary">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 print:hidden">
          <SidebarTrigger />
          {/* Campanita a la derecha: avisos internos (reemplazan a los correos). */}
          <div className="ml-auto">
            <NotificationsBell inicial={notificaciones} />
          </div>
        </header>
        <div className="mx-auto w-full p-4 sm:p-6 print:p-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
