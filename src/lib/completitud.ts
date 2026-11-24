/**
 * Qué le falta a una propiedad para publicarse (FORM-UNICO-01).
 *
 * Es una COPIA para guiar al vendedor en el formulario: la que manda es la de
 * la API (`back-lamelas/src/modules/properties/completitud.ts`), que vuelve a
 * validar y responde 422 con los campos. Si cambian las reglas, cambiar las
 * dos. Mismos nombres de campo que la API (snake_case).
 */

export type ValoresCompletitud = {
  operacion?: string | null;
  tipo?: string | null;
  precio_alquiler?: unknown;
  direccion?: unknown;
  ciudad?: unknown;
  zona?: unknown;
  dormitorios?: unknown;
  banios?: unknown;
  sup_cubierta?: unknown;
  sup_total?: unknown;
  medidas_lote?: unknown;
  cochera?: unknown;
  ambientes_lista?: string[] | null;
  servicios?: string[] | null;
  amoblado?: unknown;
  mascotas?: unknown;
  acepta_ninos?: unknown;
  expensas?: unknown;
  plazo_contrato?: unknown;
  plazo_otro?: unknown;
  ajuste?: unknown;
  ajuste_otro?: unknown;
  indice_ajuste?: unknown;
  indice_otro?: unknown;
  garantia?: unknown;
  garantia_detalle?: unknown;
  deposito?: unknown;
  deposito_detalle?: unknown;
  disponibilidad?: unknown;
  disponible_desde?: unknown;
  llaves?: unknown;
  visitas?: unknown;
};

export const ETIQUETAS: Record<string, string> = {
  direccion: "Calle y altura",
  ciudad: "Localidad",
  zona: "Barrio",
  dormitorios: "Dormitorios",
  banios: "Baños",
  sup_cubierta: "m² cubiertos",
  sup_total: "m² de terreno",
  medidas_lote: "Medidas del lote",
  cochera: "Cochera",
  ambientes_lista: "Ambientes",
  servicios: "Servicios",
  amoblado: "Amoblado",
  mascotas: "Mascotas",
  acepta_ninos: "Acepta niños",
  precio_alquiler: "Precio de alquiler",
  expensas: "Expensas",
  plazo_contrato: "Plazo del contrato",
  plazo_otro: "Cantidad de meses del contrato",
  indice_ajuste: "Índice de actualización",
  indice_otro: "Detalle del índice",
  ajuste: "Cada cuánto se actualiza",
  ajuste_otro: "Cada cuántos meses se actualiza",
  garantia: "Garantías que pide el propietario",
  garantia_detalle: "Qué pide el propietario",
  deposito: "Depósito",
  deposito_detalle: "Detalle del depósito",
  disponibilidad: "Disponibilidad",
  disponible_desde: "Fecha de disponibilidad",
  llaves: "Llaves",
  visitas: "Cómo se coordinan las visitas",
};

export const etiquetaCampo = (campo: string) => ETIQUETAS[campo] ?? campo;

const VIVIENDA = ["casa", "departamento", "monoambiente", "duplex", "quinta"];
const CON_TERRENO = ["casa", "duplex", "quinta", "galpon", "terreno"];
const EN_EDIFICIO = ["departamento", "oficina", "local_comercial"];

/** Qué campos condicionales aplican a cada tipo (ex `aplica()` de la captación). */
export function reglasPorTipo(tipo: string | null | undefined) {
  const t = tipo ?? "";
  if (t === "otro") {
    return {
      dormitorios: false,
      banios: false,
      supCubierta: false,
      terreno: false,
      cochera: false,
      cocheraCubierta: false,
      ambientes: false,
      ambientesObligatorio: false,
      comodidades: true,
      servicios: false,
      vivienda: false,
    };
  }
  const vivienda = VIVIENDA.includes(t);
  const sinConstruccion = t === "terreno";
  const esCochera = t === "estacionamiento";
  return {
    dormitorios: vivienda,
    banios: !sinConstruccion && !esCochera,
    supCubierta: !sinConstruccion,
    terreno: CON_TERRENO.includes(t),
    cochera: !sinConstruccion && !esCochera,
    cocheraCubierta: EN_EDIFICIO.includes(t),
    // Las casillas se muestran donde hay construcción; son obligatorias solo
    // en vivienda, oficina y local.
    ambientes: !sinConstruccion && !esCochera,
    ambientesObligatorio: vivienda || t === "oficina" || t === "local_comercial",
    comodidades: !sinConstruccion && !esCochera,
    servicios: !esCochera,
    vivienda,
  };
}

