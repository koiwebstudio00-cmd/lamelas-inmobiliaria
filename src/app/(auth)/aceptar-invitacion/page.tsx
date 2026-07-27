import Link from "next/link";
import { acceptInvitation } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Aceptar invitación — Lamelas & Chaumont" };

export default async function AceptarInvitacionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) return <LinkInvalido />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Crear tu cuenta</h1>
      <p className="text-sm text-muted-foreground">
        Elegí tu nombre y una contraseña para entrar al panel.
      </p>
      <AuthForm
        action={acceptInvitation}
        submitLabel="Crear cuenta"
        pendingLabel="Creando..."
      >
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input id="nombre" name="nombre" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña (mín. 8 caracteres)</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </AuthForm>
    </div>
  );
}

function LinkInvalido() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Link inválido</h1>
      <p className="text-sm text-muted-foreground">
        Este link de invitación está incompleto o venció. Pedile a un
        administrador que te invite de nuevo.
      </p>
      <p className="text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Ir a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
