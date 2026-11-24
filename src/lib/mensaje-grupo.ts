/**
 * Mensaje para el grupo de WhatsApp del equipo, armado desde una propiedad
 * (FORM-UNICO-01). Mismo formato que el de la captación (`armarMensaje` en
 * src/lib/captacion.ts): negritas de WhatsApp en los datos, separador y el
 * cierre operativo sin negrita.
 *
 * - Alquiler: igual que la captación.
 * - Venta: `*VENTA · TIPO*`, precio y características; sin contrato, depósito
 *   ni garantías.
 * - Ambas: los dos precios y las condiciones de alquiler.
 *
 * Es para el grupo interno: lleva llaves, visitas y notas. Las líneas sin dato
 * se omiten (una propiedad vieja puede no tener todo cargado).
 */
import { reglasPorTipo } from "@/lib/completitud";
import {
  AJUSTES,
  AMOBLADO_OPCIONES,
  COCHERA_OPCIONES,
  DEPOSITOS,
  DISPONIBILIDADES,
  GARANTIAS,
  INDICES,
  LLAVES_OPCIONES,
  MASCOTAS,
  PLAZOS,
  SI_NO_CONVENIR,
  tipoLabel,
  type Moneda,
  type Property,
} from "@/lib/types";

const labelOf = (list: { value: string; label: string }[], value: string | null | undefined) =>
  value ? (list.find((o) => o.value === value)?.label ?? value) : null;

const miles = (n: number) => Math.round(n).toLocaleString("es-AR");
const monto = (n: number, moneda: Moneda) => (moneda === "USD" ? `USD ${miles(n)}` : `$${miles(n)}`);
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const lista = (items: string[]) => items.map(minuscula).join(", ");

