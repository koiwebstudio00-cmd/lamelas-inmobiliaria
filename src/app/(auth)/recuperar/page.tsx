import Link from "next/link";
import { recoverPassword } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Recuperar contraseña — Lamelas & Chaumont" };

export default function RecuperarPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
      <p className="text-sm text-muted-foreground">
        Te enviamos un link por email para restablecerla.
      </p>
      <AuthForm
        action={recoverPassword}
        submitLabel="Enviar link"
        pendingLabel="Enviando..."
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
      </AuthForm>
      <p className="text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
