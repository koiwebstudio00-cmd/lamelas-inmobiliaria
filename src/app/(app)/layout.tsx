import Link from "next/link";
import { Building2, Plus, User, UserCog, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-secondary">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/propiedades" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold">Lamelas & Chaumont</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/propiedades">
                <Building2 /> Propiedades
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/mis-propiedades">
                <User /> <span className="hidden sm:inline">Mis propiedades</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/propiedades/nueva">
                <Plus /> <span className="hidden sm:inline">Nueva</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Mi perfil">
              <Link href="/perfil">
                <UserCog />
              </Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Cerrar sesión">
                <LogOut />
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
