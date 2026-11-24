"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
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
import { iconoCaracteristica } from "@/lib/iconos-caracteristicas";
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

type SeccionId = "basico" | "ubicacion" | "caracteristicas" | "alquiler" | "acceso" | "extras";

/** Orden y ayuda de cada sección. El resumen del costado y la barra del celular salen de acá. */
const SECCIONES: { id: SeccionId; titulo: string; ayuda: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "basico", titulo: "Información principal", ayuda: "Operación, tipo, título y precio", icon: Building2 },
  { id: "ubicacion", titulo: "Ubicación", ayuda: "Dirección, barrio, edificio y mapa", icon: MapPin },
  { id: "caracteristicas", titulo: "Características", ayuda: "Tamaño, ambientes y servicios", icon: Ruler },
  { id: "alquiler", titulo: "Condiciones de alquiler", ayuda: "Contrato, actualización, garantía y depósito", icon: KeyRound },
  { id: "acceso", titulo: "Disponibilidad y visitas", ayuda: "Desde cuándo se muestra y cómo se entra", icon: Lock },
  { id: "extras", titulo: "Descripción y fotos", ayuda: "Lo que lee el cliente y las observaciones", icon: StickyNote },
];

/** En qué sección vive cada campo que puede faltar para publicar. */
const SECCION_DE_CAMPO: Record<string, SeccionId> = {
  titulo: "basico",
  precio: "basico",
  precio_alquiler: "basico",
  direccion: "ubicacion",
  ciudad: "ubicacion",
  zona: "ubicacion",
  dormitorios: "caracteristicas",
  banios: "caracteristicas",
  sup_cubierta: "caracteristicas",
  sup_total: "caracteristicas",
  medidas_lote: "caracteristicas",
  cochera: "caracteristicas",
  ambientes_lista: "caracteristicas",
  servicios: "caracteristicas",
  amoblado: "caracteristicas",
  mascotas: "caracteristicas",
  acepta_ninos: "caracteristicas",
  expensas: "alquiler",
  plazo_contrato: "alquiler",
  plazo_otro: "alquiler",
  indice_ajuste: "alquiler",
  indice_otro: "alquiler",
  ajuste: "alquiler",
  ajuste_otro: "alquiler",
  garantia: "alquiler",
  garantia_detalle: "alquiler",
  deposito: "alquiler",
  deposito_detalle: "alquiler",
  disponibilidad: "acceso",
  disponible_desde: "acceso",
  llaves: "acceso",
  visitas: "acceso",
};

type EstadoSeccion = { tipo: "faltan"; cantidad: number } | { tipo: "completa" } | { tipo: "opcional" } | { tipo: "no_aplica" };

/** Estado de la sección como texto corto, con el color que le corresponde. */
function EstadoSeccionBadge({ estado, className }: { estado: EstadoSeccion; className?: string }) {
  if (estado.tipo === "faltan") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900",
          className
        )}
      >
        {estado.cantidad === 1 ? "Falta 1" : `Faltan ${estado.cantidad}`}
      </span>
    );
  }
  if (estado.tipo === "completa") {
    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary", className)}>
        <Check className="size-3.5" aria-hidden />
        Completa
      </span>
    );
  }
  return (
    <span className={cn("shrink-0 text-xs text-muted-foreground", className)}>
      {estado.tipo === "opcional" ? "Opcional" : "No aplica"}
    </span>
  );
}

/**
 * Sección plegable (`<details>` nativo). Los campos de una sección cerrada se
 * siguen enviando (están en el DOM) y `irAlCampo` la abre si hay que llevar a
 * un campo de adentro. El encabezado muestra qué le falta para publicar.
 */
