// ─── Obras ───────────────────────────────────────────────────────────────────

export type EstadoObra = "En planificación" | "En ejecución" | "Archivada";

export interface Obra {
  id: string;
  nombre: string;
  cliente: string;
  direccion: string;
  estado: EstadoObra;
  fechaInicio: string;
  fechaFinPrevista: string;
}

export const OBRAS_FAKE: Obra[] = [
  {
    id: "1",
    nombre: "Edificio Cervantes",
    cliente: "Inmobiliaria Sur S.A.",
    direccion: "C/ Cervantes 14, Sevilla",
    estado: "En ejecución",
    fechaInicio: "01/02/2025",
    fechaFinPrevista: "30/11/2025",
  },
  {
    id: "2",
    nombre: "Reforma Integral C/ Mayor",
    cliente: "Carlos Ruiz Pérez",
    direccion: "C/ Mayor 7, 3ºB, Madrid",
    estado: "En planificación",
    fechaInicio: "01/06/2025",
    fechaFinPrevista: "15/12/2025",
  },
  {
    id: "3",
    nombre: "Vivienda Unifamiliar Los Pinos",
    cliente: "Ana García Martínez",
    direccion: "Urb. Los Pinos, Parcela 12, Málaga",
    estado: "Archivada",
    fechaInicio: "15/03/2024",
    fechaFinPrevista: "30/09/2024",
  },
];

// ─── M02 Medición ─────────────────────────────────────────────────────────────

export type EtiquetaPartida =
  | "mano de obra"
  | "material"
  | "maquinaria"
  | "subcontrata"
  | "pendiente de precio"
  | "adjudicada";

export interface Partida {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  medicion: number;
  pvpUnitario: number;
  pvpTotal: number;
  costeEstimadoUnitario: number;
  costeEstimadoTotal: number;
  costeObjetivoUnitario: number;
  margenEstimado: number;
  etiquetas: EtiquetaPartida[];
  uoId: string | null;
  capituloId: string;
}

export interface Capitulo {
  id: string;
  codigo: string;
  nombre: string;
  partidas: Partida[];
}

export interface UnidadObra {
  id: string;
  codigo: string;
  nombre: string;
  partidaIds: string[];
}

export type EstadoOC = "Pendiente de firma" | "Aprobada" | "Rechazada";
export type SolicitanteOC = "Cliente" | "Dirección Facultativa" | "Jefe de obra";

export interface OrdenCambio {
  id: string;
  numero: number;
  fecha: string;
  descripcion: string;
  solicitante: SolicitanteOC;
  impactoCoste: number;
  impactoPlazo: number;
  estado: EstadoOC;
}

