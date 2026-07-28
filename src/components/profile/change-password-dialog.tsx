"use client";

import { useId, useState, useTransition } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/actions/profile";
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
import { cn } from "@/lib/utils";

const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const NUMEROS = "23456789";
const ESPECIALES = "!@#$%^&*-_=+";

function generarPasswordSegura() {
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const todos = MAYUSCULAS + MINUSCULAS + NUMEROS + ESPECIALES;

  const obligatorios = [pick(MAYUSCULAS), pick(MINUSCULAS), pick(NUMEROS), pick(ESPECIALES)];
  const resto = Array.from({ length: 8 }, () => pick(todos));

  return [...obligatorios, ...resto].sort(() => Math.random() - 0.5).join("");
}

const REQUISITOS: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: "length", label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { key: "mayuscula", label: "Una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { key: "minuscula", label: "Una minúscula", test: (v) => /[a-z]/.test(v) },
  { key: "numero", label: "Un número", test: (v) => /[0-9]/.test(v) },
  { key: "especial", label: "Un caracter especial", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const initialAuthState = {};

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const formId = useId();

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(undefined);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) reset();
  }

  const cumple = Object.fromEntries(REQUISITOS.map((r) => [r.key, r.test(newPassword)]));
  const esSegura = REQUISITOS.every((r) => cumple[r.key]);
  const coincide = confirmPassword.length > 0 && newPassword === confirmPassword;

  function handleGenerar() {
    const nueva = generarPasswordSegura();
    setNewPassword(nueva);
    setConfirmPassword(nueva);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);

    const formData = new FormData();
    formData.set("current_password", currentPassword);
    formData.set("new_password", newPassword);

    startTransition(async () => {
      const result = await changePassword(initialAuthState, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(result.success ?? "Contraseña actualizada.");
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <KeyRound className="size-4" />
          Actualizar contraseña
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar contraseña</DialogTitle>
          <DialogDescription>
            Ingresá tu contraseña actual y elegí una nueva.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Contraseña actual</Label>
            <PasswordInput
              id="current_password"
              name="current_password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="new_password">Contraseña nueva</Label>
              <button
                type="button"
                onClick={handleGenerar}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Sparkles className="size-3" />
                Generar segura
              </button>
            </div>
            <PasswordInput
              id="new_password"
              name="new_password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar contraseña</Label>
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword.length > 0 && !coincide && (
              <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
            )}
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {REQUISITOS.map((r) => (
              <li
                key={r.key}
                className={cn("flex items-center gap-1.5", cumple[r.key] && "text-primary")}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full bg-muted-foreground/40",
                    cumple[r.key] && "bg-primary"
                  )}
                />
                {r.label}
              </li>
            ))}
          </ul>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={pending || !esSegura || !coincide}>
            {pending ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