function Seccion({
  id,
  abierta,
  onToggle,
  estado,
  siguiente,
  onSiguiente,
  children,
}: {
  id: SeccionId;
  abierta: boolean;
  onToggle: (abierta: boolean) => void;
  estado: EstadoSeccion;
  /** Título de la sección que sigue, para el botón de abajo. */
  siguiente?: string;
  onSiguiente?: () => void;
  children: React.ReactNode;
}) {
  const meta = SECCIONES.find((s) => s.id === id)!;
  const Icon = meta.icon;
  return (
    <Card id={`seccion-${id}`} className="scroll-mt-20 overflow-hidden p-0">
      <details open={abierta} onToggle={(ev) => onToggle(ev.currentTarget.open)} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 select-none hover:bg-muted/40 group-open:border-b group-open:bg-muted/40 [&::-webkit-details-marker]:hidden">
          <Icon className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold leading-tight">{meta.titulo}</span>
            <span className="block truncate text-xs text-muted-foreground">{meta.ayuda}</span>
          </span>
          <EstadoSeccionBadge estado={estado} />
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <CardContent className="space-y-5 py-5">
          {children}
          {siguiente && onSiguiente && (
            <div className="flex justify-end border-t pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={onSiguiente}>
                Seguir con {siguiente.toLowerCase()}
                <ChevronRight />
              </Button>
            </div>
          )}
        </CardContent>
      </details>
    </Card>
  );
}

