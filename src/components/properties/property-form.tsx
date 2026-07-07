"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  Building2,
  Camera,
  DoorOpen,
  ImagePlus,
  MapPin,
  Ruler,
  StickyNote,
  X,
} from "lucide-react";
import { uploadPropertyPhotos } from "@/lib/upload-photos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OPERACIONES, TIPOS, MONEDAS, type Property } from "@/lib/types";
import type { PropertyFormState } from "@/actions/properties";

const MAX_FOTOS = 20;

function SectionHeader({
  icon: Icon,
  title,
  optional,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  optional?: boolean;
}) {
  return (
    <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
      <Icon className="size-5 text-primary" />
      <CardTitle className="flex-1 text-base">{title}</CardTitle>
      {optional && (
        <span className="text-xs font-medium text-muted-foreground">Opcional</span>
      )}
    </CardHeader>
  );
}

function Field({
  label,
  htmlFor,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (prev: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  property?: Property;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<PropertyFormState>({});
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !property;
  const e = state.errors ?? {};

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].slice(0, MAX_FOTOS);
    if (photos.length + files.length > MAX_FOTOS) {
      toast.warning(`Máximo ${MAX_FOTOS} fotos por propiedad.`);
    }
    setPhotos(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await action({}, formData);
      // updateProperty redirige server-side; solo createProperty devuelve id
      if (!result) return;
      if (result.errors || result.error) {
        setState(result);
        return;
      }
      if (result.id) {
        if (photos.length > 0) {
          setUploadingPhotos(true);
          const { failed } = await uploadPropertyPhotos(result.id, photos);
          setUploadingPhotos(false);
          if (failed > 0) {
            toast.warning(
              `${failed} foto(s) no se pudieron subir. Podés reintentarlo desde el detalle.`
            );
          }
        }
        toast.success("Propiedad creada");
        router.push(`/propiedades/${result.id}`);
      }
    });
  }

  return (
    <form action={handleAction} className="space-y-6">
      <Card>
        <SectionHeader icon={Building2} title="Información principal" />
        <CardContent className="space-y-4 pt-4">
          <Field label="Título *" htmlFor="titulo" error={e.titulo}>
            <Input
              id="titulo"
              name="titulo"
              defaultValue={property?.titulo}
              placeholder="Casa 3 ambientes en Centro"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Operación *" htmlFor="operacion" error={e.operacion}>
              <Select id="operacion" name="operacion" defaultValue={property?.operacion ?? "venta"}>
                {OPERACIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo *" htmlFor="tipo" error={e.tipo}>
              <Select id="tipo" name="tipo" defaultValue={property?.tipo ?? "casa"}>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_110px] gap-4">
            <Field label="Precio *" htmlFor="precio" error={e.precio}>
              <Input
                id="precio"
                name="precio"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={property?.precio}
                required
              />
            </Field>
            <Field label="Moneda" htmlFor="moneda" error={e.moneda}>
              <Select id="moneda" name="moneda" defaultValue={property?.moneda ?? "ARS"}>
                {MONEDAS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader icon={MapPin} title="Ubicación" optional />
        <CardContent className="space-y-4 pt-4">
          <Field label="Dirección" htmlFor="direccion" error={e.direccion}>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={property?.direccion ?? ""}
              placeholder="Av. Siempre Viva 123"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Barrio / Zona" htmlFor="zona" error={e.zona}>
              <Input id="zona" name="zona" defaultValue={property?.zona ?? ""} />
            </Field>
            <Field label="Ciudad" htmlFor="ciudad" error={e.ciudad}>
              <Input id="ciudad" name="ciudad" defaultValue={property?.ciudad ?? ""} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader icon={Ruler} title="Características" optional />
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ambientes" htmlFor="ambientes" icon={DoorOpen} error={e.ambientes}>
              <Input
                id="ambientes"
                name="ambientes"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={property?.ambientes ?? ""}
              />
            </Field>
            <Field label="Dormitorios" htmlFor="dormitorios" icon={BedDouble} error={e.dormitorios}>
              <Input
                id="dormitorios"
                name="dormitorios"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={property?.dormitorios ?? ""}
              />
            </Field>
            <Field label="Baños" htmlFor="banios" icon={Bath} error={e.banios}>
              <Input
                id="banios"
                name="banios"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={property?.banios ?? ""}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sup. cubierta (m²)" htmlFor="sup_cubierta" error={e.sup_cubierta}>
              <Input
                id="sup_cubierta"
                name="sup_cubierta"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={property?.sup_cubierta ?? ""}
              />
            </Field>
            <Field label="Sup. total (m²)" htmlFor="sup_total" error={e.sup_total}>
              <Input
                id="sup_total"
                name="sup_total"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={property?.sup_total ?? ""}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader icon={StickyNote} title="Descripción y notas" optional />
        <CardContent className="space-y-4 pt-4">
          <Field label="Descripción" htmlFor="descripcion" error={e.descripcion}>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={property?.descripcion ?? ""}
              placeholder="Detalles para compartir con el comprador: terminaciones, estado, orientación..."
            />
          </Field>

          <Field label="Notas (info extra interna)" htmlFor="notas" error={e.notas}>
            <Textarea
              id="notas"
              name="notas"
              defaultValue={property?.notas ?? ""}
              placeholder="Info solo para el equipo: llaves, contacto del dueño, condiciones..."
            />
          </Field>
        </CardContent>
      </Card>

      {isNew && (
        <Card>
          <SectionHeader icon={Camera} title="Fotos" optional />
          <CardContent className="space-y-4 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(ev) => addPhotos(ev.target.files)}
            />
            {photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 border border-dashed p-8 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                <ImagePlus className="size-6" />
                Tocá para agregar fotos (máx. {MAX_FOTOS}). La primera queda como
                portada.
              </button>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((file, i) => (
                    <div key={i} className="relative aspect-[4/3] border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Foto ${i + 1}`}
                        className="size-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                          Portada
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="Quitar foto"
                        onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 bg-destructive p-1 text-destructive-foreground"
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
                  disabled={photos.length >= MAX_FOTOS}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus /> Agregar más ({photos.length}/{MAX_FOTOS})
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {state.error && (
        <p className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
          {uploadingPhotos ? "Subiendo fotos..." : pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
