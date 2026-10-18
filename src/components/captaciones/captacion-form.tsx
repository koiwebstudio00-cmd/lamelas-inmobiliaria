"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { guardarCaptacion, guardarMensajeCaptacion } from "@/actions/captaciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import {
  AMBIENTES,
  AMOBLADO,
  aplica,
  BARRIOS,
  COCHERA,
  COMODIDADES,
  DATOS_VACIOS,
  DEPOSITOS,
  DISPONIBILIDAD,
  FRECUENCIAS,
  GARANTIAS,
  INDICES,
  LLAVES,
  LOCALIDADES,
  linkWhatsApp,
  PASOS,
  PLAZOS,
  PUBLICACION,
  SERVICIOS,
  SI_NO_CONVENIR,
  TIPOS_INMUEBLE,
  validarPaso,
  type CaptacionDatos,
  type Errores,
} from "@/lib/captacion";
import { cn } from "@/lib/utils";

type Vendedor = { id: string; nombre: string };

/**
 * Formulario de captación en cuatro pasos + el mensaje listo para el grupo.
 * Al pasar del cuarto paso se guarda (alta o edición) y se muestra el mensaje:
 * se puede retocar antes de copiarlo o abrirlo en WhatsApp.
 */
export function CaptacionForm({
  vendedores,
  responsableInicial,
  inicial,
}: {
  vendedores: Vendedor[];
  responsableInicial: string;
  inicial?: { id: string; datos: CaptacionDatos; mensaje: string };
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<CaptacionDatos>(
    () => inicial?.datos ?? { ...DATOS_VACIOS, responsable_id: responsableInicial },
  );
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState<Errores>({});
  const [id, setId] = useState<string | null>(inicial?.id ?? null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();
  const arriba = useRef<HTMLDivElement>(null);

  const a = useMemo(() => aplica(datos.tipo), [datos.tipo]);
  const responsable = vendedores.find((v) => v.id === datos.responsable_id)?.nombre ?? "";
  const listo = paso === PASOS.length;

  const set = <K extends keyof CaptacionDatos>(k: K, v: CaptacionDatos[K]) => {
    setDatos((d) => ({ ...d, [k]: v }));
    setErrores((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };
  const toggle = (k: "ambientes" | "comodidades" | "servicios", valor: string) =>
    set(k, datos[k].includes(valor) ? datos[k].filter((x) => x !== valor) : [...datos[k], valor]);

  const irA = (n: number) => {
    setPaso(n);
    arriba.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const siguiente = () => {
    const e = validarPaso(datos, paso);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      toast.error("Falta completar");
      return;
    }
    if (paso < PASOS.length - 1) return irA(paso + 1);
    startTransition(async () => {
      const res = await guardarCaptacion(id, { datos, responsable });
      if (res.error || !res.id || !res.mensaje) {
        toast.error(res.error ?? "No pudimos guardar la captación.");
        if (res.paso !== undefined) irA(res.paso);
        return;
      }
      setId(res.id);
      setMensaje(res.mensaje);
      setMensajeGuardado(res.mensaje);
      irA(PASOS.length);
    });
  };

  // Si retocó el texto, se guarda antes de mandarlo para que el historial
  // tenga lo que salió de verdad.
  const guardarSiCambio = () => {
    if (!id || mensaje === mensajeGuardado) return;
    const texto = mensaje;
    startTransition(async () => {
      const error = await guardarMensajeCaptacion(id, texto);
      if (error) toast.error(error);
      else setMensajeGuardado(texto);
    });
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      toast.success("Mensaje copiado. Pegalo en el grupo.");
    } catch {
      toast.error("No se pudo copiar: seleccioná el texto y copialo a mano.");
    }
    guardarSiCambio();
  };

  const otra = () => {
    setDatos({ ...DATOS_VACIOS, responsable_id: responsableInicial });
    setId(null);
    setMensaje("");
    setMensajeGuardado("");
    setErrores({});
    if (inicial) router.push("/captaciones/nueva");
    else irA(0);
  };

  return (
    <div ref={arriba} className="scroll-mt-20 space-y-4">
      <Encabezado paso={paso} />

      {paso === 0 && (
        <Seccion>
          <Campo label="Responsable de la propiedad" error={errores.responsable_id}>
            <Select value={datos.responsable_id} onChange={(e) => set("responsable_id", e.target.value)}>
              <option value="">Elegir…</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Tipo de inmueble" error={errores.tipo}>
            <Opciones valor={datos.tipo} opciones={TIPOS_INMUEBLE} onChange={(v) => set("tipo", v)} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Calle y altura" error={errores.calle}>
              <Input value={datos.calle} onChange={(e) => set("calle", e.target.value)} placeholder="Ej.: General Paz 1080" />
            </Campo>
            <Campo label="Piso y departamento" opcional>
              <Input value={datos.piso_depto} onChange={(e) => set("piso_depto", e.target.value)} placeholder="Ej.: 2A" />
            </Campo>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Localidad" error={errores.localidad}>
              <Opciones valor={datos.localidad} opciones={LOCALIDADES} onChange={(v) => set("localidad", v)} />
            </Campo>
            <Campo label="Barrio" error={errores.barrio}>
              <Opciones valor={datos.barrio} opciones={BARRIOS} onChange={(v) => set("barrio", v)} />
            </Campo>
          </div>
          {datos.localidad === "Otra" && (
            <Campo label="Nombre de la localidad" error={errores.localidad_otra}>
              <Input value={datos.localidad_otra} onChange={(e) => set("localidad_otra", e.target.value)} />
            </Campo>
          )}
          {datos.barrio === "Otro" && (
            <Campo label="Nombre del barrio" error={errores.barrio_otro}>
              <Input value={datos.barrio_otro} onChange={(e) => set("barrio_otro", e.target.value)} />
            </Campo>
          )}
          <Campo label="Punto de referencia o zona" opcional>
            <Input
              value={datos.referencia}
              onChange={(e) => set("referencia", e.target.value)}
              placeholder="Ej.: a 5 cuadras de plaza Yrigoyen"
            />
          </Campo>
        </Seccion>
      )}

      {paso === 1 && (
        <Seccion>
          {!datos.tipo && <p className="text-sm text-muted-foreground">Elegí el tipo de inmueble en el paso anterior.</p>}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {a.dormitorios && (
              <Campo label="Dormitorios" error={errores.dormitorios}>
                <Numero value={datos.dormitorios} onChange={(v) => set("dormitorios", v)} />
              </Campo>
            )}
            {a.banos && (
              <Campo label="Baños" error={errores.banos}>
                <Numero value={datos.banos} onChange={(v) => set("banos", v)} />
              </Campo>
            )}
            {a.m2_cubiertos && (
              <Campo label="m² cubiertos" error={errores.m2_cubiertos}>
                <Numero value={datos.m2_cubiertos} onChange={(v) => set("m2_cubiertos", v)} />
              </Campo>
            )}
            {a.terreno && (
              <Campo label="m² de terreno" error={errores.m2_terreno}>
                <Numero value={datos.m2_terreno} onChange={(v) => set("m2_terreno", v)} />
              </Campo>
            )}
          </div>
          {a.terreno && (
            <Campo label="Medidas del lote (frente x fondo)" error={errores.medidas_lote}>
              <Input value={datos.medidas_lote} onChange={(e) => set("medidas_lote", e.target.value)} placeholder="Ej.: 10 x 30" />
            </Campo>
          )}
          {a.cochera && (
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <Campo label="Cochera" error={errores.cochera}>
                <Opciones valor={datos.cochera} opciones={COCHERA} onChange={(v) => set("cochera", v)} />
              </Campo>
              {a.cochera_cubierta && datos.cochera && datos.cochera !== "No tiene" && (
                <label className="flex min-h-9 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={datos.cochera_cubierta}
                    onChange={(e) => set("cochera_cubierta", e.target.checked)}
                  />
                  Cubierta en edificio
                </label>
              )}
            </div>
          )}
          {a.ambientes && (
            <Campo label="Ambientes" error={errores.ambientes} opcional={!a.ambientes_obligatorio}>
              <Chips opciones={AMBIENTES} marcadas={datos.ambientes} onToggle={(v) => toggle("ambientes", v)} />
            </Campo>
          )}
          {a.comodidades && (
            <Campo label="Espacios y comodidades" opcional>
              <Chips opciones={COMODIDADES} marcadas={datos.comodidades} onToggle={(v) => toggle("comodidades", v)} />
            </Campo>
          )}
          {a.servicios && (
            <Campo label="Servicios" error={errores.servicios}>
              <Chips opciones={SERVICIOS} marcadas={datos.servicios} onToggle={(v) => toggle("servicios", v)} />
            </Campo>
          )}
          {a.vivienda && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo label="Amoblado" error={errores.amoblado}>
                <Opciones valor={datos.amoblado} opciones={AMOBLADO} onChange={(v) => set("amoblado", v)} />
              </Campo>
              <Campo label="Acepta mascotas" error={errores.mascotas}>
                <Opciones valor={datos.mascotas} opciones={SI_NO_CONVENIR} onChange={(v) => set("mascotas", v)} />
              </Campo>
              <Campo label="Acepta niños" error={errores.ninos}>
                <Opciones valor={datos.ninos} opciones={SI_NO_CONVENIR} onChange={(v) => set("ninos", v)} />
              </Campo>
            </div>
          )}
        </Seccion>
      )}

      {paso === 2 && (
        <Seccion>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Precio del alquiler" error={errores.precio}>
              <div className="flex gap-2">
                <Select
                  aria-label="Moneda"
                  className="w-28 shrink-0"
                  value={datos.moneda}
                  onChange={(e) => set("moneda", e.target.value === "USD" ? "USD" : "ARS")}
                >
                  <option value="ARS">$ pesos</option>
                  <option value="USD">USD dólares</option>
                </Select>
                <Numero value={datos.precio} onChange={(v) => set("precio", v)} />
              </div>
            </Campo>
            <Campo label="Expensas — en pesos" error={errores.expensas} ayuda="0 si no tiene.">
              <Numero value={datos.expensas} onChange={(v) => set("expensas", v)} />
            </Campo>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Plazo del contrato" error={errores.plazo}>
              <Opciones valor={datos.plazo} opciones={PLAZOS} onChange={(v) => set("plazo", v)} />
            </Campo>
            <Campo label="Índice de actualización" error={errores.indice}>
              <Opciones valor={datos.indice} opciones={INDICES} onChange={(v) => set("indice", v)} />
            </Campo>
            <Campo label="Cada cuánto se actualiza" error={errores.frecuencia}>
              <Opciones valor={datos.frecuencia} opciones={FRECUENCIAS} onChange={(v) => set("frecuencia", v)} />
            </Campo>
          </div>
          {datos.plazo.startsWith("Otro") && (
            <Campo label="Cantidad de meses del contrato" error={errores.plazo_otro}>
              <Numero value={datos.plazo_otro} onChange={(v) => set("plazo_otro", v)} />
            </Campo>
          )}
          {datos.indice.startsWith("Otro") && (
            <Campo label="Detalle de la actualización" error={errores.indice_otro}>
              <Input value={datos.indice_otro} onChange={(e) => set("indice_otro", e.target.value)} />
            </Campo>
          )}
          {datos.frecuencia.startsWith("Otro") && (
            <Campo label="Cada cuántos meses" error={errores.frecuencia_otro}>
              <Numero value={datos.frecuencia_otro} onChange={(v) => set("frecuencia_otro", v)} />
            </Campo>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Garantías que pide el propietario" error={errores.garantia}>
              <Opciones valor={datos.garantia} opciones={GARANTIAS} onChange={(v) => set("garantia", v)} />
            </Campo>
            <Campo label="Depósito en garantía" error={errores.deposito}>
              <Opciones valor={datos.deposito} opciones={DEPOSITOS} onChange={(v) => set("deposito", v)} />
            </Campo>
          </div>
          {datos.garantia.startsWith("Especial") && (
            <Campo label="Qué pide el propietario" error={errores.garantia_detalle}>
              <Input value={datos.garantia_detalle} onChange={(e) => set("garantia_detalle", e.target.value)} />
            </Campo>
          )}
          {datos.deposito.startsWith("En dólares") && (
            <Campo label="Monto del depósito en dólares" error={errores.deposito_usd}>
              <Numero value={datos.deposito_usd} onChange={(v) => set("deposito_usd", v)} />
            </Campo>
          )}
          {datos.deposito.startsWith("Otra") && (
            <Campo label="Detalle del depósito" error={errores.deposito_otro}>
              <Input value={datos.deposito_otro} onChange={(e) => set("deposito_otro", e.target.value)} />
            </Campo>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Disponibilidad" error={errores.disponibilidad}>
              <Opciones valor={datos.disponibilidad} opciones={DISPONIBILIDAD} onChange={(v) => set("disponibilidad", v)} />
            </Campo>
            {datos.disponibilidad.endsWith("…") && (
              <Campo label="Fecha" error={errores.disponibilidad_fecha}>
                <Input
                  type="date"
                  value={datos.disponibilidad_fecha}
                  onChange={(e) => set("disponibilidad_fecha", e.target.value)}
                />
              </Campo>
            )}
          </div>
        </Seccion>
      )}

      {paso === 3 && (
        <Seccion>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Llaves" error={errores.llaves}>
              <Opciones valor={datos.llaves} opciones={LLAVES} onChange={(v) => set("llaves", v)} />
            </Campo>
            <Campo label="Publicación en redes" error={errores.publicacion}>
              <Opciones valor={datos.publicacion} opciones={PUBLICACION} onChange={(v) => set("publicacion", v)} />
            </Campo>
          </div>
          <Campo label="Cómo se coordinan las visitas" error={errores.visitas}>
            <Input
              value={datos.visitas}
              onChange={(e) => set("visitas", e.target.value)}
              placeholder="Ej.: avisar 24 h antes al propietario"
            />
          </Campo>
          <Campo label="Observaciones" opcional>
            <Textarea value={datos.observaciones} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Campo>
        </Seccion>
      )}

      {listo && (
        <Seccion>
          <p className="text-sm text-muted-foreground">
            Revisalo, tocá “Abrir WhatsApp” y elegí el grupo. Podés editarlo antes de enviar. Si WhatsApp no se abre solo,
            usá “Copiar texto” y pegalo en el grupo.
          </p>
          <Textarea
            aria-label="Mensaje para el grupo"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onBlur={guardarSiCambio}
            rows={18}
            className="font-mono text-[13px] leading-relaxed"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              <a href={linkWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer" onClick={guardarSiCambio}>
                <WhatsappIcon className="size-4" /> Abrir WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={copiar}>
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar texto"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={otra}>
              <Plus className="size-4" /> Cargar otra propiedad
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => irA(0)}>
              Corregir datos
            </Button>
            {id && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/captaciones/${id}`}>Ver captación</Link>
              </Button>
            )}
          </div>
        </Seccion>
      )}

      {!listo && (
        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          {paso > 0 && (
            <Button type="button" variant="outline" onClick={() => irA(paso - 1)} disabled={pending}>
              <ChevronLeft className="size-4" /> Atrás
            </Button>
          )}
          <Button type="button" className="flex-1 sm:flex-none" onClick={siguiente} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : paso === PASOS.length - 1 ? (
              <>Generar mensaje</>
            ) : (
              <>
                Siguiente <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Piezas ───────────────────────────────────────────────────────────────────

function Encabezado({ paso }: { paso: number }) {
  const total = PASOS.length;
  const listo = paso === total;
  const actual = PASOS[paso];
  return (
    <div className="space-y-2">
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: total + 1 }, (_, i) => (
          <span key={i} className={cn("h-1 flex-1 bg-muted", i <= paso && "bg-primary")} />
        ))}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {listo ? "Listo" : `Paso ${paso + 1} de ${total}`}
        </p>
        <h2 className="text-lg font-semibold">{listo ? "Mensaje listo" : actual.titulo}</h2>
        {!listo && <p className="text-sm text-muted-foreground">{actual.subtitulo}</p>}
      </div>
    </div>
  );
}

function Seccion({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 border bg-background p-4">{children}</div>;
}

function Campo({
  label,
  error,
  opcional,
  ayuda,
  children,
}: {
  label: string;
  error?: string;
  opcional?: boolean;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-error={error ? "" : undefined}>
      <Label className="flex items-baseline gap-1">
        {label}
        {opcional && <span className="text-xs font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>
      )}
    </div>
  );
}

function Opciones({
  valor,
  opciones,
  onChange,
}: {
  valor: string;
  opciones: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={valor} onChange={(e) => onChange(e.target.value)}>
      <option value="">Elegir…</option>
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </Select>
  );
}

function Numero({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
      className="tabular-nums"
    />
  );
}

function Chips({
  opciones,
  marcadas,
  onToggle,
}: {
  opciones: readonly string[];
  marcadas: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => {
        const on = marcadas.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1 border px-3 text-sm transition-colors",
              on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
            )}
          >
            {on && <Check className="size-3.5" aria-hidden />}
            {o}
          </button>
        );
      })}
    </div>
  );
}