/** Subgrupo dentro de una sección larga: separa sin abrir otra tarjeta. */
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-muted-foreground">{titulo}</h3>
      {children}
    </div>
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
      {/* Badges seleccionables (CARACT-CHIPS-01). El checkbox real sigue adentro
          (sr-only) porque el form se arma con FormData; el estilo marcado sale de
          `has-[:checked]`, sin estado de React. */}
      <div className="flex flex-wrap gap-1.5">
        {opciones.map((op) => {
          const Icono = iconoCaracteristica(op);
          return (
            <label
              key={op}
              className={cn(
                "inline-flex min-h-11 cursor-pointer select-none items-center gap-1.5 rounded-md border bg-background px-3 text-sm transition-colors hover:bg-muted sm:min-h-9",
                "has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:hover:bg-primary/90",
                "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                error && "border-destructive"
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={op}
                defaultChecked={marcadas.includes(op)}
                className="sr-only"
              />
              <Icono className="size-4 shrink-0" aria-hidden />
              {op}
            </label>
          );
        })}
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

  // ── Estado de cada sección, en vivo ──────────────────────────────────────
  // Misma cuenta que la API (completitud) sobre lo que hay cargado ahora, más
  // título y precio, que son los mínimos de cualquier guardado.
  const formRef = useRef<HTMLFormElement>(null);
  const [faltantesVivos, setFaltantesVivos] = useState<string[]>(() => editing?.faltantes ?? []);
  const recalcular = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const valores = formDataAObjeto(fd) as Parameters<typeof calcularFaltantes>[0];
    const lista = calcularFaltantes({ ...valores, operacion, tipo });
    const vacio = (campo: string) => !String(fd.get(campo) ?? "").trim();
    if (vacio("precio")) lista.unshift("precio");
    if (vacio("titulo")) lista.unshift("titulo");
    setFaltantesVivos(lista);
  }, [operacion, tipo]);
  // Después de cada render que cambia qué campos existen (operación, tipo y los
  // selects que abren un "otro"), se vuelve a contar con el DOM ya actualizado.
  useEffect(() => {
    recalcular();
  }, [recalcular, cochera, disponibilidad, plazo, ajuste, indice, garantia, deposito, edificio, zonaOtra]);

  const cuentaPorSeccion = new Map<SeccionId, number>();
  for (const campo of faltantesVivos) {
    const sec = SECCION_DE_CAMPO[campo];
    if (sec) cuentaPorSeccion.set(sec, (cuentaPorSeccion.get(sec) ?? 0) + 1);
  }
  function estadoDe(id: SeccionId): EstadoSeccion {
    if (id === "alquiler" && !alquiler) return { tipo: "no_aplica" };
    const n = cuentaPorSeccion.get(id) ?? 0;
    if (n > 0) return { tipo: "faltan", cantidad: n };
    return id === "extras" ? { tipo: "opcional" } : { tipo: "completa" };
  }
  const totalFaltan = faltantesVivos.length;

  // ── Secciones abiertas ────────────────────────────────────────────────────
  // Alta: arranca abierta solo la primera y se avanza con "Seguir con…".
  // Edición: todas cerradas, con su estado a la vista para ir a lo que se cambia.
  const [abiertas, setAbiertas] = useState<Set<SeccionId>>(() => new Set(isNew ? ["basico"] : []));
  function toggleSeccion(id: SeccionId, abierta: boolean) {
    setAbiertas((prev) => {
      if (prev.has(id) === abierta) return prev;
      const next = new Set(prev);
      if (abierta) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function irASeccion(id: SeccionId, cerrar?: SeccionId) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (cerrar) next.delete(cerrar);
      next.add(id);
      return next;
    });
    requestAnimationFrame(() =>
      document.getElementById(`seccion-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })
    );
  }
  function propsSeccion(id: SeccionId) {
    const i = SECCIONES.findIndex((s) => s.id === id);
    const sig = SECCIONES[i + 1];
    return {
      id,
      abierta: abiertas.has(id),
      onToggle: (abierta: boolean) => toggleSeccion(id, abierta),
      estado: estadoDe(id),
      siguiente: sig?.titulo,
      onSiguiente: sig ? () => irASeccion(sig.id, id) : undefined,
    };
  }

  const ocupado = pending || uploadingPhotos;
  const textoPrincipal = uploadingPhotos ? "Subiendo fotos…" : pending ? "Guardando…" : labelPrincipal;
  const textoBorrador = isNew || esBorrador ? "Guardar como borrador" : "Pasar a borrador";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onChange={recalcular}
      noValidate
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6"
    >
      <div className="space-y-3">
        <Seccion {...propsSeccion("basico")}>
          <fieldset className="space-y-2">
            <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              Operación <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {OPERACIONES.map((o) => (
                <label
                  key={o.value}
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border bg-background px-2 text-center text-sm leading-tight transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 sm:min-h-9"
                >
                  <input
                    type="radio"
                    name="operacion"
                    value={o.value}
                    checked={operacion === o.value}
                    onChange={() => setOperacion(o.value)}
                    className="sr-only"
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {e.operacion && <p className="text-sm text-destructive">{e.operacion}</p>}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="tipo" error={e.tipo} requerido>
              <Select id="tipo" name="tipo" value={tipo} onChange={(ev) => setTipo(ev.target.value as TipoPropiedad)}>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
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
          </div>

          {esAmbos && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2 sm:col-start-2">
                <Field label="Precio de alquiler" htmlFor="precio_alquiler" error={e.precio_alquiler} requerido>
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
                  <Select id="moneda_alquiler" name="moneda_alquiler" defaultValue={property?.moneda_alquiler ?? "ARS"}>
                    {MONEDAS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          <Field label="Título" htmlFor="titulo" error={e.titulo} requerido>
            <Input
              id="titulo"
              name="titulo"
              defaultValue={property?.titulo}
              placeholder="Casa de 3 dormitorios en Yerba Buena"
              required
            />
          </Field>

          {/* Destacar NO tiene checkbox acá a propósito: es un único camino
              (el botón del detalle, admin-only) para que este form nunca
              pueda pisar el destacado al guardar otro cambio. Ver [[destacadas]]. */}
        </Seccion>

        <Seccion {...propsSeccion("ubicacion")}>
          <Field label="Calle y altura" htmlFor="direccion" error={e.direccion} requerido>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={property?.direccion ?? ""}
              placeholder="Av. Siempre Viva 123"
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
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
                <option value="">Elegí un barrio</option>
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
          </div>

          <Field label="Punto de referencia" htmlFor="punto_referencia" error={e.punto_referencia}>
            <Input
              id="punto_referencia"
              name="punto_referencia"
              defaultValue={property?.punto_referencia ?? ""}
              placeholder="A una cuadra de Mate de Luna, frente al Mercato…"
            />
          </Field>

          <Grupo titulo="Edificio">
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
              <Field label="Nombre del edificio nuevo" htmlFor="edificio_nuevo" error={e.edificio_nuevo ?? e.nombre}>
                <Input
                  id="edificio_nuevo"
                  name="edificio_nuevo"
                  placeholder="Ej: Torre Alem, Edificio San Martín 450 (o «-» si no tiene nombre)"
                  maxLength={120}
                  required
                />
              </Field>
            )}
            <p className="text-xs text-muted-foreground">
              Vinculá las unidades de un mismo edificio: quedan agrupadas en el panel y se ofrecen juntas en
              el sitio y por WhatsApp.
            </p>
          </Grupo>

          {/* Visible siempre: no es obligatorio, pero conviene que el vendedor
              marque el pin o pegue el link de Google Maps. */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="size-4 text-muted-foreground" /> Ubicación en el mapa
              </Label>
              <PropertyMap initialLat={property?.lat ?? null} initialLng={property?.lng ?? null} />
            </div>
            <Field label="Link de Google Maps" htmlFor="link_maps" error={e.link_maps}>
              <Input
                id="link_maps"
                name="link_maps"
                type="url"
                defaultValue={property?.link_maps ?? ""}
                placeholder="https://maps.app.goo.gl/..."
              />
            </Field>
          </div>
        </Seccion>

        <Seccion {...propsSeccion("caracteristicas")}>
          <Grupo titulo="Tamaño">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {r.dormitorios && (
                <Field label="Dormitorios" htmlFor="dormitorios" icon={BedDouble} error={e.dormitorios} requerido>
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
              {r.terreno && (
                <Field label="Medidas del lote" htmlFor="medidas_lote" error={e.medidas_lote} requerido>
                  <Input
                    id="medidas_lote"
                    name="medidas_lote"
                    defaultValue={property?.medidas_lote ?? ""}
                    placeholder="10 x 30"
                  />
                </Field>
              )}
            </div>

            {r.cochera && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cochera" htmlFor="cochera" error={e.cochera} requerido>
                  <Select id="cochera" name="cochera" value={cochera} onChange={(ev) => setCochera(ev.target.value)}>
                    <option value="">Elegí</option>
                    {COCHERA_OPCIONES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                {r.cocheraCubierta && cochera !== "" && cochera !== "no_tiene" && (
                  <label className="flex min-h-11 items-center gap-2 self-end text-sm sm:min-h-9">
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
          </Grupo>

          {(r.ambientes || r.comodidades || r.servicios) && (
            <Grupo titulo="Qué tiene">
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
            </Grupo>
          )}

          {r.vivienda && (
            <Grupo titulo="Para vivir">
              <div className="grid gap-4 sm:grid-cols-3">
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
            </Grupo>
          )}
        </Seccion>

        {/* Siempre visible; se completa solo en alquiler o venta y alquiler. Un
            fieldset deshabilitado no manda sus campos: en venta no viaja nada. */}
        <Seccion {...propsSeccion("alquiler")}>
          {!alquiler && (
            <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Elegí «Alquiler» o «Venta y alquiler» en Información principal para completar esta sección.
            </p>
          )}
          <fieldset disabled={!alquiler} className="min-w-0 space-y-5 disabled:opacity-60">
            <Grupo titulo="Contrato">
              <div className="grid gap-4 sm:grid-cols-2">
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
            </Grupo>

            <Grupo titulo="Actualización del precio">
              <div className="grid gap-4 sm:grid-cols-2">
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
            </Grupo>

            <Grupo titulo="Garantía y depósito">
              <Field label="Garantías que pide el propietario" htmlFor="garantia" error={e.garantia} requerido>
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
                <Field label="Qué pide el propietario" htmlFor="garantia_detalle" error={e.garantia_detalle} requerido>
                  <Textarea
                    id="garantia_detalle"
                    name="garantia_detalle"
                    defaultValue={internos?.garantia_detalle ?? ""}
                  />
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3.5 shrink-0" />
                    Interno: lo ve el equipo, nunca el sitio ni Martina.
                  </p>
                </Field>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Field label="Otros requisitos" htmlFor="requisitos" error={e.requisitos}>
                <Textarea
                  id="requisitos"
                  name="requisitos"
                  defaultValue={property?.requisitos ?? ""}
                  placeholder="Seguro de caución, informe comercial…"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Público: Martina los puede compartir con quien consulte.
                </p>
              </Field>
            </Grupo>
          </fieldset>
        </Seccion>

        <Seccion {...propsSeccion("acceso")}>
          <p className="flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Llaves y visitas son internas: las ve el equipo, nunca el sitio ni Martina.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Cómo se coordinan las visitas" htmlFor="visitas" error={e.visitas} requerido>
            <Textarea
              id="visitas"
              name="visitas"
              defaultValue={internos?.visitas ?? ""}
              placeholder="Días y horarios, a quién avisar…"
            />
          </Field>
        </Seccion>

        <Seccion {...propsSeccion("extras")}>
          <Field label="Descripción (pública)" htmlFor="descripcion" error={e.descripcion}>
            <Textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              defaultValue={property?.descripcion ?? ""}
              placeholder="Detalles para el cliente: terminaciones, estado, orientación…"
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

          {isNew && (
            <Grupo titulo="Fotos">
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
                  className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="size-6" />
                  Tocá para agregar fotos (máx. {MAX_FOTOS}). La primera queda como portada.
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {photos.map((file, i) => (
                      <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                        {i === 0 && (
                          <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                            Portada
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="Quitar foto"
                          onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                          className="absolute right-1 top-1 rounded bg-destructive p-1 text-destructive-foreground"
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
            </Grupo>
          )}
        </Seccion>
      </div>

      {/* Costado: avance por sección (escritorio), publicación y botones. En el
          celular queda después de las secciones y los botones van en la barra fija. */}
      <aside className="mt-3 space-y-3 lg:sticky lg:top-20 lg:mt-0">
        <Card className="hidden lg:block">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">
              {totalFaltan === 0
                ? "Lista para publicar"
                : totalFaltan === 1
                  ? "Falta 1 dato para publicar"
                  : `Faltan ${totalFaltan} datos para publicar`}
            </p>
          </div>
          <ul className="py-1">
            {SECCIONES.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => irASeccion(s.id)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <s.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{s.titulo}</span>
                  <EstadoSeccionBadge estado={estadoDe(s.id)} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="space-y-4 p-4">
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
              <p className="text-xs text-muted-foreground">
                Privada: no sale en la web, pero Martina la puede ofrecer.
              </p>
            </Field>

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

            <div className="hidden flex-col gap-2 lg:flex">
              <Button type="submit" size="lg" className="w-full" disabled={ocupado} name="intent" value="publicar">
                {ocupado && <Loader2 className="animate-spin" />}
                {textoPrincipal}
              </Button>
              <Button
                type="submit"
                size="lg"
                variant="outline"
                className="w-full"
                disabled={ocupado}
                name="intent"
                value="borrador"
              >
                <ClipboardList />
                {textoBorrador}
              </Button>
            </div>
          </div>
        </Card>
      </aside>

      {/* Celular: barra fija con cuánto falta (lleva al primer dato) y los botones. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-3 space-y-2 border-t bg-background/90 px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
        <button
          type="button"
          onClick={() => totalFaltan > 0 && irAlCampo(faltantesVivos[0]!)}
          className={cn(
            "flex w-full items-center gap-1.5 text-left text-xs font-medium",
            totalFaltan > 0 ? "text-amber-900" : "text-primary"
          )}
        >
          {totalFaltan > 0 ? <AlertTriangle className="size-3.5 shrink-0" /> : <Check className="size-3.5 shrink-0" />}
          <span className="flex-1">
            {totalFaltan === 0
              ? "Lista para publicar"
              : totalFaltan === 1
                ? "Falta 1 dato para publicar"
                : `Faltan ${totalFaltan} datos para publicar`}
          </span>
          {totalFaltan > 0 && <span className="underline underline-offset-2">Ir al primero</span>}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" size="lg" variant="outline" className="w-full" disabled={ocupado} name="intent" value="borrador">
            {isNew || esBorrador ? "Borrador" : "A borrador"}
          </Button>
          <Button type="submit" size="lg" className="w-full" disabled={ocupado} name="intent" value="publicar">
            {ocupado && <Loader2 className="animate-spin" />}
            {textoPrincipal}
          </Button>
        </div>
      </div>
    </form>
  );
}
