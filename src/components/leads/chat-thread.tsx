"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Download, ExternalLink, FileText, Headset, ImageIcon, Loader2, Megaphone, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { origenAnuncio } from "@/lib/anuncios";
import type { AdjuntoMensaje, AnuncioOrigen, CitaMensaje, ConversacionMensaje, RolMensaje } from "@/lib/types";

// Chat del panel con la forma de WhatsApp (CHAT-WHATSAPP-01): separadores por
// día, burbujas agrupadas por autor con la hora adentro, la cita arriba de la
// respuesta (tocarla lleva al mensaje original) y la tarjeta del anuncio desde
// el que escribió el cliente.

const TZ = "America/Argentina/Tucuman";

/** Clave de día en hora de Tucumán (YYYY-MM-DD). */
const diaDe = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso)
  );

const horaDe = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

/** "Hoy", "Ayer" o "lunes 12 de octubre" (con año si no es el actual). */
export function etiquetaDia(iso: string, ahora = new Date()) {
  const dia = diaDe(iso);
  const hoy = diaDe(ahora.toISOString());
  const ayer = diaDe(new Date(ahora.getTime() - 24 * 60 * 60 * 1000).toISOString());
  if (dia === hoy) return "Hoy";
  if (dia === ayer) return "Ayer";
  const mismoAnio = dia.slice(0, 4) === hoy.slice(0, 4);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(mismoAnio ? {} : { year: "numeric" }),
  }).format(new Date(iso));
}

/** Mensajes seguidos del mismo autor, a menos de 5 minutos, van agrupados. */
const AGRUPAR_MS = 5 * 60 * 1000;

/** Ícono de quién escribe: Martina un robot, el cliente una persona, el vendedor auriculares. */
const ICONO: Record<RolMensaje, { icono: LucideIcon; color: string } | null> = {
  lead: { icono: UserRound, color: "text-sky-600" },
  agente_ia: { icono: Bot, color: "text-primary" },
  vendedor: { icono: Headset, color: "text-primary" },
  sistema: null,
};

function IconoAutor({ rol }: { rol: RolMensaje }) {
  const i = ICONO[rol];
  if (!i) return null;
  const Icono = i.icono;
  return <Icono className={cn("size-3.5", i.color)} aria-hidden />;
}

const LADO: Record<RolMensaje, "izq" | "der" | "centro"> = {
  lead: "izq",
  agente_ia: "der",
  vendedor: "der",
  sistema: "centro",
};

// ── Análisis de imagen ───────────────────────────────────────────────────────
// Cuando el cliente manda una imagen, n8n registra como texto el análisis que
// le pasa a Martina. No es algo que haya escrito el cliente: se muestra como
// "Imagen" y el análisis queda plegado.
const MARCA_IMAGEN = "[ANALISIS_IMAGEN_NO_VERIFICADO]";

type AnalisisImagen = { textoVisible: string[]; referencias: string[]; resto: string };

export function analisisImagen(contenido: string): AnalisisImagen | null {
  const i = contenido.indexOf(MARCA_IMAGEN);
  if (i < 0) return null;
  const antes = contenido.slice(0, i).trim();
  const despues = contenido.slice(i + MARCA_IMAGEN.length).trim();
  try {
    const fin = despues.lastIndexOf("}");
    const json = JSON.parse(despues.slice(0, fin + 1)) as { texto_visible?: unknown; referencias_propiedad?: unknown };
    const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    const resto = [antes, despues.slice(fin + 1).trim()].filter(Boolean).join("\n");
    return { textoVisible: lista(json.texto_visible), referencias: lista(json.referencias_propiedad), resto };
  } catch {
    return { textoVisible: [], referencias: [], resto: antes };
  }
}

