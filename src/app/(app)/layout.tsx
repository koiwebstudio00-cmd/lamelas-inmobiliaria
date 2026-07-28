import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav/app-nav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // El middleware ya frena a quien no tiene sesión; esto cubre el caso de un
  // access vencido entre medio y le da a la navegación el rol para filtrarse.
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  // `sidebar_state` la escribe el propio SidebarProvider al abrir o cerrar la
  // barra. Leerla acá, en el server, evita que la primera pintura muestre la
  // barra abierta y después salte a cerrada.
  const cookieStore = await cookies();
  const abiertaPorDefecto = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={abiertaPorDefecto}>
      <AppNav nombre={me.nombre} email={me.email} rol={me.rol} />
      <SidebarInset className="bg-secondary">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
        </header>
        <div className="mx-auto w-full p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
