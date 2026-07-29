"use client";

import { useId, useState, useTransition } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { changeUserPassword } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import type { Usuario } from "@/lib/types";

const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const NUMEROS = "23456789";
const ESPECIALES = "!@#$%^&*-_=+";

function generarPasswordSegura() {
  const pick = (chars: string) => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return chars[bytes[0] % chars.length];
  };
  const todos = MAYUSCULAS + MINUSCULAS + NUMEROS + ESPECIALES;
  const obligatorios = [pick(MAYUSCULAS), pick(MINUSCULAS), pick(NUMEROS), pick(ESPECIALES)];
  const resto = Array.from({ length: 8 }, () => pick(todos));

  const password = [...obligatorios, ...resto];
  for (let i = password.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join("");
}

export function ChangeUserPasswordDialog({ usuario }: { usuario: Usuario }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const passwordId = useId();
  const notifyId = useId();
  const formId = useId();

  if (usuario.rol === "super_admin") return null;

  function reset() {
    setNewPassword("");
    setNotify(true);
    setError(undefined);
    setSuccess(undefined);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) reset();
  }

  function handleGenerate() {
    setNewPassword(generarPasswordSegura());
    setError(undefined);
    setSuccess(undefined);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    startTransition(async () => {
      const result = await changeUserPassword(usuario.id, {
        new_password: newPassword,
        notify,
      });

      if (result) {
        setError(result);
        return;
      }

      setNewPassword("");
      const message = notify
        ? "Contraseña actualizada. Le enviamos un email al usuario."
        : "Contraseña actualizada.";
      setSuccess(message);
      toast.success(message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <KeyRound /> Cambiar contraseña
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Nueva contraseña temporal para {usuario.nombre} ({usuario.email}).
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={passwordId}>Nueva contraseña</Label>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleGenerate}
                disabled={pending}
                aria-label="Generar contraseña segura"
                title="Generar contraseña segura"
              >
                <Sparkles className="size-4" />
              </Button>
            </div>
            <PasswordInput
              id={passwordId}
              name="new_password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(undefined);
                setSuccess(undefined);
              }}
              required
              minLength={8}
              disabled={pending}
              aria-invalid={error ? true : undefined}
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>

          <label
            htmlFor={notifyId}
            className="flex items-start gap-3 border bg-muted/30 p-3 text-sm"
          >
            <input
              id={notifyId}
              type="checkbox"
              checked={notify}
              disabled={pending}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="font-medium">Enviar por email al usuario</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Si está activo, el usuario recibirá un email con la contraseña temporal
                y deberá cambiarla luego.
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cerrar
          </Button>
          <Button type="submit" form={formId} disabled={pending || newPassword.length < 8}>
            {pending ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
