import Link from "next/link";
import { signUp } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Crear cuenta — Lamelas & Chaumont" };

export default function RegistroPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <AuthForm action={signUp} submitLabel="Crear cuenta" pendingLabel="Creando...">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input id="nombre" name="nombre" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
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
      <p className="text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
