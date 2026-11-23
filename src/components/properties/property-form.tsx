"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building,
  Building2,
  Camera,
  ChevronDown,
  ClipboardList,
  DoorOpen,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  Ruler,
  StickyNote,
  X,
} from "lucide-react";
import { uploadPropertyPhotos } from "@/lib/upload-photos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  OPERACIONES,
  TIPOS,
  MONEDAS,
  ESTADOS_PUBLICADOS,
  ZONAS,
  OTRA_ZONA,
  CIUDADES,
  DESTINOS,
  PLAZOS,
  AJUSTES,
  INDICES,
  MASCOTAS,
  AMOBLADO_OPCIONES,
  DORMITORIOS_OPCIONES,
  COCHERA_OPCIONES,
  SI_NO_CONVENIR,
  GARANTIAS,
  DEPOSITOS,
  DISPONIBILIDADES,
  LLAVES_OPCIONES,
  AMBIENTES_LISTA,
  COMODIDADES,
  SERVICIOS,
  type EstadoPropiedad,
  type Operacion,
  type Edificio,
  type TipoPropiedad,
  type Property,
} from "@/lib/types";
import {
  esAlquiler as operacionDeAlquiler,
  etiquetaCampo,
  faltantes as calcularFaltantes,
  faltantesQueBloquean,
  reglasPorTipo,
} from "@/lib/completitud";
import { formDataAObjeto, presente } from "@/lib/validations/property";
import { PropertyMap } from "@/components/properties/property-map";
import type { PropertyFormState } from "@/actions/properties";

const MAX_FOTOS = 20;

/**
 * Sección plegable (`<details>` nativo): el formulario es largo y en el celular
 * conviene poder cerrar lo ya cargado. Arranca abierta. Los campos de una
 * sección cerrada se siguen enviando (están en el DOM).
 */