export const esAlquiler = (operacion: string | null | undefined) =>
  operacion === "alquiler" || operacion === "ambos";

const vacio = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");
const listaVacia = (v: string[] | null | undefined) => !v || v.length === 0;

export function faltantes(p: ValoresCompletitud): string[] {
  const r = reglasPorTipo(p.tipo);
  const out: string[] = [];
  const pedir = (campo: string, falta: boolean) => {
    if (falta) out.push(campo);
  };

  pedir("direccion", vacio(p.direccion));
  pedir("ciudad", vacio(p.ciudad));
  pedir("zona", vacio(p.zona));

  pedir("dormitorios", r.dormitorios && vacio(p.dormitorios));
  pedir("banios", r.banios && vacio(p.banios));
  pedir("sup_cubierta", r.supCubierta && vacio(p.sup_cubierta));
  pedir("sup_total", r.terreno && vacio(p.sup_total));
  pedir("medidas_lote", r.terreno && vacio(p.medidas_lote));
  pedir("cochera", r.cochera && vacio(p.cochera));
  pedir("ambientes_lista", r.ambientesObligatorio && listaVacia(p.ambientes_lista));
  pedir("servicios", r.servicios && listaVacia(p.servicios));
  if (r.vivienda) {
    pedir("amoblado", vacio(p.amoblado));
    pedir("mascotas", vacio(p.mascotas));
    pedir("acepta_ninos", vacio(p.acepta_ninos));
  }

  if (esAlquiler(p.operacion)) {
    pedir("precio_alquiler", p.operacion === "ambos" && vacio(p.precio_alquiler));
    pedir("expensas", vacio(p.expensas));
    pedir("plazo_contrato", vacio(p.plazo_contrato));
    pedir("plazo_otro", p.plazo_contrato === "otro" && vacio(p.plazo_otro));
    pedir("indice_ajuste", vacio(p.indice_ajuste));
    pedir("indice_otro", p.indice_ajuste === "otro" && vacio(p.indice_otro));
    pedir("ajuste", vacio(p.ajuste));
    pedir("ajuste_otro", p.ajuste === "otro" && vacio(p.ajuste_otro));
    pedir("garantia", vacio(p.garantia));
    pedir("garantia_detalle", p.garantia === "especial" && vacio(p.garantia_detalle));
    pedir("deposito", vacio(p.deposito));
    pedir(
      "deposito_detalle",
      (p.deposito === "dolares" || p.deposito === "otro") && vacio(p.deposito_detalle)
    );
  }

  pedir("disponibilidad", vacio(p.disponibilidad));
  pedir(
    "disponible_desde",
    (p.disponibilidad === "mostrar_desde" || p.disponibilidad === "se_desocupa") &&
      vacio(p.disponible_desde)
  );
  pedir("llaves", vacio(p.llaves));
  pedir("visitas", vacio(p.visitas));
  return out;
}

/**
 * Qué faltantes impiden guardar (misma regla que la API):
 * - Borrador: nada.
 * - Alta publicada, o salir de borrador: todos.
 * - Publicada que sigue publicada: solo los nuevos (lo que ya faltaba no frena).
 */
export function faltantesQueBloquean(
  antes: { estado: string; faltantes: string[] } | null,
  despues: { estado: string; faltantes: string[] }
): string[] {
  if (despues.estado === "borrador") return [];
  if (!antes || antes.estado === "borrador") return despues.faltantes;
  return despues.faltantes.filter((f) => !antes.faltantes.includes(f));
}
