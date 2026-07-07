import { KeyRound, UserRound } from "lucide-react";
import { updateProfile, changePassword } from "@/actions/profile";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export const metadata = { title: "Mi perfil — Lamelas & Chaumont" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user!.id)
    .single<UserProfile>();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <UserRound className="size-5 text-primary" />
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <AuthForm
            action={updateProfile}
            submitLabel="Guardar cambios"
            pendingLabel="Guardando..."
          >
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                name="nombre"
                autoComplete="name"
                defaultValue={profile?.nombre ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">
                El email es tu usuario de acceso y no se puede cambiar.
              </p>
            </div>
          </AuthForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <KeyRound className="size-5 text-primary" />
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <AuthForm
            action={changePassword}
            submitLabel="Cambiar contraseña"
            pendingLabel="Cambiando..."
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
        </CardContent>
      </Card>

      {profile && (
        <p className="text-xs text-muted-foreground">
          Cuenta creada el {new Date(profile.created_at).toLocaleDateString("es-AR")}.
        </p>
      )}
    </div>
  );
}
