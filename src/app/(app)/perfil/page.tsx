import { updateProfile } from "@/actions/profile";
import { AuthForm } from "@/components/auth/auth-form";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Rol } from "@/lib/types";
import { getPerfil } from "@/lib/queries";

export const metadata = { title: "Mi perfil — Lamelas & Chaumont" };

const ROL_LABEL: Record<Rol, string> = {
  super_admin: "Soporte",
  admin: "Administrador",
  agente: "Vendedor",
};

function getIniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

export default async function PerfilPage() {
  const profile = await getPerfil();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Administra tu información personal</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <Avatar size="lg" className="size-20">
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
              {profile ? getIniciales(profile.nombre) : ""}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <p className="text-lg font-semibold">{profile?.nombre}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>

          {profile && <Badge>{ROL_LABEL[profile.rol as Rol]}</Badge>}

          <Separator className="my-2" />

          <AuthForm
            action={updateProfile}
            submitLabel="Guardar cambios"
            pendingLabel="Guardando..."
          >
            <div className="space-y-2 text-left">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                autoComplete="name"
                defaultValue={profile?.nombre ?? ""}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
            </div>
          </AuthForm>

          <Separator className="my-2" />

          <div className="flex w-full flex-col items-start gap-2 text-left">
            <ChangePasswordDialog />
          </div>
        </CardContent>
      </Card>

      {profile?.created_at && (
        <p className="text-xs text-muted-foreground">
          Cuenta creada el {new Date(profile.created_at).toLocaleDateString("es-AR")}.
        </p>
      )}
    </div>
  );
}
