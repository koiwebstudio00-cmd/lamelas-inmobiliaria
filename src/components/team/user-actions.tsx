"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ChangeUserPasswordDialog } from "@/components/team/change-user-password-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateUsuario } from "@/actions/team";
import { ROLES } from "@/lib/types";
import type { Usuario } from "@/lib/types";

/**
 * Cambiar rol y activar/desactivar. No hay borrado: si se elimina al usuario
 * se pierde de quién era cada propiedad y cada consulta.
 *
 * Un super_admin no se toca desde acá, y nadie puede editarse a sí mismo:
 * evita quedarse afuera del panel por accidente.
 */
export function UserActions({ usuario, esYo }: { usuario: Usuario; esYo: boolean }) {
  const [pending, startTransition] = useTransition();
  const inactivo = usuario.estado === "inactivo";

  if (usuario.rol === "super_admin" || esYo) {
    return (
      <p className="text-xs text-muted-foreground">
        {esYo ? "Sos vos" : "Cuenta de soporte"}
      </p>
    );
  }

  function run(cambio: Parameters<typeof updateUsuario>[1], ok: string) {
    startTransition(async () => {
      const error = await updateUsuario(usuario.id, cambio);
      if (error) toast.error(error);
      else toast.success(ok);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChangeUserPasswordDialog usuario={usuario} />

      <Select
        defaultValue={usuario.rol}
        disabled={pending}
        aria-label={`Rol de ${usuario.nombre}`}
        className="h-9 w-40 text-sm"
        onChange={(e) =>
          run({ rol: e.target.value as "admin" | "agente" }, "Rol actualizado")
        }
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>

      {inactivo ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run({ estado: "activo" }, "Usuario reactivado")}
        >
          Reactivar
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              Desactivar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Desactivar a {usuario.nombre}?</AlertDialogTitle>
              <AlertDialogDescription>
                No va a poder entrar más al panel. Sus propiedades y sus consultas
                quedan como están, y podés reactivarlo cuando quieras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run({ estado: "inactivo" }, "Usuario desactivado")}
              >
                Desactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