function Seccion({
  icon: Icon,
  title,
  nota,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  /** Texto chico a la derecha del título ("Opcional", "Interno"). */
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 border-b bg-muted/40 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
          <Icon className="size-5 text-primary" />
          <span className="flex-1 text-base font-semibold">{title}</span>
          {nota && (
            <span className="hidden text-xs font-medium text-muted-foreground min-[400px]:inline">
              {nota}
            </span>
          )}
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <CardContent className="space-y-4 py-4">{children}</CardContent>
      </details>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  error,
  icon: Icon,
  requerido,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Obligatorio para publicar: se marca con * (la API es la que valida). */
  requerido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {label}
        {requerido && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Grupo de casillas (ambientes, comodidades, servicios). */
function Casillas({
  name,
  label,
  opciones,
  marcadas,
  requerido,
  error,
}: {
  name: "ambientes_lista" | "comodidades" | "servicios";
  label: string;
  opciones: readonly string[];
  marcadas: string[];
  requerido?: boolean;
  error?: string;
}) {
  return (
    <fieldset id={name} tabIndex={-1} className="space-y-2 focus:outline-none">
      <legend className="flex items-center gap-1.5 text-sm font-medium">
        {label}
        {requerido && <span className="text-destructive">*</span>}
      </legend>
      {/* Avisa que el grupo se mostró, aunque no se marque nada (ver formDataAObjeto). */}
      <input type="hidden" name={presente(name)} value="1" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
        {opciones.map((op) => (
          <label key={op} className="flex min-h-11 items-center gap-2 text-sm sm:min-h-9">
            <input
              type="checkbox"
              name={name}
              value={op}
              defaultChecked={marcadas.includes(op)}
              className="size-4 accent-primary"
            />
            {op}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}

/** Lleva al campo: abre su sección si estaba plegada y lo enfoca. */
function irAlCampo(campo: string) {
  const el = document.getElementById(campo);
  if (!el) return;
  const seccion = el.closest("details");
  if (seccion) seccion.open = true;
  // Sin animación: el scroll suave se cortaba al re-renderizar el aviso de error.
  el.scrollIntoView({ block: "center" });
  el.focus({ preventScroll: true });
}

// Valor del <select> de edificio que abre el campo para cargar uno nuevo.
const NUEVO_EDIFICIO = "__nuevo__";

export function PropertyForm({
  action,
  property: editing,
  plantilla,
  edificios,
  esAdmin = false,
  vendedores = [],
  usuarioId,
}: {
  action: (prev: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  /** Propiedad que se está editando. Sin esto, el form es un alta. */
  property?: Property;
  /**
   * Alta a partir de otra propiedad ("cargar otra unidad de este edificio"):
   * precarga sus datos, pero el form sigue siendo un alta.
   */
  plantilla?: Property;
  /** Edificios del tenant para el selector. */
  edificios: Edificio[];
  /** El admin puede cargar a nombre de otro vendedor (la API lo vuelve a validar). */
  esAdmin?: boolean;
  vendedores?: { id: string; nombre: string }[];
  /** Responsable por defecto en un alta. */
  usuarioId?: string;
}) {
  // De acá salen todos los valores iniciales, sea edición o alta con plantilla.
  const property = editing ?? plantilla;
  const router = useRouter();
  const [state, setState] = useState<PropertyFormState>({});
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !editing;
  const esBorrador = editing?.estado === "borrador";
  // Publicar o guardar: en una publicada el botón principal es "Guardar cambios".
  const labelPrincipal = isNew || esBorrador ? "Publicar" : "Guardar cambios";
  const [edificio, setEdificio] = useState(property?.edificio?.id ?? "");
  const e = state.errors ?? {};
  const currentZone = property?.zona?.trim() ?? "";
  // La zona se carga desde una lista cerrada (ZONAS) con un escape "Otra":
  // sin eso, un barrio nuevo dejaría al vendedor trabado hasta un redeploy.
  // Un valor viejo que no está en la lista abre el form directamente en "Otra"
  // con el texto cargado, así no se pierde al editar la propiedad.
  const zonaEnLista = currentZone !== "" && ZONAS.some((zone) => zone === currentZone);

  const [zonaOtra, setZonaOtra] = useState(currentZone !== "" && !zonaEnLista);
  const [zonaLista, setZonaLista] = useState(zonaEnLista ? currentZone : "");

  // Lo que cambia qué campos se muestran y cuáles se piden para publicar.
  const [operacion, setOperacion] = useState<Operacion>(property?.operacion ?? "venta");
  // Monoambiente ya no es un tipo: una vieja se edita como departamento con 0 dormitorios.
  const tipoInicial: TipoPropiedad =
    !property || property.tipo === "monoambiente" ? (property ? "departamento" : "casa") : property.tipo;
  const [tipo, setTipo] = useState<TipoPropiedad>(tipoInicial);
  const [plazo, setPlazo] = useState<string>(property?.plazo_contrato ?? "");
  const [ajuste, setAjuste] = useState<string>(property?.ajuste ?? "");
  const [indice, setIndice] = useState<string>(property?.indice_ajuste ?? "");
  const [garantia, setGarantia] = useState<string>(property?.garantia ?? "");
  const [deposito, setDeposito] = useState<string>(property?.deposito ?? "");
  const [disponibilidad, setDisponibilidad] = useState<string>(property?.disponibilidad ?? "");
  const [cochera, setCochera] = useState<string>(property?.cochera ?? "");
  // Estado al publicar: nunca borrador (para eso está su botón). Un borrador
  // que se publica arranca en "Disponible".
  const [estado, setEstado] = useState<EstadoPropiedad>(
    !property || property.estado === "borrador" ? "disponible" : property.estado
  );

  const r = reglasPorTipo(tipo);
  const alquiler = operacionDeAlquiler(operacion);
  const esAlquilerPuro = operacion === "alquiler";
  const esAmbos = operacion === "ambos";
  // Etiqueta del precio principal: en alquiler puro `precio` es el alquiler; en
  // venta y en "ambos" es el de venta.
  const precioLabel = esAlquilerPuro ? "Precio de alquiler" : "Precio de venta";

  const dormitoriosIniciales =
    property?.tipo === "monoambiente" ? "0" : property?.dormitorios != null ? String(property.dormitorios) : "";
  const internos = property?.datos_internos;

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].slice(0, MAX_FOTOS);
    if (photos.length + files.length > MAX_FOTOS) {
      toast.warning(`Máximo ${MAX_FOTOS} fotos por propiedad.`);
    }
    setPhotos(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /**
   * Antes de publicar, la misma cuenta que hace la API: si falta algo, se
   * lista y se lleva al primero sin mandar nada. La API valida igual.
   */
  function faltantesAlPublicar(formData: FormData): string[] {
    const valores = formDataAObjeto(formData) as Parameters<typeof calcularFaltantes>[0];
    const despues = calcularFaltantes({ ...valores, operacion, tipo });
    return faltantesQueBloquean(
      editing ? { estado: editing.estado, faltantes: editing.faltantes } : null,
      { estado, faltantes: despues }
    );
  }

  function handleAction(formData: FormData) {
    if (formData.get("intent") !== "borrador") {
      const bloquean = faltantesAlPublicar(formData);
      if (bloquean.length > 0) {
        setState({
          faltantes: bloquean,
          errors: Object.fromEntries(bloquean.map((c) => [c, "Falta para publicar."])),
          error:
            isNew || esBorrador
              ? "Faltan datos para publicar. Completalos o guardala como borrador."
              : "Este cambio deja datos sin completar. Completalos o guardala como borrador.",
        });
        irAlCampo(bloquean[0]!);
        return;
      }
    }
    startTransition(async () => {
      const result = await action({}, formData);
      // updateProperty redirige server-side; solo createProperty devuelve id
      if (!result) return;
      if (result.errors || result.error) {
        setState(result);
        const primero = result.faltantes?.[0] ?? Object.keys(result.errors ?? {})[0];
        if (primero) irAlCampo(primero);
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
        else toast.success("Propiedad publicada");
        router.push(`/propiedades/${result.id}`);
      }
    });
  }

  /**
   * `onSubmit` y no `action={…}` a propósito: React 19 vacía los campos no
   * controlados después de cada acción de formulario, y acá un error (faltan
   * datos, 422 de la API) tiene que dejar todo lo cargado. El botón tocado
   * viaja como `submitter` (name="intent": publicar o borrador).
   */
  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const submitter = (ev.nativeEvent as SubmitEvent).submitter;
    handleAction(new FormData(ev.currentTarget, submitter));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>

      <Seccion icon={Building2} title="Información principal">
        <Field label="Título" htmlFor="titulo" error={e.titulo} requerido>
          <Input
            id="titulo"
            name="titulo"
            defaultValue={property?.titulo}
            placeholder="Casa 3 ambientes en Centro"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Operación" htmlFor="operacion" error={e.operacion} requerido>
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
          <Field label="Tipo" htmlFor="tipo" error={e.tipo} requerido>
            <Select
              id="tipo"
              name="tipo"
              value={tipo}
              onChange={(ev) => setTipo(ev.target.value as TipoPropiedad)}
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
          <Field label={precioLabel} htmlFor="precio" error={e.precio} requerido>
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
            <Field
              label="Precio de alquiler"
              htmlFor="precio_alquiler"
              error={e.precio_alquiler}
              requerido
            >
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

        {esAdmin && vendedores.length > 0 && (
          <Field label="Responsable" htmlFor="user_id" error={e.user_id}>
            <Select
              id="user_id"
              name="user_id"
              defaultValue={property && editing ? property.user_id : (usuarioId ?? "")}
            >
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Estado al publicar" htmlFor="estado" error={e.estado}>
          <Select
            id="estado"
            name="estado"
            value={estado}
            onChange={(ev) => setEstado(ev.target.value as EstadoPropiedad)}
          >
            {ESTADOS_PUBLICADOS.map((es) => (
              <option key={es.value} value={es.value}>
                {es.label}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Una propiedad privada no se publica en la web, pero el asistente de IA sí la puede
            ofrecer. Si todavía no está completa, usá «Guardar como borrador».
          </p>
        </Field>

        {/* Destacar NO tiene checkbox acá a propósito: es un único camino
            (el botón del detalle, admin-only) para que este form nunca
            pueda pisar el destacado al guardar otro cambio. Ver [[destacadas]]. */}
      </Seccion>

      <Seccion icon={MapPin} title="Ubicación">
        <Field label="Calle y altura" htmlFor="direccion" error={e.direccion} requerido>
          <Input
            id="direccion"
            name="direccion"
            defaultValue={property?.direccion ?? ""}
            placeholder="Av. Siempre Viva 123"
            autoComplete="off"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          <Field label="Barrio" htmlFor="zona" error={e.zona} requerido>
            <Select
              id="zona"
              name={zonaOtra ? undefined : "zona"}
              value={zonaOtra ? OTRA_ZONA : zonaLista}
              onChange={(ev) => {
                const value = ev.target.value;
                setZonaOtra(value === OTRA_ZONA);
                if (value !== OTRA_ZONA) setZonaLista(value);
              }}
            >
              <option value="">Seleccioná un barrio</option>
              {ZONAS.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
              <option value={OTRA_ZONA}>Otro (especificar)</option>
            </Select>
            {zonaOtra && (
              <Input
                name="zona"
                aria-label="Otro barrio"
                className="mt-2"
                defaultValue={zonaEnLista ? "" : currentZone}
                placeholder="Escribí el barrio o la zona"
              />
            )}
          </Field>
          <Field label="Localidad" htmlFor="ciudad" error={e.ciudad} requerido>
            {/* Input con sugerencias (datalist nativo): escribiendo "san m"
                aparece "San Miguel de Tucumán", pero sigue aceptando
                cualquier texto para las localidades que no están en la lista. */}
            <Input
              id="ciudad"
              name="ciudad"
              list="ciudades-sugeridas"
              autoComplete="off"
              defaultValue={property?.ciudad ?? ""}
              placeholder="Empezá a escribir…"
            />
            <datalist id="ciudades-sugeridas">
              {CIUDADES.map((ciudad) => (
                <option key={ciudad} value={ciudad} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label="Punto de referencia" htmlFor="punto_referencia" error={e.punto_referencia}>
          <Input
            id="punto_referencia"
            name="punto_referencia"
            defaultValue={property?.punto_referencia ?? ""}
            placeholder="A una cuadra de Mate de Luna, frente al Mercato…"
          />
        </Field>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <MapPin className="size-4 text-muted-foreground" /> Ubicación en el mapa
          </Label>
          <PropertyMap initialLat={property?.lat ?? null} initialLng={property?.lng ?? null} />
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
      </Seccion>

      <Seccion icon={Building} title="Edificio" nota="Opcional">
        <p className="text-sm text-muted-foreground">
          Si es una unidad dentro de un edificio donde hay otras propiedades cargadas, vinculala:
          quedan agrupadas en el panel y se ofrecen juntas en el sitio y por WhatsApp.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Edificio" htmlFor="edificio_id" error={e.edificio_id}>
            <Select
              id="edificio_id"
              // Con "Nuevo edificio" el id viaja vacío y manda `edificio_nuevo`.
              name={edificio === NUEVO_EDIFICIO ? undefined : "edificio_id"}
              value={edificio}
              onChange={(ev) => setEdificio(ev.target.value)}
            >
              <option value="">No pertenece a un edificio</option>
              {edificios.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.nombre}
                </option>
              ))}
              <option value={NUEVO_EDIFICIO}>+ Nuevo edificio…</option>
            </Select>
            {edificio === NUEVO_EDIFICIO && <input type="hidden" name="edificio_id" value="" />}
          </Field>
          {edificio !== "" && (
            <Field label="Unidad (piso y depto)" htmlFor="unidad" error={e.unidad}>
              <Input
                id="unidad"
                name="unidad"
                defaultValue={property?.unidad ?? ""}
                placeholder="Ej: 3° B, Piso 5, Cochera 12"
                maxLength={60}
              />
            </Field>
          )}
        </div>
        {edificio === NUEVO_EDIFICIO && (
          <Field
            label="Nombre del edificio nuevo"
            htmlFor="edificio_nuevo"
            error={e.edificio_nuevo ?? e.nombre}
          >
            <Input
              id="edificio_nuevo"
              name="edificio_nuevo"
              placeholder="Ej: Torre Alem, Edificio San Martín 450 (o «-» si no tiene nombre)"
              maxLength={120}
              required
            />
          </Field>
        )}
      </Seccion>

      <Seccion icon={Ruler} title="Características">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {r.dormitorios && (
            <Field
              label="Dormitorios"
              htmlFor="dormitorios"
              icon={BedDouble}
              error={e.dormitorios}
              requerido
            >
              <Select id="dormitorios" name="dormitorios" defaultValue={dormitoriosIniciales}>
                <option value="">Elegí</option>
                {DORMITORIOS_OPCIONES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
                {/* Una vieja con más de 4: se conserva el número. */}
                {Number(dormitoriosIniciales) > 4 && (
                  <option value={dormitoriosIniciales}>{dormitoriosIniciales}</option>
                )}
              </Select>
            </Field>
          )}
          {r.banios && (
            <Field label="Baños" htmlFor="banios" icon={Bath} error={e.banios} requerido>
              <Input
                id="banios"
                name="banios"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={property?.banios ?? ""}
              />
            </Field>
          )}
          <Field label="Ambientes (cantidad)" htmlFor="ambientes" icon={DoorOpen} error={e.ambientes}>
            <Input
              id="ambientes"
              name="ambientes"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={property?.ambientes ?? ""}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {r.supCubierta && (
            <Field label="m² cubiertos" htmlFor="sup_cubierta" error={e.sup_cubierta} requerido>
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
          )}
          <Field
            label={r.terreno ? "m² de terreno" : "m² totales"}
            htmlFor="sup_total"
            error={e.sup_total}
            requerido={r.terreno}
          >
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

        {r.terreno && (
          <Field label="Medidas del lote" htmlFor="medidas_lote" error={e.medidas_lote} requerido>
            <Input
              id="medidas_lote"
              name="medidas_lote"
              defaultValue={property?.medidas_lote ?? ""}
              placeholder="Frente x fondo, ej: 10 x 30"
            />
          </Field>
        )}

        {r.cochera && (
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
            <Field label="Cochera" htmlFor="cochera" error={e.cochera} requerido>
              <Select
                id="cochera"
                name="cochera"
                value={cochera}
                onChange={(ev) => setCochera(ev.target.value)}
              >
                <option value="">Elegí</option>
                {COCHERA_OPCIONES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            {r.cocheraCubierta && cochera !== "" && cochera !== "no_tiene" && (
              <label className="flex min-h-11 items-center gap-2 self-end text-sm">
                <input type="hidden" name="cochera_cubierta" value="" />
                <input
                  type="checkbox"
                  name="cochera_cubierta"
                  defaultChecked={property?.cochera_cubierta ?? false}
                  className="size-4 accent-primary"
                />
                Cubierta en edificio
              </label>
            )}
          </div>
        )}

        {r.ambientes && (
          <Casillas
            name="ambientes_lista"
            label="Ambientes"
            opciones={AMBIENTES_LISTA}
            marcadas={property?.ambientes_lista ?? []}
            requerido={r.ambientesObligatorio}
            error={e.ambientes_lista}
          />
        )}
        {r.comodidades && (
          <Casillas
            name="comodidades"
            label="Comodidades"
            opciones={COMODIDADES}
            marcadas={property?.comodidades ?? []}
            error={e.comodidades}
          />
        )}
        {r.servicios && (
          <Casillas
            name="servicios"
            label="Servicios"
            opciones={SERVICIOS}
            marcadas={property?.servicios ?? []}
            requerido
            error={e.servicios}
          />
        )}

        {r.vivienda && (
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-3">
            <Field label="Amoblado" htmlFor="amoblado" error={e.amoblado} requerido>
              <Select id="amoblado" name="amoblado" defaultValue={property?.amoblado ?? ""}>
                <option value="">Elegí</option>
                {AMOBLADO_OPCIONES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mascotas" htmlFor="mascotas" error={e.mascotas} requerido>
              <Select id="mascotas" name="mascotas" defaultValue={property?.mascotas ?? ""}>
                <option value="">Elegí</option>
                {MASCOTAS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Acepta niños" htmlFor="acepta_ninos" error={e.acepta_ninos} requerido>
              <Select id="acepta_ninos" name="acepta_ninos" defaultValue={property?.acepta_ninos ?? ""}>
                <option value="">Elegí</option>
                {SI_NO_CONVENIR.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </Seccion>

      {alquiler && (
        <Seccion icon={KeyRound} title="Condiciones de alquiler">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expensas" htmlFor="expensas" error={e.expensas} requerido>
              <Input
                id="expensas"
                name="expensas"
                defaultValue={property?.expensas ?? ""}
                placeholder="Monto, o 0 si no tiene"
              />
            </Field>
            <Field label="Destino" htmlFor="destino" error={e.destino}>
              <Select id="destino" name="destino" defaultValue={property?.destino ?? ""}>
                <option value="">Sin especificar</option>
                {DESTINOS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Plazo del contrato" htmlFor="plazo_contrato" error={e.plazo_contrato} requerido>
              <Select
                id="plazo_contrato"
                name="plazo_contrato"
                value={plazo}
                onChange={(ev) => setPlazo(ev.target.value)}
              >
                <option value="">Elegí</option>
                {PLAZOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            {plazo === "otro" && (
              <Field label="Cantidad de meses" htmlFor="plazo_otro" error={e.plazo_otro} requerido>
                <Input
                  id="plazo_otro"
                  name="plazo_otro"
                  inputMode="numeric"
                  defaultValue={property?.plazo_otro ?? ""}
                  placeholder="Ej: 6"
                />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Índice de actualización" htmlFor="indice_ajuste" error={e.indice_ajuste} requerido>
              <Select
                id="indice_ajuste"
                name="indice_ajuste"
                value={indice}
                onChange={(ev) => setIndice(ev.target.value)}
              >
                <option value="">Elegí</option>
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
            {indice === "otro" && (
              <Field label="Detalle del índice" htmlFor="indice_otro" error={e.indice_otro} requerido>
                <Input id="indice_otro" name="indice_otro" defaultValue={property?.indice_otro ?? ""} />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cada cuánto se actualiza" htmlFor="ajuste" error={e.ajuste} requerido>
              <Select id="ajuste" name="ajuste" value={ajuste} onChange={(ev) => setAjuste(ev.target.value)}>
                <option value="">Elegí</option>
                {AJUSTES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            {ajuste === "otro" && (
              <Field label="Cada cuántos meses" htmlFor="ajuste_otro" error={e.ajuste_otro} requerido>
                <Input
                  id="ajuste_otro"
                  name="ajuste_otro"
                  inputMode="numeric"
                  defaultValue={property?.ajuste_otro ?? ""}
                  placeholder="Ej: 2"
                />
              </Field>
            )}
          </div>

          <Field label="Garantía" htmlFor="garantia" error={e.garantia} requerido>
            <Select id="garantia" name="garantia" value={garantia} onChange={(ev) => setGarantia(ev.target.value)}>
              <option value="">Elegí</option>
              {GARANTIAS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          {garantia === "especial" && (
            <Field label="Qué garantía pide" htmlFor="garantia_detalle" error={e.garantia_detalle} requerido>
              <Textarea
                id="garantia_detalle"
                name="garantia_detalle"
                defaultValue={property?.garantia_detalle ?? ""}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Depósito" htmlFor="deposito" error={e.deposito} requerido>
              <Select id="deposito" name="deposito" value={deposito} onChange={(ev) => setDeposito(ev.target.value)}>
                <option value="">Elegí</option>
                {DEPOSITOS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            {(deposito === "dolares" || deposito === "otro") && (
              <Field
                label={deposito === "dolares" ? "Monto en dólares" : "Detalle del depósito"}
                htmlFor="deposito_detalle"
                error={e.deposito_detalle}
                requerido
              >
                <Input
                  id="deposito_detalle"
                  name="deposito_detalle"
                  inputMode={deposito === "dolares" ? "decimal" : undefined}
                  defaultValue={property?.deposito_detalle ?? ""}
                />
              </Field>
            )}
          </div>

          <Field label="Otros requisitos (público)" htmlFor="requisitos" error={e.requisitos}>
            <Textarea
              id="requisitos"
              name="requisitos"
              defaultValue={property?.requisitos ?? ""}
              placeholder="Seguro de caución, informe comercial…"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Martina (el asistente) puede compartir estos requisitos con quien consulte.
            </p>
          </Field>
        </Seccion>
      )}

      <Seccion icon={Lock} title="Disponibilidad, llaves y visitas" nota="Parte interna">
        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          <Field label="Disponibilidad" htmlFor="disponibilidad" error={e.disponibilidad} requerido>
            <Select
              id="disponibilidad"
              name="disponibilidad"
              value={disponibilidad}
              onChange={(ev) => setDisponibilidad(ev.target.value)}
            >
              <option value="">Elegí</option>
              {DISPONIBILIDADES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          {(disponibilidad === "mostrar_desde" || disponibilidad === "se_desocupa") && (
            <Field label="Fecha" htmlFor="disponible_desde" error={e.disponible_desde} requerido>
              <Input
                id="disponible_desde"
                name="disponible_desde"
                type="date"
                defaultValue={property?.disponible_desde ?? ""}
              />
            </Field>
          )}
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          Lo que sigue es interno: lo ve el equipo, pero nunca el sitio ni Martina.
        </p>

        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          <Field label="Llaves" htmlFor="llaves" error={e.llaves} requerido>
            <Select id="llaves" name="llaves" defaultValue={internos?.llaves ?? ""}>
              <option value="">Elegí</option>
              {LLAVES_OPCIONES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Publicación" htmlFor="publicacion">
            {/* Mismo dato que el estado: "No publicar, solo ofrecer" = Privado. */}
            <Select
              id="publicacion"
              value={estado === "privado" ? "privado" : "publicar"}
              onChange={(ev) =>
                setEstado(ev.target.value === "privado" ? "privado" : estado === "privado" ? "disponible" : estado)
              }
            >
              <option value="publicar">Se puede publicar</option>
              <option value="privado">No publicar, solo ofrecer</option>
            </Select>
          </Field>
        </div>

        <Field label="Cómo se coordinan las visitas" htmlFor="visitas" error={e.visitas} requerido>
          <Textarea
            id="visitas"
            name="visitas"
            defaultValue={internos?.visitas ?? ""}
            placeholder="Días y horarios, a quién avisar…"
          />
        </Field>
        <Field label="Qué pide el propietario" htmlFor="pide_propietario" error={e.pide_propietario}>
          <Textarea
            id="pide_propietario"
            name="pide_propietario"
            defaultValue={internos?.pide_propietario ?? ""}
            placeholder="Precio mínimo que acepta, condiciones…"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          <Field label="Propietario" htmlFor="propietario_nombre" error={e.propietario_nombre}>
            <Input
              id="propietario_nombre"
              name="propietario_nombre"
              defaultValue={internos?.propietario_nombre ?? ""}
              autoComplete="off"
            />
          </Field>
          <Field label="Teléfono del propietario" htmlFor="propietario_telefono" error={e.propietario_telefono}>
            <Input
              id="propietario_telefono"
              name="propietario_telefono"
              type="tel"
              inputMode="tel"
              defaultValue={internos?.propietario_telefono ?? ""}
              autoComplete="off"
            />
          </Field>
        </div>
      </Seccion>

      <Seccion icon={StickyNote} title="Descripción y observaciones" nota="Opcional">
        <Field label="Descripción (pública)" htmlFor="descripcion" error={e.descripcion}>
          <Textarea
            id="descripcion"
            name="descripcion"
            defaultValue={property?.descripcion ?? ""}
            placeholder="Detalles para el cliente: terminaciones, estado, orientación..."
          />
        </Field>

        <Field label="Observaciones (internas)" htmlFor="notas" error={e.notas}>
          <Textarea
            id="notas"
            name="notas"
            defaultValue={property?.notas ?? ""}
            placeholder="Solo para el equipo. Salen en el mensaje para el grupo."
          />
        </Field>
      </Seccion>

      {isNew && (
        <Seccion icon={Camera} title="Fotos" nota="Opcional">
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
              className="rounded-xl flex w-full flex-col items-center gap-2 border border-dashed p-8 text-sm text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-6" />
              Tocá para agregar fotos (máx. {MAX_FOTOS}). La primera queda como portada.
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
        </Seccion>
      )}

      {(state.error || (state.faltantes && state.faltantes.length > 0)) && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {state.error && (
            <p className="flex items-start gap-1.5 font-medium">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {state.error}
            </p>
          )}
          {state.faltantes && state.faltantes.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {state.faltantes.map((campo) => (
                <li key={campo}>
                  <button
                    type="button"
                    onClick={() => irAlCampo(campo)}
                    className="rounded-md border border-destructive/30 bg-background px-2 py-1 text-xs hover:bg-destructive/10"
                  >
                    {etiquetaCampo(campo)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* En el celular los botones quedan fijos abajo: el formulario es largo y
          así se puede guardar sin bajar hasta el final. */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 grid grid-cols-2 gap-2 rounded-b-xl border-t bg-background/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg sm:static sm:m-0 sm:flex sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button
          type="submit"
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={pending || uploadingPhotos}
          name="intent"
          value="borrador"
        >
          <ClipboardList className="hidden sm:block" />
          {/* En el celular no entra "Guardar como borrador" en media pantalla. */}
          <span className="sm:hidden">{isNew || esBorrador ? "Borrador" : "A borrador"}</span>
          <span className="hidden sm:inline">
            {isNew || esBorrador ? "Guardar como borrador" : "Pasar a borrador"}
          </span>
        </Button>
        <Button
          type="submit"
          size="lg"
          className={cn("w-full sm:w-auto")}
          disabled={pending || uploadingPhotos}
          name="intent"
          value="publicar"
        >
          {(pending || uploadingPhotos) && <Loader2 className="animate-spin" />}
          {uploadingPhotos ? "Subiendo fotos..." : pending ? "Guardando..." : labelPrincipal}
        </Button>
      </div>
    </form>
  );
}
