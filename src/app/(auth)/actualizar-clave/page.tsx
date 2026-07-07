import { updatePassword } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Nueva contraseña — Lamelas & Chaumont" };

export default function ActualizarClavePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
      <AuthForm
        action={updatePassword}
        submitLabel="Guardar contraseña"
        pendingLabel="Guardando..."
      >
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña nueva (mín. 8 caracteres)</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </AuthForm>
    </div>
  );
}