function ImagenAnalizada({ analisis, conImagen = false }: { analisis: AnalisisImagen; conImagen?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const hayDetalle = analisis.textoVisible.length > 0 || analisis.referencias.length > 0;
  return (
    <div className="space-y-1">
      {/* Si la imagen está guardada se ve arriba; si no, queda el rótulo. */}
      {!conImagen && (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <ImageIcon className="size-4" /> Imagen
        </p>
      )}
      {analisis.resto && <p className="whitespace-pre-wrap">{analisis.resto}</p>}
      {hayDetalle && (
        <div>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Lo que leyó Martina
            <ChevronDown className={cn("size-3 transition-transform", abierto && "rotate-180")} />
          </button>
          {abierto && (
            <div className="mt-1 space-y-1 border-l-2 pl-2 text-xs text-muted-foreground">
              {analisis.referencias.length > 0 && <p>Referencias: {analisis.referencias.join(" · ")}</p>}
              {analisis.textoVisible.length > 0 && <p className="whitespace-pre-wrap">{analisis.textoVisible.join("\n")}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Adjuntos (CHAT-MEDIA-01) ─────────────────────────────────────────────────
// El archivo se pide a /api/chat-media/…, que consigue un link firmado de 5
// minutos de la API y redirige: el navegador lo baja directo de la API.

/** Texto que deja el backend cuando el vendedor manda un archivo desde WhatsApp Business. */
const PLACEHOLDER_BUSINESS = /^\[(Imagen|Audio|Archivo) enviad[oa] desde WhatsApp Business\]$/;

const ESTADO_ADJUNTO: Partial<Record<AdjuntoMensaje["estado"], string>> = {
  pendiente: "Guardando archivo…",
  expirado: "No se pudo guardar el archivo (WhatsApp ya lo había borrado)",
  fallido: "No se pudo guardar el archivo",
  borrado: "Archivo vencido (se guardan 90 días)",
  no_soportado: "Archivo no soportado",
};

function tamano(bytes: number | null) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Adjunto({ adjunto, conversacionId }: { adjunto: AdjuntoMensaje; conversacionId: string }) {
  const src = `/api/chat-media/${conversacionId}/${adjunto.id}`;
  if (adjunto.estado !== "guardado") {
    return (
      <p className="mb-1 flex items-center gap-1.5 border border-dashed border-black/15 px-2 py-1.5 text-xs text-muted-foreground">
        {adjunto.estado === "pendiente" ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
        {ESTADO_ADJUNTO[adjunto.estado]}
      </p>
    );
  }
  switch (adjunto.tipo) {
    case "imagen":
      return (
        <a href={src} target="_blank" rel="noopener noreferrer" className="mb-1 block" title="Ver la imagen completa">
          {/* eslint-disable-next-line @next/next/no-img-element -- archivo privado servido por la API con link firmado */}
          <img src={src} alt="Imagen enviada por WhatsApp" loading="lazy" className="max-h-72 w-full max-w-[260px] object-cover" />
        </a>
      );
    case "audio":
      return (
        <div className="mb-1 space-y-1">
          <audio controls preload="none" src={src} className="w-64 max-w-full" />
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:underline">
            <Download className="size-3" /> Descargar audio
          </a>
        </div>
      );
    case "video":
      return <video controls preload="metadata" src={src} className="mb-1 max-h-72 w-full max-w-[300px] bg-black" />;
    case "documento":
      return (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex items-center gap-2 border border-black/10 bg-background/70 px-2 py-2 text-foreground hover:bg-background"
        >
          <FileText className="size-6 shrink-0 text-rose-600" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{adjunto.nombre_archivo ?? "Documento PDF"}</span>
            <span className="text-[11px] text-muted-foreground">PDF {tamano(adjunto.bytes)} · Abrir</span>
          </span>
        </a>
      );
  }
}

// ── Anuncio de origen ────────────────────────────────────────────────────────
function TarjetaAnuncio({ anuncio }: { anuncio: AnuncioOrigen }) {
  const [verMas, setVerMas] = useState(false);
  const [sinImagen, setSinImagen] = useState(false);
  const largo = (anuncio.body?.length ?? 0) > 160;
  const origen = origenAnuncio(anuncio);
  return (
    <div className="mb-2 border border-black/10 bg-background/70 text-foreground">
      <div className="flex gap-2 p-2">
        {anuncio.image_url && !sinImagen && (
          // eslint-disable-next-line @next/next/no-img-element -- CDN de Facebook (caduca): no pasa por next/image
          <img
            src={anuncio.image_url}
            alt=""
            className="size-14 shrink-0 object-cover"
            onError={() => setSinImagen(true)}
            referrerPolicy="no-referrer"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-primary">
            <Megaphone className="size-3" /> Llegó desde {origen.descripcion}
          </p>
          {anuncio.headline && <p className="truncate text-xs font-medium">{anuncio.headline}</p>}
          {anuncio.body && (
            <p className={cn("whitespace-pre-wrap text-xs text-muted-foreground", !verMas && "line-clamp-3")}>
              {anuncio.body}
            </p>
          )}
          {(largo || origen.link) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {largo && (
                <button
                  type="button"
                  onClick={() => setVerMas((v) => !v)}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  {verMas ? "Ver menos" : "Ver más"}
                </button>
              )}
              {origen.link && (
                <a
                  href={origen.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                >
                  {origen.accion} <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cita ─────────────────────────────────────────────────────────────────────
function BloqueCita({
  cita,
  autorDe,
  onIr,
}: {
  cita: CitaMensaje;
  autorDe: (rol: RolMensaje) => string;
  onIr: (id: string) => void;
}) {
  if ("desconocida" in cita) {
    return (
      <div className="mb-1.5 border-l-4 border-muted-foreground/40 bg-black/5 px-2 py-1 text-xs italic text-muted-foreground">
        Respondió a un mensaje anterior
      </div>
    );
  }
  const analisis = analisisImagen(cita.extracto);
  const texto = analisis ? "📷 Imagen" : cita.extracto;
  return (
    <button
      type="button"
      onClick={() => onIr(cita.message_id)}
      className={cn(
        "mb-1.5 block w-full border-l-4 bg-black/5 px-2 py-1 text-left text-xs hover:bg-black/10",
        cita.rol === "lead" ? "border-sky-500" : "border-primary"
      )}
      title="Ir al mensaje citado"
    >
      <span className={cn("block font-medium", cita.rol === "lead" ? "text-sky-700" : "text-primary")}>
        {autorDe(cita.rol)}
      </span>
      <span className="line-clamp-2 whitespace-pre-wrap text-muted-foreground">{texto}</span>
    </button>
  );
}

// ── Hilo ─────────────────────────────────────────────────────────────────────
export function ChatThread({
  conversacionId,
  mensajes,
  leadNombre,
  className,
}: {
  conversacionId: string;
  mensajes: ConversacionMensaje[];
  leadNombre: string;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [resaltado, setResaltado] = useState<string | null>(null);

  // El hilo abre mostrando lo último (como cualquier chat). Se reancla cuando
  // cambia la cantidad de mensajes (p. ej. tras "Refrescar").
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length]);

  useEffect(() => {
    if (!resaltado) return;
    const t = setTimeout(() => setResaltado(null), 1600);
    return () => clearTimeout(t);
  }, [resaltado]);

  const autorDe = useCallback(
    (rol: RolMensaje) =>
      rol === "lead" ? leadNombre : rol === "agente_ia" ? "Martina (IA)" : rol === "vendedor" ? "Vendedor" : "Sistema",
    [leadNombre]
  );

  const irA = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setResaltado(id);
  }, []);

  return (
    // Fondo tipo WhatsApp: la versión vertical en el celular y la horizontal
    // desde sm. Queda fijo mientras los mensajes scrollean (background-attachment
    // por defecto del contenedor), igual que en la app.
    <div
      ref={scrollRef}
      className={cn(
        "overflow-y-auto bg-background bg-cover bg-center bg-no-repeat p-3 sm:p-4",
        // Velo del color de fondo encima de la imagen: el patrón queda apenas
        // visible y no compite con los mensajes.
        "bg-[image:linear-gradient(var(--velo-chat),var(--velo-chat)),url('/chat/fondo-vertical.webp')]",
        "sm:bg-[image:linear-gradient(var(--velo-chat),var(--velo-chat)),url('/chat/fondo-horizontal.webp')]",
        "[--velo-chat:color-mix(in_oklab,var(--color-background)_85%,transparent)]",
        className
      )}
    >
      {mensajes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay mensajes en esta conversación.</p>
      ) : (
        <ul className="space-y-0.5">
          {mensajes.map((m, i) => {
            const previo = mensajes[i - 1];
            const diaNuevo = !previo || diaDe(previo.creado_at) !== diaDe(m.creado_at);
            const lado = LADO[m.rol];

            const separador = diaNuevo ? (
              <li className="flex justify-center py-2" aria-label={etiquetaDia(m.creado_at)}>
                <span className="bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm first-letter:uppercase">
                  {etiquetaDia(m.creado_at)}
                </span>
              </li>
            ) : null;

            if (lado === "centro") {
              return (
                <Fragment key={m.id}>
                  {separador}
                  <li id={`msg-${m.id}`} className="py-1 text-center">
                    <span className="text-xs text-muted-foreground">{m.contenido}</span>
                  </li>
                </Fragment>
              );
            }

            const agrupado =
              !diaNuevo &&
              previo?.rol === m.rol &&
              new Date(m.creado_at).getTime() - new Date(previo.creado_at).getTime() < AGRUPAR_MS;
            const derecha = lado === "der";
            const esVendedor = m.rol === "vendedor";
            const analisis = m.rol === "lead" ? analisisImagen(m.contenido) : null;

            return (
              <Fragment key={m.id}>
                {separador}
                <li
                  id={`msg-${m.id}`}
                  className={cn("flex flex-col", derecha ? "items-end" : "items-start", !agrupado && "pt-2")}
                >
                  {!agrupado && (
                    <span className="mb-0.5 inline-flex items-center gap-1 bg-background/85 px-1.5 text-xs font-medium text-muted-foreground">
                      <IconoAutor rol={m.rol} />
                      {autorDe(m.rol)}
                    </span>
                  )}
                  <div
                    className={cn(
                      "relative max-w-[88%] px-2.5 pb-1 pt-1.5 text-sm shadow-sm transition-colors sm:max-w-[75%]",
                      esVendedor
                        ? "bg-primary text-primary-foreground"
                        : derecha
                          ? // Sólido (no /10): sobre el fondo con dibujos, la transparencia ensucia el texto.
                            "bg-[color-mix(in_oklab,var(--color-primary)_12%,var(--color-background))] text-foreground"
                          : "bg-background text-foreground",
                      resaltado === m.id && "ring-2 ring-amber-400"
                    )}
                  >
                    {m.anuncio && <TarjetaAnuncio anuncio={m.anuncio} />}
                    {m.cita && <BloqueCita cita={m.cita} autorDe={autorDe} onIr={irA} />}
                    {m.adjuntos.map((a) => (
                      <Adjunto key={a.id} adjunto={a} conversacionId={conversacionId} />
                    ))}
                    {analisis ? (
                      <ImagenAnalizada
                        analisis={analisis}
                        conImagen={m.adjuntos.some((a) => a.tipo === "imagen" && a.estado === "guardado")}
                      />
                    ) : (
                      m.contenido &&
                      !(m.adjuntos.length > 0 && PLACEHOLDER_BUSINESS.test(m.contenido)) && (
                        <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                      )
                    )}
                    <span
                      className={cn(
                        "mt-0.5 block text-right text-[11px] tabular-nums",
                        esVendedor ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {horaDe(m.creado_at)}
                    </span>
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
