"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEdificio, renameEdificio } from "@/actions/edificios";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Renombrar y borrar un edificio. Solo se renderiza para admins. */
export function EdificioActions({
  id,
  nombre,
  unidades,
}: {
  id: string;
  nombre: string;
  unidades: number;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(nombre);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) setValor(nombre);
        }}
      >
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Renombrar ${nombre}`}>
            <Pencil />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renombrar edificio</DialogTitle>
            <DialogDescription>
              El nombre se muestra en el panel, en el sitio y lo usa Martina.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              startTransition(async () => {
                const error = await renameEdificio(id, valor);
                if (error) toast.error(error);
                else {
                  toast.success("Edificio renombrado");
                  setOpen(false);
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`edificio-${id}`}>Nombre</Label>
              <Input
                id={`edificio-${id}`}
                value={valor}
                onChange={(ev) => setValor(ev.target.value)}
                maxLength={120}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Borrar ${nombre}`}>
            <Trash2 className="text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar «{nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>
              {unidades === 0
                ? "No tiene unidades vinculadas."
                : `Sus ${unidades} ${unidades === 1 ? "unidad queda" : "unidades quedan"} como ${unidades === 1 ? "propiedad suelta" : "propiedades sueltas"}: no se borra ninguna propiedad.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const error = await deleteEdificio(id);
                  if (error) toast.error(error);
                  else toast.success("Edificio borrado");
                })
              }
            >
              {pending ? "Borrando..." : "Borrar edificio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
