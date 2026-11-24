"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { eliminarFotoCaptacion } from "@/actions/captaciones";
import { Button } from "@/components/ui/button";
import { MAX_FOTOS_CAPTACION } from "@/lib/captacion";
import type { CaptacionFoto } from "@/lib/types";
import { imageUrl } from "@/lib/utils";

/**
 * Fotos de la captación (round-edits item 2). Las ya guardadas se pueden
 * borrar; las nuevas quedan en el navegador y el formulario las sube al
 * guardar (igual que en "Nueva propiedad"). No van en el mensaje del grupo.
 */
export function CaptacionFotos({
  captacionId,
  fotos,
  onFotosChange,
  pendientes,
  onPendientesChange,
  bloqueado,
}: {
  captacionId: string | null;
  fotos: CaptacionFoto[];
  onFotosChange: (fotos: CaptacionFoto[]) => void;
  pendientes: File[];
  onPendientesChange: (files: File[]) => void;
  bloqueado?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const total = fotos.length + pendientes.length;
  const lleno = total >= MAX_FOTOS_CAPTACION;

  // Vistas previas de las fotos sin subir; se liberan al cambiar la lista.
  const previas = useMemo(() => pendientes.map((f) => URL.createObjectURL(f)), [pendientes]);
  useEffect(() => () => previas.forEach((u) => URL.revokeObjectURL(u)), [previas]);

  const agregar = (lista: FileList | null) => {
    if (!lista || lista.length === 0) return;
    const lugar = MAX_FOTOS_CAPTACION - total;
    const nuevas = Array.from(lista).slice(0, Math.max(0, lugar));
    if (nuevas.length < lista.length) toast.warning(`Máximo ${MAX_FOTOS_CAPTACION} fotos por captación.`);
    if (nuevas.length > 0) onPendientesChange([...pendientes, ...nuevas]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const borrar = async (foto: CaptacionFoto) => {
    if (!captacionId) return;
    setBorrando(foto.id);
    const error = await eliminarFotoCaptacion(foto.id, captacionId);
    setBorrando(null);
    if (error) toast.error(error);
    else onFotosChange(fotos.filter((f) => f.id !== foto.id));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => agregar(e.target.files)}
      />
      {total === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={bloqueado}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <ImagePlus className="size-6" />
          Tocá para agregar fotos (máx. {MAX_FOTOS_CAPTACION}). Se guardan con la captación; no se mandan al grupo.
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotos.map((foto, i) => (
              <div key={foto.id} className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
                <Image
                  src={imageUrl(foto.url)}
                  alt={`Foto ${i + 1} de la captación`}
                  fill
                  sizes="(min-width: 640px) 25vw, 33vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  aria-label="Eliminar foto"
                  onClick={() => borrar(foto)}
                  disabled={bloqueado || borrando !== null}
                  className="absolute right-1 top-1 rounded-sm bg-destructive p-1 text-destructive-foreground disabled:opacity-60"
                >
                  {borrando === foto.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                </button>
              </div>
            ))}
            {pendientes.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previas[i]} alt={`Foto nueva ${i + 1}`} className="size-full object-cover" />
                <span className="absolute bottom-1 left-1 rounded-sm bg-background/85 px-1.5 py-0.5 text-[11px] font-medium">
                  Sin guardar
                </span>
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => onPendientesChange(pendientes.filter((_, j) => j !== i))}
                  disabled={bloqueado}
                  className="absolute right-1 top-1 rounded-sm bg-destructive p-1 text-destructive-foreground disabled:opacity-60"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bloqueado || lleno}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus /> Agregar más ({total}/{MAX_FOTOS_CAPTACION})
          </Button>
        </>
      )}
    </div>
  );
}
