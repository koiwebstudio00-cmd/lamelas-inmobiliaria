"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  Building2,
  Camera,
  ClipboardList,
  DoorOpen,
  ImagePlus,
  KeyRound,
  Loader2,
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
import {
  OPERACIONES,
  TIPOS,
  MONEDAS,
  ESTADOS,
  DESTINOS,
  PLAZOS,
  AJUSTES,
  INDICES,
  MASCOTAS,
  AMOBLADO_OPCIONES,
  type Operacion,
  type TipoPropiedad,
  type Property,
} from "@/lib/types";
import { PropertyMap } from "@/components/properties/property-map";
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

  // La sección de alquiler y los campos "Otro"/"Fijo %" se muestran según lo elegido.
  const [operacion, setOperacion] = useState<Operacion>(property?.operacion ?? "venta");
  const [plazo, setPlazo] = useState(property?.plazo_contrato ?? "");
  const [ajuste, setAjuste] = useState(property?.ajuste ?? "");
  const [indice, setIndice] = useState(property?.indice_ajuste ?? "");
  const esAlquiler = operacion === "alquiler";
  const esAmbos = operacion === "ambos";
  // Etiqueta del precio principal: en alquiler puro `precio` es el alquiler; en
  // venta y en "ambos" es el de venta.
  const precioLabel = esAlquiler ? "Precio de alquiler *" : "Precio de venta *";

  // Un monoambiente no tiene ambientes ni dormitorios separados: se fuerzan a 0
  // y se bloquea el ingreso. Por eso ambientes/dormitorios son controlados.
  const [tipo, setTipo] = useState<TipoPropiedad>(property?.tipo ?? "casa");
  const esMonoambiente = tipo === "monoambiente";
  const initMono = (property?.tipo ?? "casa") === "monoambiente";
  const [ambientes, setAmbientes] = useState(
    initMono ? "0" : property?.ambientes != null ? String(property.ambientes) : ""
  );
  const [dormitorios, setDormitorios] = useState(
    initMono ? "0" : property?.dormitorios != null ? String(property.dormitorios) : ""
  );

  function onTipoChange(next: TipoPropiedad) {
    setTipo(next);
    if (next === "monoambiente") {
      setAmbientes("0");
      setDormitorios("0");
    }
  }

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
        if (result.warning) toast.warning(result.warning);
        else toast.success("Propiedad creada");
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
              <Select
                id="operacion"
                name="operacion"
                value={operacion}
                onChange={(ev) => setOperacion(ev.target.value as Operacion)}
              >
                {OPERACIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo *" htmlFor="tipo" error={e.tipo}>
              <Select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(ev) => onTipoChange(ev.target.value as TipoPropiedad)}
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_110px] gap-4">
            <Field label={precioLabel} htmlFor="precio" error={e.precio}>
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

          {esAmbos && (
            <div className="grid grid-cols-[1fr_110px] gap-4">
              <Field label="Precio de alquiler *" htmlFor="precio_alquiler" error={e.precio_alquiler}>
                <Input
                  id="precio_alquiler"
                  name="precio_alquiler"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  defaultValue={property?.precio_alquiler ?? ""}
                />
              </Field>
              <Field label="Moneda" htmlFor="moneda_alquiler" error={e.moneda_alquiler}>
                <Select
                  id="moneda_alquiler"
                  name="moneda_alquiler"
                  defaultValue={property?.moneda_alquiler ?? "ARS"}
                >
                  {MONEDAS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          <Field label="Estado" htmlFor="estado" error={e.estado}>
            <Select id="estado" name="estado" defaultValue={property?.estado ?? "disponible"}>
              {ESTADOS.map((es) => (
                <option key={es.value} value={es.value}>
                  {es.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Una propiedad privada no se publica en la web, pero el asistente de
              IA sí la puede ofrecer a los clientes que encajen.
            </p>
          </Field>

          <label className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              name="destacada"
              defaultChecked={property?.destacada ?? false}
              className="mt-0.5 size-4 accent-amber-500"
            />
            <span className="text-sm">
              <span className="font-medium">Destacar esta propiedad</span>
              <span className="block text-xs text-muted-foreground">
                La sube al tope del listado de la web y de lo que ofrece el
                asistente. Cada vendedor puede tener hasta 6 destacadas a la vez.
              </span>
            </span>
          </label>
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

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="size-4 text-muted-foreground" /> Ubicación en el mapa
            </Label>
            <PropertyMap
              initialLat={property?.lat ?? null}
              initialLng={property?.lng ?? null}
            />
          </div>

          <Field label="Link de Google Maps (alternativa)" htmlFor="link_maps" error={e.link_maps}>
            <Input
              id="link_maps"
              name="link_maps"
              type="url"
              defaultValue={property?.link_maps ?? ""}
              placeholder="https://maps.app.goo.gl/..."
            />
          </Field>
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
                value={ambientes}
                onChange={(ev) => setAmbientes(ev.target.value)}
                readOnly={esMonoambiente}
                aria-readonly={esMonoambiente}
                className={esMonoambiente ? "bg-muted text-muted-foreground" : undefined}
              />
            </Field>
            <Field label="Dormitorios" htmlFor="dormitorios" icon={BedDouble} error={e.dormitorios}>
              <Input
                id="dormitorios"
                name="dormitorios"
                type="number"
                inputMode="numeric"
                min={0}
                value={dormitorios}
                onChange={(ev) => setDormitorios(ev.target.value)}
                readOnly={esMonoambiente}
                aria-readonly={esMonoambiente}
                className={esMonoambiente ? "bg-muted text-muted-foreground" : undefined}
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

          {esMonoambiente && (
            <p className="text-xs text-muted-foreground">
              Un monoambiente se carga con 0 ambientes y 0 dormitorios (son un
              único espacio); esos campos quedan bloqueados.
            </p>
          )}

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

      {(esAlquiler || esAmbos) && (
        <Card>
          <SectionHeader icon={KeyRound} title="Condiciones de alquiler" optional />
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Destino" htmlFor="destino" error={e.destino}>
                <Select id="destino" name="destino" defaultValue={property?.destino ?? ""} className="w-full">
                  <option value="">Sin especificar</option>
                  {DESTINOS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Expensas" htmlFor="expensas" error={e.expensas}>
                <Input
                  id="expensas"
                  name="expensas"
                  defaultValue={property?.expensas ?? ""}
                  placeholder="Incluidas, $45.000, sin expensas..."
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Plazo de contrato" htmlFor="plazo_contrato" error={e.plazo_contrato}>
                <Select
                  id="plazo_contrato"
                  name="plazo_contrato"
                  value={plazo}
                  onChange={(ev) => setPlazo(ev.target.value as typeof plazo)}
                >
                  <option value="">Sin especificar</option>
                  {PLAZOS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {plazo === "otro" && (
                <Field label="Especificar plazo" htmlFor="plazo_otro" error={e.plazo_otro}>
                  <Input
                    id="plazo_otro"
                    name="plazo_otro"
                    defaultValue={property?.plazo_otro ?? ""}
                    placeholder="Ej: 6 meses"
                  />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ajuste" htmlFor="ajuste" error={e.ajuste}>
                <Select
                  id="ajuste"
                  name="ajuste"
                  value={ajuste}
                  onChange={(ev) => setAjuste(ev.target.value as typeof ajuste)}
                >
                  <option value="">Sin especificar</option>
                  {AJUSTES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {ajuste === "otro" && (
                <Field label="Especificar ajuste" htmlFor="ajuste_otro" error={e.ajuste_otro}>
                  <Input
                    id="ajuste_otro"
                    name="ajuste_otro"
                    defaultValue={property?.ajuste_otro ?? ""}
                    placeholder="Ej: semestral"
                  />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Índice de ajuste" htmlFor="indice_ajuste" error={e.indice_ajuste}>
                <Select
                  id="indice_ajuste"
                  name="indice_ajuste"
                  value={indice}
                  onChange={(ev) => setIndice(ev.target.value as typeof indice)}
                >
                  <option value="">Sin especificar</option>
                  {INDICES.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {indice === "fijo" && (
                <Field label="Porcentaje fijo (%)" htmlFor="indice_fijo_pct" error={e.indice_fijo_pct}>
                  <Input
                    id="indice_fijo_pct"
                    name="indice_fijo_pct"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    defaultValue={property?.indice_fijo_pct ?? ""}
                    placeholder="Ej: 10"
                  />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Mascotas" htmlFor="mascotas" error={e.mascotas}>
                <Select id="mascotas" name="mascotas" defaultValue={property?.mascotas ?? ""}>
                  <option value="">Sin especificar</option>
                  {MASCOTAS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amoblado" htmlFor="amoblado" error={e.amoblado}>
                <Select id="amoblado" name="amoblado" defaultValue={property?.amoblado ?? ""}>
                  <option value="">Sin especificar</option>
                  {AMOBLADO_OPCIONES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <SectionHeader icon={ClipboardList} title="Requisitos de alquiler" optional />
        <CardContent className="space-y-3 pt-4">
          <Field label="Requisitos para alquilar" htmlFor="requisitos" error={e.requisitos}>
            <Textarea
              id="requisitos"
              name="requisitos"
              defaultValue={property?.requisitos ?? ""}
              placeholder="Garantía propietaria, recibo de sueldo, depósito, seguro de caución..."
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Sofi (el asistente) puede compartir estos requisitos con quien consulte por el alquiler.
          </p>
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
          {(pending || uploadingPhotos) && <Loader2 className="animate-spin" />}
          {uploadingPhotos ? "Subiendo fotos..." : pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
