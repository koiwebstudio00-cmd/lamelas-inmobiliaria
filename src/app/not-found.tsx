import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

/**
 * Cubre tanto una URL inventada como una propiedad o consulta que existe pero
 * no es tuya: la API responde 403 y las páginas lo tratan igual que un 404,
 * para no delatar qué hay cargado del otro lado.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-secondary p-6 text-center">
      <Logo className="size-10" />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
        <p className="text-sm text-muted-foreground">
          Puede que el link esté mal, que se haya eliminado, o que no tengas
          permiso para verla.
        </p>
      </div>
      <Button asChild>
        <Link href="/" prefetch={false}>Volver al inicio</Link>
      </Button>
    </div>
  );
}
