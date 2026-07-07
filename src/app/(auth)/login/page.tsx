import Link from "next/link";
import { signIn } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Iniciar sesión — Lamelas & Chaumont" };

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <AuthForm action={signIn} submitLabel="Entrar" pendingLabel="Entrando...">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
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
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-primary hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