export const CAPITULOS_FAKE: Capitulo[] = [
  {
    id: "cap-01",
    codigo: "01",
    nombre: "Demoliciones y gestión de residuos",
    partidas: [
      {
        id: "p-0101",
        codigo: "01.01",
        descripcion: "Demolición de tabiques interiores de ladrillo",
        unidad: "m²",
        medicion: 85,
        pvpUnitario: 12.5,
        pvpTotal: 1062.5,
        costeEstimadoUnitario: 8.0,
        costeEstimadoTotal: 680.0,
        costeObjetivoUnitario: 7.5,
        margenEstimado: 382.5,
        etiquetas: ["mano de obra", "subcontrata"],
        uoId: "uo-01",
        capituloId: "cap-01",
      },
      {
        id: "p-0102",
        codigo: "01.02",
        descripcion: "Gestión y transporte de residuos de obra (RCDs)",
        unidad: "m³",
        medicion: 12,
        pvpUnitario: 45.0,
        pvpTotal: 540.0,
        costeEstimadoUnitario: 35.0,
        costeEstimadoTotal: 420.0,
        costeObjetivoUnitario: 30.0,
        margenEstimado: 120.0,
        etiquetas: ["subcontrata"],
        uoId: "uo-01",
        capituloId: "cap-01",
      },
    ],
  },
  {
    id: "cap-02",
    codigo: "02",
    nombre: "Estructura",
    partidas: [
      {
        id: "p-0201",
        codigo: "02.01",
        descripcion: "Hormigón armado HA-25/B/20/IIa en forjado",
        unidad: "m³",
        medicion: 34.5,
        pvpUnitario: 285.0,
        pvpTotal: 9832.5,
        costeEstimadoUnitario: 210.0,
        costeEstimadoTotal: 7245.0,
        costeObjetivoUnitario: 200.0,
        margenEstimado: 2587.5,
        etiquetas: ["material", "mano de obra"],
        uoId: "uo-02",
        capituloId: "cap-02",
      },
      {
        id: "p-0202",
        codigo: "02.02",
        descripcion: "Acero corrugado B500S en estructura",
        unidad: "kg",
        medicion: 2850,
        pvpUnitario: 1.85,
        pvpTotal: 5272.5,
        costeEstimadoUnitario: 1.45,
        costeEstimadoTotal: 4132.5,
        costeObjetivoUnitario: 1.4,
        margenEstimado: 1140.0,
        etiquetas: ["material"],
        uoId: "uo-02",
        capituloId: "cap-02",
      },
      {
        id: "p-0203",
        codigo: "02.03",
        descripcion: "Encofrado metálico para forjado",
        unidad: "m²",
        medicion: 125,
        pvpUnitario: 18.5,
        pvpTotal: 2312.5,
        costeEstimadoUnitario: 13.0,
        costeEstimadoTotal: 1625.0,
        costeObjetivoUnitario: 12.5,
        margenEstimado: 687.5,
        etiquetas: ["maquinaria", "mano de obra"],
        uoId: "uo-02",
        capituloId: "cap-02",
      },
    ],
  },
  {
    id: "cap-03",
    codigo: "03",
    nombre: "Cerramientos y fachada",
    partidas: [
      {
        id: "p-0301",
        codigo: "03.01",
        descripcion: "Fábrica de ladrillo cara vista 24×11,5×5 cm",
        unidad: "m²",
        medicion: 180,
        pvpUnitario: 85.0,
        pvpTotal: 15300.0,
        costeEstimadoUnitario: 62.0,
        costeEstimadoTotal: 11160.0,
        costeObjetivoUnitario: 60.0,
        margenEstimado: 4140.0,
        etiquetas: ["material", "mano de obra"],
        uoId: "uo-03",
        capituloId: "cap-03",
      },
      {
        id: "p-0302",
        codigo: "03.02",
        descripcion: "Aislamiento térmico exterior en fachada (SATE)",
        unidad: "m²",
        medicion: 180,
        pvpUnitario: 32.0,
        pvpTotal: 5760.0,
        costeEstimadoUnitario: 24.0,
        costeEstimadoTotal: 4320.0,
        costeObjetivoUnitario: 22.0,
        margenEstimado: 1440.0,
        etiquetas: ["material", "subcontrata"],
        uoId: "uo-03",
        capituloId: "cap-03",
      },
    ],
  },
  {
    id: "cap-04",
    codigo: "04",
    nombre: "Acabados interiores",
    partidas: [
      {
        id: "p-0401",
        codigo: "04.01",
        descripcion: "Alicatado cerámico en baños y cocina",
        unidad: "m²",
        medicion: 95,
        pvpUnitario: 55.0,
        pvpTotal: 5225.0,
        costeEstimadoUnitario: 40.0,
        costeEstimadoTotal: 3800.0,
        costeObjetivoUnitario: 38.0,
        margenEstimado: 1425.0,
        etiquetas: ["material", "mano de obra"],
        uoId: "uo-04",
        capituloId: "cap-04",
      },
      {
        id: "p-0402",
        codigo: "04.02",
        descripcion: "Pavimento porcelánico 60×60 cm en zonas comunes",
        unidad: "m²",
        medicion: 210,
        pvpUnitario: 48.0,
        pvpTotal: 10080.0,
        costeEstimadoUnitario: 35.0,
        costeEstimadoTotal: 7350.0,
        costeObjetivoUnitario: 33.0,
        margenEstimado: 2730.0,
        etiquetas: ["material", "adjudicada"],
        uoId: "uo-04",
        capituloId: "cap-04",
      },
      {
        id: "p-0403",
        codigo: "04.03",
        descripcion: "Pintura plástica interior — acabado liso",
        unidad: "m²",
        medicion: 420,
        pvpUnitario: 8.5,
        pvpTotal: 3570.0,
        costeEstimadoUnitario: 0,
        costeEstimadoTotal: 0,
        costeObjetivoUnitario: 0,
        margenEstimado: 0,
        etiquetas: ["mano de obra", "pendiente de precio"],
        uoId: "uo-04",
        capituloId: "cap-04",
      },
    ],
  },
];

export const UOS_FAKE: UnidadObra[] = [
  {
    id: "uo-01",
    codigo: "UO-01",
    nombre: "Demolición y limpieza",
    partidaIds: ["p-0101", "p-0102"],
  },
  {
    id: "uo-02",
    codigo: "UO-02",
    nombre: "Estructura",
    partidaIds: ["p-0201", "p-0202", "p-0203"],
  },
  {
    id: "uo-03",
    codigo: "UO-03",
    nombre: "Cerramientos",
    partidaIds: ["p-0301", "p-0302"],
  },
  {
    id: "uo-04",
    codigo: "UO-04",
    nombre: "Acabados interiores",
    partidaIds: ["p-0401", "p-0402", "p-0403"],
  },
];

export const ORDENES_CAMBIO_FAKE: OrdenCambio[] = [
  {
    id: "oc-001",
    numero: 1,
    fecha: "15/03/2025",
    descripcion: "Ampliación superficie alicatado en planta 2ª — partida 04.01",
    solicitante: "Cliente",
    impactoCoste: 2100,
    impactoPlazo: 3,
    estado: "Aprobada",
  },
  {
    id: "oc-002",
    numero: 2,
    fecha: "28/03/2025",
    descripcion: "Cambio de pavimento a modelo Gres Porcelánico Premium",
    solicitante: "Cliente",
    impactoCoste: 4200,
    impactoPlazo: 0,
    estado: "Pendiente de firma",
  },
];