function fecha(iso: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** "$45.000" si es un número, "no tiene" si es 0, el texto tal cual si no. */
function expensas(v: string | null): string | null {
  const t = v?.trim();
  if (!t) return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  if (Number.isFinite(n)) return n > 0 ? monto(n, "ARS") : "no tiene";
  return t;
}

function contrato(p: Property): string | null {
  const plazo =
    p.plazo_contrato === "otro"
      ? p.plazo_otro?.trim()
        ? `${p.plazo_otro.trim()} meses`
        : null
      : p.plazo_contrato === "a_convenir"
        ? "a convenir"
        : labelOf(PLAZOS, p.plazo_contrato);
  const indice =
    p.indice_ajuste === "otro"
      ? p.indice_otro?.trim() || null
      : p.indice_ajuste === "fijo" && p.indice_fijo_pct != null
        ? `fijo ${p.indice_fijo_pct}%`
        : p.indice_ajuste === "a_convenir"
          ? "índice a convenir"
          : labelOf(INDICES, p.indice_ajuste);
  const frecuencia =
    p.ajuste === "otro"
      ? p.ajuste_otro?.trim()
        ? `cada ${p.ajuste_otro.trim()} meses`
        : null
      : p.ajuste
        ? minuscula(labelOf(AJUSTES, p.ajuste) ?? p.ajuste)
        : null;
  const partes = [plazo, indice].filter(Boolean).join(" · ");
  if (!partes && !frecuencia) return null;
  return frecuencia ? `${partes || "—"} (${frecuencia})` : partes;
}

function deposito(p: Property): string | null {
  if (p.deposito === "dolares" || p.deposito === "otro") {
    const d = p.deposito_detalle?.trim();
    if (!d) return null;
    return p.deposito === "dolares" && /^\d+([.,]\d+)?$/.test(d) ? `USD ${d}` : d;
  }
  return labelOf(DEPOSITOS, p.deposito);
}

function garantia(p: Property): string | null {
  if (p.garantia === "especial") return p.datos_internos?.garantia_detalle?.trim() || "Especial";
  return labelOf(GARANTIAS, p.garantia);
}

function disponibilidad(p: Property): string | null {
  if (p.disponibilidad === "mostrar_desde") return `Se puede mostrar a partir del ${fecha(p.disponible_desde)}`;
  if (p.disponibilidad === "se_desocupa") return `Alquilado, se desocupa el ${fecha(p.disponible_desde)}`;
  return labelOf(DISPONIBILIDADES, p.disponibilidad);
}

export function mensajeGrupo(p: Property, responsable: string | null): string {
  const a = reglasPorTipo(p.tipo);
  const b = (s: string) => `*${s}*`;
  const out: string[] = [];
  const alquila = p.operacion === "alquiler" || p.operacion === "ambos";

  const encabezado =
    p.operacion === "venta" ? "VENTA" : p.operacion === "ambos" ? "VENTA Y ALQUILER" : "ALQUILER";
  out.push(b(`${encabezado} · ${tipoLabel(p.tipo).toUpperCase()}`));

  const calle = [p.direccion?.trim(), p.edificio ? p.edificio.nombre : null, p.unidad?.trim()]
    .filter(Boolean)
    .join(", ");
  const ubicacion = [p.zona, p.ciudad].filter(Boolean).join(", ");
  if (calle || ubicacion) out.push(b(`📍 ${calle}${calle && ubicacion ? " — " : ""}${ubicacion}`));
  if (p.punto_referencia?.trim()) out.push(b(`🧭 Ref.: ${p.punto_referencia.trim()}`));
  out.push("");

  // Precios: en alquiler `precio` es el alquiler; en ambas, `precio` es venta.
  if (p.operacion === "ambos") {
    out.push(b(`💲 Venta: ${monto(p.precio, p.moneda)}`));
    if (p.precio_alquiler != null)
      out.push(b(`💲 Alquiler: ${monto(p.precio_alquiler, p.moneda_alquiler ?? p.moneda)}`));
  } else {
    out.push(b(`💲 Precio: ${monto(p.precio, p.moneda)}`));
  }
  const exp = expensas(p.expensas);
  if (exp) out.push(b(`➕ Expensas: ${exp}`));
  if (alquila) {
    const c = contrato(p);
    if (c) out.push(b(`📆 Contrato: ${c}`));
    const d = deposito(p);
    if (d) out.push(b(`🔐 Depósito en garantía: ${d}`));
    const g = garantia(p);
    if (g) out.push(b(`📋 Garantías: ${g}`));
  }
  out.push("");

  const dormitorios =
    a.dormitorios && p.dormitorios != null
      ? p.dormitorios === 0
        ? "Monoambiente"
        : `${p.dormitorios} dorm.`
      : "";
  const banos =
    a.banios && p.banios != null ? `${p.banios} ${p.banios === 1 ? "baño" : "baños"}` : "";
  const dormBanos = [dormitorios, banos].filter(Boolean);
  if (dormBanos.length) out.push(b(`${dormitorios ? "🛏" : "🚿"} ${dormBanos.join(" · ")}`));

  const superficie = [
    a.supCubierta && p.sup_cubierta != null ? `${miles(p.sup_cubierta)} m² cubiertos` : "",
    a.terreno && p.sup_total != null ? `${miles(p.sup_total)} m² de terreno` : "",
    a.terreno && p.medidas_lote?.trim() ? `lote ${p.medidas_lote.trim()}` : "",
  ].filter(Boolean);
  if (superficie.length) out.push(b(`📐 ${superficie.join(" · ")}`));

  if (a.cochera && p.cochera) {
    const cubierta =
      a.cocheraCubierta && p.cochera_cubierta && p.cochera !== "no_tiene" ? " (cubierta en edificio)" : "";
    out.push(b(`🚗 Cochera: ${labelOf(COCHERA_OPCIONES, p.cochera)}${cubierta}`));
  }
  if (a.ambientes && p.ambientes_lista.length) out.push(b(`🏠 Ambientes: ${lista(p.ambientes_lista)}`));
  if (a.comodidades && p.comodidades.length) out.push(b(`🌿 Además: ${lista(p.comodidades)}`));
  if (a.servicios && p.servicios.length) out.push(b(`⚙️ Servicios: ${lista(p.servicios)}`));
  if (a.vivienda && p.amoblado) out.push(b(`🪑 Amoblado: ${labelOf(AMOBLADO_OPCIONES, p.amoblado)}`));

  if (p.notas?.trim()) {
    out.push("");
    out.push(b(`📝 ${p.notas.trim()}`));
  }
  out.push("--------------------------------");
  const disp = disponibilidad(p);
  if (disp) out.push(`🗓 ${disp}`);
  if (a.vivienda && alquila && (p.mascotas || p.acepta_ninos)) {
    out.push(
      `🐾 Mascotas: ${labelOf(MASCOTAS, p.mascotas) ?? "—"} · 👶 Niños: ${labelOf(SI_NO_CONVENIR, p.acepta_ninos) ?? "—"}`
    );
  }
  const internos = p.datos_internos;
  if (internos?.llaves) out.push(`🗝 Llaves: ${labelOf(LLAVES_OPCIONES, internos.llaves)}`);
  if (internos?.visitas?.trim()) out.push(`👁 Visitas: ${internos.visitas.trim()}`);
  if (p.estado === "privado") out.push("📣 No publicar — solo ofrecer");
  if (responsable) out.push(`👤 Responsable: ${responsable}`);
  return out.join("\n");
}
