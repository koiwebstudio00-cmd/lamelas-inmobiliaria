import Link from "next/link";
import { signIn } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Iniciar sesión — Lamelas & Chaumont" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ clave?: string }>;
}) {
  const { clave } = await searchParams;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      {clave === "actualizada" && (
        <p className="text-sm text-primary">
          Listo, cambiamos tu contraseña. Entrá con la nueva.
        </p>
      )}
      <AuthForm action={signIn} submitLabel="Entrar" pendingLabel="Entrando...">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
      </AuthForm>
      <div className="space-y-1 text-sm">
        <p>
          <Link href="/recuperar" className="text-primary hover:underline">
            Olvidé mi contraseña
          </Link>
        </p>
        <p className="text-muted-foreground">
          Las cuentas las crea un administrador: si no tenés uno, pedile que te
          invite.
        </p>
      </div>
    </div>
  );
}
