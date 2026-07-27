import Link from "next/link";
import { updatePassword } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Nueva contraseña — Lamelas & Chaumont" };

export default async function ActualizarClavePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) return <LinkInvalido />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
      <AuthForm
        action={updatePassword}
        submitLabel="Guardar contraseña"
        pendingLabel="Guardando..."
      >
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña nueva (mín. 8 caracteres)</Label>
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
        Este link para cambiar la contraseña está incompleto o venció. Pedí uno
        nuevo desde &laquo;Olvidé mi contraseña&raquo;.
      </p>
      <p className="text-sm">
        <Link href="/recuperar" className="text-primary hover:underline">
          Pedir un link nuevo
        </Link>
      </p>
    </div>
  );
}
