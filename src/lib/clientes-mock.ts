import type { EstadoPropiedad, Moneda, Operacion, TipoPropiedad } from "@/lib/types";

export type ClientePropiedad = {
  id: string;
  titulo: string;
  operacion: Operacion;
  tipo: TipoPropiedad;
  estado: EstadoPropiedad;
  precio: number;
  moneda: Moneda;
  precio_alquiler: number | null;
  moneda_alquiler: Moneda | null;
  direccion: string;
  zona: string;
  rol: "vende" | "alquila";
  desde: string;
};

export type ClienteDetalle = {
  id: string;
  nombre: string;
  dni: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  ocupacion: string;
  estadoCivil: string;
  fechaNacimiento: string;
  alta: string;
  notas: string;
  propiedades: ClientePropiedad[];
};

// Datos de ejemplo (v1 visual del módulo). Cuando exista el backend, esto sale
// de `src/lib/queries.ts` para mantener la adaptación de API en un solo lugar.
export const CLIENTES_EJEMPLO: ClienteDetalle[] = [
  {
    id: "1",
    nombre: "María Fernández",
    dni: "28.451.904",
    contacto: "381 555-1042",
    email: "maria.fernandez@gmail.com",
    telefono: "381 555-1042",
    direccion: "San Martín 642",
    ciudad: "San Miguel de Tucumán",
    ocupacion: "Comerciante",
    estadoCivil: "Casada",
    fechaNacimiento: "1984-09-18",
    alta: "2026-06-12",
    notas: "Prefiere coordinar visitas por la mañana. La documentación está lista para publicar.",
    propiedades: [
      {
        id: "prop-cliente-1",
        titulo: "Departamento en Barrio Norte",
        operacion: "venta",
        tipo: "departamento",
        estado: "disponible",
        precio: 95000,
        moneda: "USD",
        precio_alquiler: null,
        moneda_alquiler: null,
        direccion: "Muñecas 870",
        zona: "Barrio Norte",
        rol: "vende",
        desde: "2026-06-12",
      },
      {
        id: "prop-cliente-2",
        titulo: "Cochera céntrica",
        operacion: "alquiler",
        tipo: "estacionamiento",
        estado: "alquilada",
        precio: 85000,
        moneda: "ARS",
        precio_alquiler: null,
        moneda_alquiler: null,
        direccion: "24 de Septiembre 510",
        zona: "Microcentro",
        rol: "alquila",
        desde: "2026-05-04",
      },
    ],
  },
  {
    id: "2",
    nombre: "Juan Pérez",
    dni: "31.908.277",
    contacto: "juan.perez@gmail.com",
    email: "juan.perez@gmail.com",
    telefono: "381 555-6721",
    direccion: "Avenida Aconquija 1840",
    ciudad: "Yerba Buena",
    ocupacion: "Ingeniero civil",
    estadoCivil: "Soltero",
    fechaNacimiento: "1990-02-03",
    alta: "2026-06-03",
    notas: "Busca contrato de alquiler de 24 meses. Pidió aviso antes de actualizar el valor publicado.",
    propiedades: [
      {
        id: "prop-cliente-3",
        titulo: "Casa en Yerba Buena",
        operacion: "alquiler",
        tipo: "casa",
        estado: "disponible",
        precio: 720000,
        moneda: "ARS",
        precio_alquiler: null,
        moneda_alquiler: null,
        direccion: "Las Rosas 220",
        zona: "Yerba Buena",
        rol: "alquila",
        desde: "2026-06-03",
      },
    ],
  },
  {
    id: "3",
    nombre: "Lucía Gómez",
    dni: "35.114.782",
    contacto: "381 555-8890",
    email: "lucia.gomez@hotmail.com",
    telefono: "381 555-8890",
    direccion: "General Paz 930",
    ciudad: "San Miguel de Tucumán",
    ocupacion: "Contadora",
    estadoCivil: "Casada",
    fechaNacimiento: "1991-12-21",
    alta: "2026-05-28",
    notas: "Tiene poder de administración de la propiedad familiar. Validar firma de ambos titulares.",
    propiedades: [
      {
        id: "prop-cliente-4",
        titulo: "Local en Microcentro",
        operacion: "venta",
        tipo: "local_comercial",
        estado: "reservado",
        precio: 130000,
        moneda: "USD",
        precio_alquiler: null,
        moneda_alquiler: null,
        direccion: "Crisóstomo Álvarez 420",
        zona: "Microcentro",
        rol: "vende",
        desde: "2026-05-28",
      },
    ],
  },
  {
    id: "4",
    nombre: "Carlos Ruiz",
    dni: "24.771.650",
    contacto: "381 555-2314",
    email: "carlos.ruiz@gmail.com",
    telefono: "381 555-2314",
    direccion: "Lavalle 1180",
    ciudad: "San Miguel de Tucumán",
    ocupacion: "Médico",
    estadoCivil: "Divorciado",
    fechaNacimiento: "1978-07-10",
    alta: "2026-05-19",
    notas: "Autoriza publicar sin cartel en fachada. Llaves disponibles en administración.",
    propiedades: [
      {
        id: "prop-cliente-5",
        titulo: "Monoambiente en Barrio Sur",
        operacion: "alquiler",
        tipo: "monoambiente",
        estado: "disponible",
        precio: 290000,
        moneda: "ARS",
        precio_alquiler: null,
        moneda_alquiler: null,
        direccion: "Bernabé Aráoz 740",
        zona: "Barrio Sur",
        rol: "alquila",
        desde: "2026-05-19",
      },
    ],
  },
  {
    id: "5",
    nombre: "Sofía Ledesma",
    dni: "33.684.029",
    contacto: "sofia.ledesma@hotmail.com",
    email: "sofia.ledesma@hotmail.com",
    telefono: "381 555-4018",
    direccion: "Ruta 9 km 1304",
    ciudad: "Las Talitas",
    ocupacion: "Arquitecta",
    estadoCivil: "Soltera",
    fechaNacimiento: "1988-04-15",
    alta: "2026-05-10",
    notas: "Quiere probar venta durante 60 días y, si no avanza, pasar a alquiler permanente.",
    propiedades: [
      {
        id: "prop-cliente-6",
        titulo: "Dúplex en Las Talitas",
        operacion: "ambos",
        tipo: "duplex",
        estado: "disponible",
        precio: 78000,
        moneda: "USD",
        precio_alquiler: 520000,
        moneda_alquiler: "ARS",
        direccion: "Los Lapachos 315",
        zona: "Las Talitas",
        rol: "vende",
        desde: "2026-05-10",
      },
    ],
  },
];

export function getClienteMock(id: string) {
  return CLIENTES_EJEMPLO.find((cliente) => cliente.id === id) ?? null;
}
