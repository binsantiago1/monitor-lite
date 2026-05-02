"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Columns3,
  Filter,
  GripVertical,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { CAPITULOS_FAKE, OBRAS_FAKE, UOS_FAKE, type UnidadObra } from "@/lib/fake-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineaMedicion {
  id: string;
  descripcion: string;
  largo: number;
  ancho: number;
  alto: number;
  uds: number;
}

interface PartState {
  id: string;
  codigo: string;
  descripcion: string;
  descripcionLarga: string;
  unidad: string;
  medicion: number;
  pvpUnitario: number;
  costeEstimadoUnitario: number;
  costeObjetivoUnitario: number;
  etiquetas: string[];
  uoId: string | null;
  lineasMedicion: LineaMedicion[];
}

interface DataSnap {
  capitulos: CapState[];
  capitulosOrder: string[];
  partidasPorCap: Record<string, string[]>;
  partidas: PartState[];
}

interface CapState {
  id: string;
  codigo: string;
  nombre: string;
}

interface Vista {
  id: string;
  nombre: string;
  tipo: "presupuesto" | "uo" | "custom";
  visible: boolean;
  editable: boolean;
  deletable: boolean;
}

type ColId = "codigo" | "ud" | "pvp" | "costePrevisto" | "costeObjetivo" | "margenPrevisto" | "etiquetas" | "uo";

// ─── Constants ────────────────────────────────────────────────────────────────

const ETIQUETAS_DEFAULT = [
  "mano de obra",
  "material",
  "maquinaria",
  "subcontrata",
  "pendiente de precio",
  "adjudicada",
];

const VISTAS_INICIAL: Vista[] = [
  { id: "presupuesto", nombre: "Presupuesto", tipo: "presupuesto", visible: true, editable: false, deletable: false },
  { id: "vista-uo", nombre: "Vista UO", tipo: "uo", visible: true, editable: true, deletable: false },
];

const COL_LABELS: Record<ColId, string> = {
  codigo: "CÓDIGO",
  ud: "UD",
  pvp: "PVP",
  costePrevisto: "COSTE PREVISTO",
  costeObjetivo: "COSTE OBJETIVO",
  margenPrevisto: "MARGEN PREVISTO",
  etiquetas: "ETIQUETAS",
  uo: "UO",
};

const COL_IDS: ColId[] = ["codigo", "ud", "pvp", "costePrevisto", "costeObjetivo", "margenPrevisto", "etiquetas", "uo"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}
function fmtNum(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}
function pvpImporte(p: PartState) { return p.medicion * p.pvpUnitario; }
function costeImporte(p: PartState) { return p.medicion * p.costeEstimadoUnitario; }
function costeObjImporte(p: PartState) { return p.medicion * p.costeObjetivoUnitario; }
function margenPrevisto(p: PartState) { return pvpImporte(p) - costeImporte(p); }

const TH = "px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap";
const THR = "px-2 py-1.5 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap";
const THRC = "px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap";
const TD = "px-2 py-1.5 text-sm whitespace-nowrap";
const TDR = "px-2 py-1.5 text-sm text-center whitespace-nowrap tabular-nums";

// ─── Inline editable components ───────────────────────────────────────────────

function EditNum({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState("");

  if (editing) {
    return (
      <input
        type="number"
        step="any"
        className="w-full text-center bg-transparent border-b border-primary/60 outline-none text-sm tabular-nums"
        value={temp}
        autoFocus
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => {
          const n = parseFloat(temp.replace(",", "."));
          if (!isNaN(n) && n >= 0) onChange(n);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <span
      className="cursor-text rounded px-0.5 hover:bg-muted/50 tabular-nums"
      onClick={(e) => { e.stopPropagation(); setEditing(true); setTemp(String(value)); }}
    >
      {value !== 0 ? fmtNum(value) : <span className="text-muted-foreground">0</span>}
    </span>
  );
}

function EditText({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState("");

  if (editing) {
    return (
      <input
        className={`bg-transparent border-b border-blue-400 outline-none text-sm w-full min-w-[120px] ${className ?? ""}`}
        value={temp}
        autoFocus
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => { if (temp.trim()) onChange(temp.trim()); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <span
      className={`cursor-text rounded px-0.5 hover:bg-muted/50 ${className ?? ""}`}
      onClick={(e) => { e.stopPropagation(); setEditing(true); setTemp(value); }}
    >
      {value}
    </span>
  );
}

// ─── EtiquetasCell ────────────────────────────────────────────────────────────

function EtiquetasCell({
  etiquetas,
  allEtiquetas,
  onAdd,
  onRemove,
}: {
  etiquetas: string[];
  allEtiquetas: string[];
  onAdd: (e: string) => void;
  onRemove: (e: string) => void;
}) {
  const disponibles = allEtiquetas.filter((e) => !etiquetas.includes(e));
  return (
    <div className="flex flex-wrap items-center gap-1">
      {etiquetas.map((e) => (
        <span
          key={e}
          className="group/b flex items-center gap-0.5 text-xs bg-secondary text-secondary-foreground rounded px-1.5 py-0.5"
        >
          {e}
          <button
            className="opacity-0 group-hover/b:opacity-100 leading-none"
            onClick={(ev) => { ev.stopPropagation(); onRemove(e); }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {disponibles.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-5 w-5 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {disponibles.map((e) => (
              <DropdownMenuItem key={e} onClick={() => onAdd(e)}>{e}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ─── Partida modal (editable) ─────────────────────────────────────────────────

function PartidaModal({
  partida,
  allEtiquetas,
  onSave,
  onClose,
}: {
  partida: PartState | null;
  allEtiquetas: string[];
  onSave: (p: PartState) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<PartState | null>(null);

  useEffect(() => {
    setLocal(partida ? { ...partida, lineasMedicion: [...(partida.lineasMedicion ?? [])] } : null);
  }, [partida]);

  if (!partida || !local) return null;

  const pvpImp = local.medicion * local.pvpUnitario;
  const costeImp = local.medicion * local.costeEstimadoUnitario;
  const margen = pvpImp - costeImp;

  function set<K extends keyof PartState>(key: K, val: PartState[K]) {
    setLocal((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  function addLinea() {
    setLocal((prev) =>
      prev
        ? { ...prev, lineasMedicion: [...prev.lineasMedicion, { id: `lm-${Date.now()}`, descripcion: "", largo: 0, ancho: 0, alto: 0, uds: 1 }] }
        : prev
    );
  }

  function updateLinea(i: number, field: keyof LineaMedicion, val: string | number) {
    setLocal((prev) => {
      if (!prev) return prev;
      const lines = [...prev.lineasMedicion];
      lines[i] = { ...lines[i], [field]: val };
      return { ...prev, lineasMedicion: lines };
    });
  }

  function removeLinea(i: number) {
    setLocal((prev) =>
      prev ? { ...prev, lineasMedicion: prev.lineasMedicion.filter((_, idx) => idx !== i) } : prev
    );
  }

  const inp = "w-full border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={!!partida} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Detalle de partida</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Descripción */}
          <div>
            <label className="text-xs text-muted-foreground">Descripción</label>
            <textarea
              className={`${inp} mt-1 resize-none`}
              rows={2}
              value={local.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Código</label>
              <input className={`${inp} mt-1`} value={local.codigo} onChange={(e) => set("codigo", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Unidad (UD)</label>
              <input className={`${inp} mt-1`} value={local.unidad} onChange={(e) => set("unidad", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cantidad</label>
              <input
                type="number"
                step="any"
                className={`${inp} mt-1`}
                value={local.medicion}
                onChange={(e) => set("medicion", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* PVP */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PVP</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Precio unitario</label>
                <input
                  type="number"
                  step="0.01"
                  className={`${inp} mt-1`}
                  value={local.pvpUnitario}
                  onChange={(e) => set("pvpUnitario", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Importe (calculado)</label>
                <p className="mt-1 px-2 py-1.5 text-sm bg-muted/50 rounded tabular-nums">{fmt(pvpImp)}</p>
              </div>
            </div>
          </div>

          {/* Coste previsto */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coste previsto</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Precio unitario</label>
                <input
                  type="number"
                  step="0.01"
                  className={`${inp} mt-1`}
                  value={local.costeEstimadoUnitario}
                  onChange={(e) => set("costeEstimadoUnitario", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Importe (calculado)</label>
                <p className="mt-1 px-2 py-1.5 text-sm bg-muted/50 rounded tabular-nums">{fmt(costeImp)}</p>
              </div>
            </div>
          </div>

          {/* Coste objetivo */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coste objetivo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Precio unitario</label>
                <input
                  type="number"
                  step="0.01"
                  className={`${inp} mt-1`}
                  value={local.costeObjetivoUnitario}
                  onChange={(e) => set("costeObjetivoUnitario", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Importe (calculado)</label>
                <p className="mt-1 px-2 py-1.5 text-sm bg-muted/50 rounded tabular-nums">
                  {fmt(local.medicion * local.costeObjetivoUnitario)}
                </p>
              </div>
            </div>
          </div>

          {/* Margen */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium">Margen previsto</span>
            <span className="text-sm font-semibold tabular-nums">{fmt(margen)}</span>
          </div>

          {/* Etiquetas */}
          <div>
            <label className="text-xs text-muted-foreground">Etiquetas</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {local.etiquetas.map((e) => (
                <span key={e} className="group/b flex items-center gap-0.5 text-xs bg-secondary text-secondary-foreground rounded px-2 py-0.5">
                  {e}
                  <button className="opacity-0 group-hover/b:opacity-100" onClick={() => set("etiquetas", local.etiquetas.filter((x) => x !== e))}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {allEtiquetas.filter((e) => !local.etiquetas.includes(e)).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs text-muted-foreground border border-dashed rounded px-2 py-0.5 hover:text-foreground hover:border-foreground">
                      + etiqueta
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {allEtiquetas
                      .filter((e) => !local.etiquetas.includes(e))
                      .map((e) => (
                        <DropdownMenuItem key={e} onClick={() => set("etiquetas", [...local.etiquetas, e])}>
                          {e}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Líneas de medición */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Líneas de medición</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  {["Descripción", "Largo", "Ancho", "Alto", "Uds."].map((h) => (
                    <th key={h} className={`py-1 px-1 text-left font-medium text-muted-foreground ${h !== "Descripción" ? "text-right w-16" : ""}`}>
                      {h}
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {local.lineasMedicion.map((linea, i) => (
                  <tr key={linea.id} className="border-b">
                    <td className="py-1 px-1">
                      <input
                        className="w-full bg-transparent border-b border-transparent focus:border-foreground outline-none"
                        value={linea.descripcion}
                        onChange={(e) => updateLinea(i, "descripcion", e.target.value)}
                        placeholder="Descripción..."
                      />
                    </td>
                    {(["largo", "ancho", "alto", "uds"] as const).map((f) => (
                      <td key={f} className="py-1 px-1 text-right">
                        <input
                          type="number"
                          step="any"
                          className="w-14 bg-transparent border-b border-transparent focus:border-foreground outline-none text-right tabular-nums"
                          value={linea[f]}
                          onChange={(e) => updateLinea(i, f, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                    <td className="py-1 pl-1">
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => removeLinea(i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={addLinea}
            >
              <Plus className="h-3 w-3" /> Agregar línea
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => { onSave(local); onClose(); }}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sortable partida row ─────────────────────────────────────────────────────

function SortableRow({
  p,
  colV,
  allEtiquetas,
  modoSel,
  seleccionada,
  onToggleSel,
  onVerDetalle,
  onSeleccionar,
  onUpdate,
  onEliminar,
  onAddEtiqueta,
  onRemoveEtiqueta,
  canDelete = true,
  uos,
}: {
  p: PartState;
  colV: Record<ColId, boolean>;
  allEtiquetas: string[];
  modoSel: boolean;
  seleccionada: boolean;
  onToggleSel: () => void;
  onVerDetalle: () => void;
  onSeleccionar: () => void;
  onUpdate: (field: keyof PartState, val: unknown) => void;
  onEliminar: () => void;
  onAddEtiqueta: (e: string) => void;
  onRemoveEtiqueta: (e: string) => void;
  canDelete?: boolean;
  uos: UnidadObra[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
    data: { type: "partida" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  const uoCodigo = uos.find((u) => u.id === p.uoId)?.codigo ?? "—";
  const pImporte = pvpImporte(p);
  const cImporte = costeImporte(p);
  const cObjImporte = costeObjImporte(p);
  const mPrevisto = margenPrevisto(p);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b ${seleccionada ? "bg-blue-50/40" : isDragging ? "bg-muted/50" : "hover:bg-muted/20"}`}
    >
      {/* Drag handle */}
      <td className="w-7 px-1">
        <button
          className="cursor-grab active:cursor-grabbing flex items-center justify-center w-full py-0.5 text-muted-foreground/50 hover:text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {modoSel && (
        <td className="w-8 px-2">
          <Checkbox checked={seleccionada} onCheckedChange={onToggleSel} />
        </td>
      )}

      {colV.codigo && (
        <td className={TD}>
          <EditText value={p.codigo} onChange={(v) => onUpdate("codigo", v)} className="text-muted-foreground text-xs" />
        </td>
      )}

      {/* Descripción — always visible, double-click = modal */}
      <td className={TD} onDoubleClick={onVerDetalle} title="Doble clic: ver detalle">
        <EditText value={p.descripcion} onChange={(v) => onUpdate("descripcion", v)} />
      </td>

      {colV.ud && (
        <td className={`${TDR}`}>
          <EditText value={p.unidad} onChange={(v) => onUpdate("unidad", v)} />
        </td>
      )}

      {/* CANTIDAD — always visible */}
      <td className={TDR}>
        <EditNum value={p.medicion} onChange={(v) => onUpdate("medicion", v)} />
      </td>

      {/* PVP: precio + importe */}
      {colV.pvp && (
        <>
          <td className={`${TDR} border-l border-border text-muted-foreground`}>
            <EditNum value={p.pvpUnitario} onChange={(v) => onUpdate("pvpUnitario", v)} />
          </td>
          <td className={`${TDR} font-semibold`}>{fmt(pImporte)}</td>
        </>
      )}

      {/* COSTE PREVISTO: precio + importe */}
      {colV.costePrevisto && (
        <>
          <td className={`${TDR} border-l border-border text-muted-foreground`}>
            <EditNum value={p.costeEstimadoUnitario} onChange={(v) => onUpdate("costeEstimadoUnitario", v)} />
          </td>
          <td className={`${TDR} font-semibold`}>{cImporte > 0 ? fmt(cImporte) : "—"}</td>
        </>
      )}

      {/* COSTE OBJETIVO: precio + importe */}
      {colV.costeObjetivo && (
        <>
          <td className={`${TDR} border-l border-border text-muted-foreground`}>
            <EditNum value={p.costeObjetivoUnitario} onChange={(v) => onUpdate("costeObjetivoUnitario", v)} />
          </td>
          <td className={`${TDR} font-semibold`}>{cObjImporte > 0 ? fmt(cObjImporte) : "—"}</td>
        </>
      )}

      {colV.margenPrevisto && (
        <td className={`${TDR} border-l border-border ${mPrevisto < 0 ? "text-destructive" : ""}`}>
          {pImporte > 0 ? (
            <div className="flex flex-col items-end leading-tight">
              <span>{fmt(mPrevisto)}</span>
              <span className="text-[11px] text-muted-foreground">{((mPrevisto / pImporte) * 100).toFixed(1)}%</span>
            </div>
          ) : "—"}
        </td>
      )}

      {colV.etiquetas && (
        <td className={`${TD} border-l border-border`}>
          <EtiquetasCell
            etiquetas={p.etiquetas}
            allEtiquetas={allEtiquetas}
            onAdd={onAddEtiqueta}
            onRemove={onRemoveEtiqueta}
          />
        </td>
      )}

      {colV.uo && (
        <td className={`${TDR} border-l border-border`}>
          <Badge variant="outline" className="text-xs">{uoCodigo}</Badge>
        </td>
      )}

      {/* Options */}
      <td className="w-8 px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onVerDetalle}>Ver detalle</DropdownMenuItem>
            <DropdownMenuItem>Asignar UO</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem onClick={onSeleccionar}>Seleccionar</DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onEliminar}>Eliminar</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MedicionPage() {
  const params = useParams();
  const obraId = (params?.id as string) ?? "1";
  const obra = OBRAS_FAKE.find((o) => o.id === obraId) ?? OBRAS_FAKE[0];
  const enEjecucion = obra.estado === "En ejecución";

  // ── Data state ────────────────────────────────────────────────────────────

  const [capitulosOrder, setCapitulosOrder] = useState<string[]>(() =>
    CAPITULOS_FAKE.map((c) => c.id)
  );
  const [capitulos, setCapitulos] = useState<CapState[]>(() =>
    CAPITULOS_FAKE.map((c) => ({ id: c.id, codigo: c.codigo, nombre: c.nombre }))
  );
  const [partidasPorCap, setPartidasPorCap] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(CAPITULOS_FAKE.map((c) => [c.id, c.partidas.map((p) => p.id)]))
  );
  const [partidas, setPartidas] = useState<PartState[]>(() =>
    CAPITULOS_FAKE.flatMap((c) =>
      c.partidas.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        descripcion: p.descripcion,
        descripcionLarga: "",
        unidad: p.unidad,
        medicion: p.medicion,
        pvpUnitario: p.pvpUnitario,
        costeEstimadoUnitario: p.costeEstimadoUnitario,
        costeObjetivoUnitario: p.costeObjetivoUnitario,
        etiquetas: [...p.etiquetas],
        uoId: p.uoId,
        lineasMedicion: [],
      }))
    )
  );
  const [uos, setUos] = useState<UnidadObra[]>(() => [...UOS_FAKE]);
  const [etiquetasDisp, setEtiquetasDisp] = useState<string[]>([...ETIQUETAS_DEFAULT]);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [histLen, setHistLen] = useState(0);
  const [futureLen, setFutureLen] = useState(0);
  const historyRef = useRef<DataSnap[]>([]);
  const futureRef = useRef<DataSnap[]>([]);

  // ── Vistas (tabs) ─────────────────────────────────────────────────────────

  const [vistas, setVistas] = useState<Vista[]>(VISTAS_INICIAL);
  const [vistaActiva, setVistaActiva] = useState("presupuesto");
  const [editandoTab, setEditandoTab] = useState<string | null>(null);
  const [tempNombreTab, setTempNombreTab] = useState("");

  // ── Columns ───────────────────────────────────────────────────────────────

  const [colV, setColV] = useState<Record<ColId, boolean>>({
    codigo: true, ud: true, pvp: true, costePrevisto: true,
    costeObjetivo: true, margenPrevisto: true, etiquetas: true, uo: true,
  });

  // ── Filter ────────────────────────────────────────────────────────────────

  const [filtroEtiq, setFiltroEtiq] = useState<string[]>([]);

  // ── Expand/collapse ───────────────────────────────────────────────────────

  const [abiertos, setAbiertos] = useState<Set<string>>(
    () => new Set([...CAPITULOS_FAKE.map((c) => c.id), ...UOS_FAKE.map((u) => u.id)])
  );

  // ── Selection ─────────────────────────────────────────────────────────────

  const [modoSel, setModoSel] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  // ── Modal ─────────────────────────────────────────────────────────────────

  const [modalPartida, setModalPartida] = useState<PartState | null>(null);

  // ── Chapter rename ────────────────────────────────────────────────────────

  const [renamingCapId, setRenamingCapId] = useState<string | null>(null);
  const [renamingNombre, setRenamingNombre] = useState("");
  const [renamingCodigo, setRenamingCodigo] = useState("");
  const [renamingUoId, setRenamingUoId] = useState<string | null>(null);
  const [renamingUoNombre, setRenamingUoNombre] = useState("");
  const [renamingUoCodigo, setRenamingUoCodigo] = useState("");

  // ── DnD ──────────────────────────────────────────────────────────────────

  const [dndActiveId, setDndActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── History (undo/redo) ───────────────────────────────────────────────────

  function captureSnap(): DataSnap {
    return {
      capitulos: capitulos.map((c) => ({ ...c })),
      capitulosOrder: [...capitulosOrder],
      partidasPorCap: Object.fromEntries(
        Object.entries(partidasPorCap).map(([k, v]) => [k, [...v]])
      ),
      partidas: partidas.map((p) => ({ ...p, etiquetas: [...p.etiquetas], lineasMedicion: [...p.lineasMedicion] })),
    };
  }

  function pushHistory() {
    historyRef.current = [...historyRef.current, captureSnap()];
    futureRef.current = [];
    setHistLen(historyRef.current.length);
    setFutureLen(0);
    setHasChanges(true);
  }

  function undo() {
    if (!historyRef.current.length) return;
    const snap = historyRef.current[historyRef.current.length - 1];
    futureRef.current = [captureSnap(), ...futureRef.current];
    historyRef.current = historyRef.current.slice(0, -1);
    setCapitulos(snap.capitulos);
    setCapitulosOrder(snap.capitulosOrder);
    setPartidasPorCap(snap.partidasPorCap);
    setPartidas(snap.partidas);
    setHistLen(historyRef.current.length);
    setFutureLen(futureRef.current.length);
  }

  function redo() {
    if (!futureRef.current.length) return;
    const snap = futureRef.current[0];
    historyRef.current = [...historyRef.current, captureSnap()];
    futureRef.current = futureRef.current.slice(1);
    setCapitulos(snap.capitulos);
    setCapitulosOrder(snap.capitulosOrder);
    setPartidasPorCap(snap.partidasPorCap);
    setPartidas(snap.partidas);
    setHistLen(historyRef.current.length);
    setFutureLen(futureRef.current.length);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capitulos, capitulosOrder, partidasPorCap, partidas]);

  function findCapOf(id: string): string | null {
    return Object.entries(partidasPorCap).find(([, ids]) => ids.includes(id))?.[0] ?? null;
  }

  function handleDragStart(e: DragStartEvent) {
    setDndActiveId(e.active.id as string);
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeType = active.data.current?.type;
    if (activeType !== "partida") return;

    const activeCap = findCapOf(activeId);
    const overIsChap = capitulosOrder.includes(overId);
    const targetCap = overIsChap ? overId : findCapOf(overId);

    if (!activeCap || !targetCap || activeCap === targetCap) return;

    setPartidasPorCap((prev) => {
      const src = prev[activeCap].filter((id) => id !== activeId);
      const dst = [...prev[targetCap]];
      if (!overIsChap) {
        const idx = dst.indexOf(overId);
        dst.splice(idx >= 0 ? idx : dst.length, 0, activeId);
      } else {
        dst.push(activeId);
      }
      return { ...prev, [activeCap]: src, [targetCap]: dst };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setDndActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;

    if (activeType === "chapter") {
      const oldIdx = capitulosOrder.indexOf(activeId);
      const newIdx = capitulosOrder.indexOf(overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        pushHistory();
        setCapitulosOrder((prev) => arrayMove(prev, oldIdx, newIdx));
      }
      return;
    }

    // Partida intra-chapter reorder (inter already handled in dragOver)
    const activeCap = findCapOf(activeId);
    if (!activeCap) return;
    const ids = partidasPorCap[activeCap];
    const oldIdx = ids.indexOf(activeId);
    const newIdx = ids.indexOf(overId);
    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      pushHistory();
      setPartidasPorCap((prev) => ({
        ...prev,
        [activeCap]: arrayMove(prev[activeCap], oldIdx, newIdx),
      }));
    }
  }

  // ── Partida mutations ─────────────────────────────────────────────────────

  function updatePartida(id: string, field: keyof PartState, val: unknown) {
    pushHistory();
    setPartidas((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
    if (modalPartida?.id === id) {
      setModalPartida((prev) => (prev ? { ...prev, [field]: val } : prev));
    }
  }

  function eliminarPartida(id: string) {
    pushHistory();
    const capId = findCapOf(id);
    setPartidas((prev) => prev.filter((p) => p.id !== id));
    if (capId) setPartidasPorCap((prev) => ({ ...prev, [capId]: prev[capId].filter((x) => x !== id) }));
    setSeleccionadas((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function savePartidaFromModal(updated: PartState) {
    pushHistory();
    setPartidas((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  // ── Chapter mutations ─────────────────────────────────────────────────────

  function renombrarCapitulo(id: string, nombre: string, codigo?: string) {
    if (!nombre.trim()) return;
    pushHistory();
    setCapitulos((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, nombre: nombre.trim(), ...(codigo !== undefined ? { codigo: codigo.trim() } : {}) }
          : c
      )
    );
  }

  function eliminarCapitulo(capId: string) {
    pushHistory();
    const ids = partidasPorCap[capId] ?? [];
    setPartidas((prev) => prev.filter((p) => !ids.includes(p.id)));
    setCapitulos((prev) => prev.filter((c) => c.id !== capId));
    setCapitulosOrder((prev) => prev.filter((id) => id !== capId));
    setPartidasPorCap((prev) => { const next = { ...prev }; delete next[capId]; return next; });
  }

  // ── UO mutations ──────────────────────────────────────────────────────────

  function renombrarUo(id: string, nombre: string, codigo?: string) {
    if (!nombre.trim()) return;
    setUos((prev) => prev.map((u) =>
      u.id === id ? { ...u, nombre: nombre.trim(), ...(codigo !== undefined ? { codigo: codigo.trim() } : {}) } : u
    ));
  }

  function eliminarUo(id: string) {
    pushHistory();
    setPartidas((prev) => prev.map((p) => p.uoId === id ? { ...p, uoId: null } : p));
    setUos((prev) => prev.filter((u) => u.id !== id));
  }

  // ── Vista tab actions ─────────────────────────────────────────────────────

  function cerrarVista(id: string) {
    const visibles = vistas.filter((v) => v.visible);
    if (visibles.length <= 1) return;
    setVistas((prev) => prev.map((v) => (v.id === id ? { ...v, visible: false } : v)));
    if (vistaActiva === id) {
      const next = visibles.find((v) => v.id !== id);
      if (next) setVistaActiva(next.id);
    }
  }

  function mostrarVista(id: string) {
    setVistas((prev) => prev.map((v) => (v.id === id ? { ...v, visible: true } : v)));
    setVistaActiva(id);
  }

  function crearNuevaVista() {
    const num = vistas.filter((v) => v.tipo === "custom").length + 1;
    const nueva: Vista = { id: `custom-${Date.now()}`, nombre: `Vista ${num}`, tipo: "custom", visible: true, editable: true, deletable: true };
    setVistas((prev) => [...prev, nueva]);
    setVistaActiva(nueva.id);
  }

  function duplicarVista(id: string) {
    const orig = vistas.find((v) => v.id === id);
    if (!orig) return;
    const num = vistas.filter((v) => v.tipo === "custom").length + 1;
    const copia: Vista = { ...orig, id: `custom-${Date.now()}`, nombre: `Copia de ${orig.nombre}`, tipo: "custom", editable: true, deletable: true };
    setVistas((prev) => [...prev, copia]);
    setVistaActiva(copia.id);
  }

  function eliminarVista(id: string) {
    cerrarVista(id);
    setVistas((prev) => prev.filter((v) => v.id !== id));
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  function toggleSel(id: string) {
    setSeleccionadas((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleSelCap(capId: string) {
    const ids = partidasPorCap[capId] ?? [];
    const allSel = ids.every((id) => seleccionadas.has(id));
    setSeleccionadas((prev) => { const s = new Set(prev); ids.forEach((id) => allSel ? s.delete(id) : s.add(id)); return s; });
  }

  function toggleSelTodo() {
    const todos = partidas.map((p) => p.id);
    const allSel = todos.every((id) => seleccionadas.has(id));
    setSeleccionadas(allSel ? new Set() : new Set(todos));
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const totalPvp = partidas.reduce((s, p) => s + pvpImporte(p), 0);
  const totalCoste = partidas.reduce((s, p) => s + costeImporte(p), 0);
  const totalCosteObj = partidas.reduce((s, p) => s + costeObjImporte(p), 0);
  const totalMargen = totalPvp - totalCoste;
  const pct = totalPvp > 0 ? ((totalMargen / totalPvp) * 100).toFixed(1) : "0";

  const vistaActivaTipo = vistas.find((v) => v.id === vistaActiva)?.tipo ?? "presupuesto";
  const vistasOcultas = vistas.filter((v) => !v.visible);

  // ── Table header (2-row) ──────────────────────────────────────────────────

  const tableHeader = (
    <>
      <tr className="border-b bg-background">
        <th className="w-7 px-1" rowSpan={2} />
        {modoSel && (
          <th className="w-8 px-2 bg-background" rowSpan={2}>
            <Checkbox
              checked={partidas.length > 0 && partidas.every((p) => seleccionadas.has(p.id))}
              onCheckedChange={toggleSelTodo}
            />
          </th>
        )}
        {colV.codigo && <th className={TH} rowSpan={2}>CÓDIGO</th>}
        <th className={TH} style={{ minWidth: 240 }} rowSpan={2}>DESCRIPCIÓN</th>
        {colV.ud && <th className={THRC} rowSpan={2}>UD</th>}
        <th className={THRC} style={{ width: 90 }} rowSpan={2}>CANTIDAD</th>
        {colV.pvp && <th className="px-2 py-1.5 text-center text-xs font-bold text-foreground whitespace-nowrap border-l border-border" colSpan={2}>PVP</th>}
        {colV.costePrevisto && <th className="px-2 py-1.5 text-center text-xs font-bold text-foreground whitespace-nowrap border-l border-border" colSpan={2}>COSTE PREVISTO</th>}
        {colV.costeObjetivo && <th className="px-2 py-1.5 text-center text-xs font-bold text-foreground whitespace-nowrap border-l border-border" colSpan={2}>COSTE OBJETIVO</th>}
        {colV.margenPrevisto && <th className="px-2 py-1.5 text-center text-xs font-bold text-foreground whitespace-nowrap border-l border-border" rowSpan={2}>MARGEN PREVISTO</th>}
        {colV.etiquetas && <th className={`${THRC} border-l border-border`} style={{ minWidth: 160 }} rowSpan={2}>ETIQUETAS</th>}
        {colV.uo && <th className={`${THRC} border-l border-border`} rowSpan={2}>UO</th>}
        <th className="w-8 px-1" rowSpan={2} />
      </tr>
      <tr className="border-b bg-background">
        {colV.pvp && (
          <>
            <th className="px-2 pb-1.5 text-center text-xs font-normal text-muted-foreground w-24 border-l border-border">precio</th>
            <th className="px-2 pb-1.5 text-center text-xs font-normal text-muted-foreground w-28">importe</th>
          </>
        )}
        {colV.costePrevisto && (
          <>
            <th className="px-2 pb-1.5 text-center text-xs font-normal text-muted-foreground w-24 border-l border-border">precio</th>
            <th className="px-2 pb-1.5 text-center text-xs font-normal text-muted-foreground w-28">importe</th>
          </>
        )}
        {colV.costeObjetivo && (
          <>
            <th className="px-2 pb-1.5 text-center text-xs font-normal text-muted-foreground w-24 border-l border-border">precio</th>
            <th className="px-2 pb-1.5 text-center text-xs font-normal text-muted-foreground w-28">importe</th>
          </>
        )}
      </tr>
    </>
  );

  // ── Render chapter row ────────────────────────────────────────────────────

  function renderCapRow(cap: CapState, cPvp: number, cCoste: number, cCosteObj: number, cMargen: number) {
    const open = abiertos.has(cap.id);
    const allSel = (partidasPorCap[cap.id] ?? []).every((id) => seleccionadas.has(id));
    const isRenaming = renamingCapId === cap.id;

    return (
      <tr className="bg-black/30 border-b border-t select-none" key={`cap-${cap.id}`}>
        {/* Chapter drag handle */}
        <ChapterDragHandle capId={cap.id} />

        {modoSel && (
          <td className="w-8 px-2">
            <Checkbox checked={allSel} onCheckedChange={() => toggleSelCap(cap.id)} />
          </td>
        )}

        {colV.codigo && (
          <td className={`${TD} text-muted-foreground text-xs`}>
            {isRenaming ? (
              <input
                className="bg-transparent border-b border-primary/60 outline-none text-xs w-16"
                value={renamingCodigo}
                onChange={(e) => setRenamingCodigo(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              cap.codigo
            )}
          </td>
        )}

        {/* Descripción: toggle expand + inline rename */}
        <td className={`${TD} font-medium`}>
          <div className="flex items-center gap-1">
            <button onClick={() => setAbiertos((prev) => { const s = new Set(prev); s.has(cap.id) ? s.delete(cap.id) : s.add(cap.id); return s; })}>
              {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
            {isRenaming ? (
              <input
                className="bg-transparent border-b border-primary/60 outline-none text-sm font-medium text-primary"
                value={renamingNombre}
                autoFocus
                onChange={(e) => setRenamingNombre(e.target.value)}
                onBlur={() => { renombrarCapitulo(cap.id, renamingNombre, renamingCodigo); setRenamingCapId(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setRenamingCapId(null); }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-primary">{cap.nombre}</span>
            )}
          </div>
        </td>

        {colV.ud && <td />}
        <td />
        {colV.pvp && <><td className="border-l border-border" /><td className={`${TDR} font-semibold`}>{fmt(cPvp)}</td></>}
        {colV.costePrevisto && <><td className="border-l border-border" /><td className={`${TDR} font-semibold`}>{fmt(cCoste)}</td></>}
        {colV.costeObjetivo && <><td className="border-l border-border" /><td className={`${TDR} font-semibold`}>{fmt(cCosteObj)}</td></>}
        {colV.margenPrevisto && (
          <td className={`${TDR} font-semibold border-l border-border`}>
            <div className="flex flex-col items-end leading-tight">
              <span>{cPvp > 0 ? fmt(cMargen) : "—"}</span>
              {cPvp > 0 && <span className="text-[11px] text-muted-foreground font-normal">{((cMargen / cPvp) * 100).toFixed(1)}%</span>}
            </div>
          </td>
        )}
        {colV.etiquetas && <td className="border-l border-border" />}
        {colV.uo && <td className="border-l border-border" />}

        {/* Chapter options */}
        <td className="w-8 px-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setRenamingCapId(cap.id); setRenamingNombre(cap.nombre); setRenamingCodigo(cap.codigo); }}>
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => eliminarCapitulo(cap.id)}>
                Eliminar capítulo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-0 border-b">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold">Medición</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary text-primary font-semibold tracking-widest uppercase">
              {enEjecucion ? "EN EJECUCIÓN" : "PRE-OBRA"}
            </span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center -mb-px">
          {vistas.filter((v) => v.visible).map((vista) => (
            <div
              key={vista.id}
              className={`group relative flex items-center gap-1 px-3 py-2 text-sm cursor-pointer select-none border-b-2 transition-colors ${
                vistaActiva === vista.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              onClick={() => setVistaActiva(vista.id)}
            >
              {editandoTab === vista.id ? (
                <input
                  className="bg-transparent outline-none text-sm w-24 border-b border-foreground"
                  value={tempNombreTab}
                  autoFocus
                  onChange={(e) => setTempNombreTab(e.target.value)}
                  onBlur={() => {
                    if (tempNombreTab.trim()) setVistas((prev) => prev.map((v) => v.id === vista.id ? { ...v, nombre: tempNombreTab.trim() } : v));
                    setEditandoTab(null);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditandoTab(null); }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span onDoubleClick={() => { if (!vista.editable) return; setEditandoTab(vista.id); setTempNombreTab(vista.nombre); }}>
                  {vista.nombre}
                </span>
              )}

              {/* Tab options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`h-4 w-4 flex items-center justify-center rounded hover:bg-muted ${vistaActiva === vista.id ? "opacity-50 hover:opacity-100" : "opacity-0 group-hover:opacity-50 hover:!opacity-100"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {vista.editable && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditandoTab(vista.id); setTempNombreTab(vista.nombre); }}>
                      Renombrar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicarVista(vista.id); }}>Duplicar</DropdownMenuItem>
                  {vista.deletable && (
                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); eliminarVista(vista.id); }}>
                      Borrar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* × close */}
              <button
                className={`h-4 w-4 flex items-center justify-center rounded hover:bg-muted ${vistaActiva === vista.id ? "opacity-50 hover:opacity-100" : "opacity-0 group-hover:opacity-50 hover:!opacity-100"}`}
                onClick={(e) => { e.stopPropagation(); cerrarVista(vista.id); }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* + */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground ml-1">
                <Plus className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {vistasOcultas.length > 0 && (
                <>
                  <DropdownMenuLabel>Vistas ocultas</DropdownMenuLabel>
                  {vistasOcultas.map((v) => (
                    <DropdownMenuItem key={v.id} onClick={() => mostrarVista(v.id)}>{v.nombre}</DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={crearNuevaVista}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva vista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="px-4 py-1.5 border-b flex items-center gap-2 bg-background">
        {/* Left: buscador + Mostrar + Filtrar */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="relative flex items-center max-w-xs w-full">
            <svg className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Buscar partida, código, descripción…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
                <Columns3 className="h-4 w-4" /> Mostrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COL_IDS.map((id) => (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={colV[id]}
                  onCheckedChange={() => setColV((prev) => ({ ...prev, [id]: !prev[id] }))}
                  onSelect={(e) => e.preventDefault()}
                >
                  {COL_LABELS[id]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs ${filtroEtiq.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                <Filter className="h-4 w-4" /> Filtrar
                {filtroEtiq.length > 0 && <Badge variant="default" className="h-4 text-xs px-1.5 py-0">{filtroEtiq.length}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Etiquetas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {etiquetasDisp.map((e) => (
                <DropdownMenuCheckboxItem
                  key={e}
                  checked={filtroEtiq.includes(e)}
                  onCheckedChange={() => setFiltroEtiq((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])}
                  onSelect={(ev) => ev.preventDefault()}
                >
                  {e}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex gap-1.5 items-center">
                <input
                  className="flex-1 min-w-0 text-xs border rounded px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Nueva etiqueta…"
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && nuevaEtiqueta.trim()) {
                      setEtiquetasDisp((prev) => [...prev, nuevaEtiqueta.trim()]);
                      setNuevaEtiqueta("");
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="shrink-0 h-6 w-6 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center text-base leading-none"
                  onClick={(e) => { e.stopPropagation(); if (nuevaEtiqueta.trim()) { setEtiquetasDisp((prev) => [...prev, nuevaEtiqueta.trim()]); setNuevaEtiqueta(""); } }}
                >
                  +
                </button>
              </div>
              {filtroEtiq.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFiltroEtiq([])}>Limpiar filtros</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: deshacer + rehacer + Agregar + Guardar + ajustes */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground"
            disabled={histLen === 0}
            onClick={undo}
            title="Deshacer (Ctrl+Z)"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </Button>
          <Button
            variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground"
            disabled={futureLen === 0}
            onClick={redo}
            title="Rehacer (Ctrl+Y)"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-primary text-primary hover:bg-primary/10 hover:text-primary">
                <Plus className="h-4 w-4" /> Agregar
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Agregar partida</DropdownMenuItem>
              <DropdownMenuItem>Agregar capítulo</DropdownMenuItem>
              <DropdownMenuItem>Agregar UO</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className={`h-8 text-xs ${hasChanges ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-primary/20 text-primary border border-primary/30"}`}
            onClick={() => setHasChanges(false)}
          >
            Guardar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Importar</DropdownMenuLabel>
              <DropdownMenuItem>.bc3</DropdownMenuItem>
              <DropdownMenuItem>.xlsx (Presto)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Exportar</DropdownMenuLabel>
              <DropdownMenuItem>PDF</DropdownMenuItem>
              <DropdownMenuItem>Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Selection bar ── */}
      {modoSel && (
        <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-3">
          <span className="text-sm font-medium">
            {seleccionadas.size} {seleccionadas.size === 1 ? "partida" : "partidas"} seleccionadas
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs">Duplicar</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs">Asignar UO</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs">Aplicar %</Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs"
              onClick={() => { seleccionadas.forEach((id) => eliminarPartida(id)); setSeleccionadas(new Set()); setModoSel(false); }}>
              Borrar
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => { setModoSel(false); setSeleccionadas(new Set()); }}>
            Cancelar
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {(vistaActivaTipo === "presupuesto" || vistaActivaTipo === "custom") && (
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>{tableHeader}</thead>
              <tbody>
                <SortableContext items={capitulosOrder} strategy={verticalListSortingStrategy}>
                  {capitulosOrder.map((capId) => {
                    const cap = capitulos.find((c) => c.id === capId);
                    if (!cap) return null;
                    const partIds = partidasPorCap[capId] ?? [];
                    const capPartidas = partIds
                      .map((id) => partidas.find((p) => p.id === id))
                      .filter(Boolean) as PartState[];
                    const filtradas = capPartidas.filter((p) => {
                      const matchEtiq = filtroEtiq.length === 0 || filtroEtiq.some((e) => p.etiquetas.includes(e));
                      const q = busqueda.toLowerCase();
                      const matchBusq = !q || p.descripcion.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || p.descripcionLarga.toLowerCase().includes(q);
                      return matchEtiq && matchBusq;
                    });
                    const open = abiertos.has(capId);
                    const cPvp = capPartidas.reduce((s, p) => s + pvpImporte(p), 0);
                    const cCoste = capPartidas.reduce((s, p) => s + costeImporte(p), 0);
                    const cCosteObj = capPartidas.reduce((s, p) => s + costeObjImporte(p), 0);
                    const cMargen = cPvp - cCoste;

                    return (
                      <Fragment key={capId}>
                        {renderCapRow(cap, cPvp, cCoste, cCosteObj, cMargen)}
                        {open && (
                          <SortableContext items={filtradas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                            {filtradas.map((p) => (
                              <SortableRow
                                key={p.id}
                                p={p}
                                colV={colV}
                                allEtiquetas={etiquetasDisp}
                                modoSel={modoSel}
                                seleccionada={seleccionadas.has(p.id)}
                                onToggleSel={() => toggleSel(p.id)}
                                onVerDetalle={() => setModalPartida(p)}
                                onSeleccionar={() => { setModoSel(true); setSeleccionadas(new Set([p.id])); }}
                                onUpdate={(f, v) => updatePartida(p.id, f, v)}
                                onEliminar={() => eliminarPartida(p.id)}
                                onAddEtiqueta={(e) => updatePartida(p.id, "etiquetas", [...p.etiquetas, e])}
                                onRemoveEtiqueta={(e) => updatePartida(p.id, "etiquetas", p.etiquetas.filter((x) => x !== e))}
                                uos={uos}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </Fragment>
                    );
                  })}
                </SortableContext>
              </tbody>
            </table>
          )}

          {vistaActivaTipo === "uo" && (
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>{tableHeader}</thead>
              <tbody>
                {uos.map((uo) => {
                  const uoPartidas = partidas.filter((p) => p.uoId === uo.id);
                  const filtradas = filtroEtiq.length === 0 ? uoPartidas : uoPartidas.filter((p) => filtroEtiq.some((e) => p.etiquetas.includes(e)));
                  if (filtradas.length === 0) return null;
                  const open = abiertos.has(uo.id);
                  const uoPvp = filtradas.reduce((s, p) => s + pvpImporte(p), 0);
                  const uoCoste = filtradas.reduce((s, p) => s + costeImporte(p), 0);
                  const uoCosteObj = filtradas.reduce((s, p) => s + costeObjImporte(p), 0);
                  const uoMargen = uoPvp - uoCoste;

                  return (
                    <Fragment key={uo.id}>
                      <tr className="bg-black/30 border-b border-t select-none">
                        <td className="w-7 px-1" />
                        {modoSel && <td className="w-8 px-2" />}
                        {colV.codigo && (
                          <td className={`${TD} text-muted-foreground text-xs`}>
                            {renamingUoId === uo.id ? (
                              <input
                                className="bg-transparent border-b border-primary/60 outline-none text-xs w-16"
                                value={renamingUoCodigo}
                                onChange={(e) => setRenamingUoCodigo(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : uo.codigo}
                          </td>
                        )}
                        <td className={`${TD} font-medium`}>
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setAbiertos((prev) => { const s = new Set(prev); s.has(uo.id) ? s.delete(uo.id) : s.add(uo.id); return s; })}>
                            {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                            {renamingUoId === uo.id ? (
                              <input
                                className="bg-transparent border-b border-primary/60 outline-none text-sm font-medium text-primary"
                                value={renamingUoNombre}
                                autoFocus
                                onChange={(e) => setRenamingUoNombre(e.target.value)}
                                onBlur={() => { renombrarUo(uo.id, renamingUoNombre, renamingUoCodigo); setRenamingUoId(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setRenamingUoId(null); }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-primary">{uo.nombre}</span>
                            )}
                          </div>
                        </td>
                        {colV.ud && <td />}
                        <td />
                        {colV.pvp && <><td className="border-l border-border" /><td className={`${TDR} font-semibold`}>{fmt(uoPvp)}</td></>}
                        {colV.costePrevisto && <><td className="border-l border-border" /><td className={`${TDR} font-semibold`}>{fmt(uoCoste)}</td></>}
                        {colV.costeObjetivo && <><td className="border-l border-border" /><td className={`${TDR} font-semibold`}>{fmt(uoCosteObj)}</td></>}
                        {colV.margenPrevisto && (
                          <td className={`${TDR} font-semibold border-l border-border`}>
                            <div className="flex flex-col items-end leading-tight">
                              <span>{uoPvp > 0 ? fmt(uoMargen) : "—"}</span>
                              {uoPvp > 0 && <span className="text-[11px] text-muted-foreground font-normal">{((uoMargen / uoPvp) * 100).toFixed(1)}%</span>}
                            </div>
                          </td>
                        )}
                        {colV.etiquetas && <td className="border-l border-border" />}
                        {colV.uo && <td className="border-l border-border" />}
                        <td className="w-8 px-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setRenamingUoId(uo.id); setRenamingUoNombre(uo.nombre); setRenamingUoCodigo(uo.codigo); }}>
                                Renombrar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => eliminarUo(uo.id)}>
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      {open && filtradas.map((p) => (
                        <SortableRow
                          key={p.id}
                          p={p}
                          colV={colV}
                          allEtiquetas={etiquetasDisp}
                          modoSel={modoSel}
                          seleccionada={seleccionadas.has(p.id)}
                          onToggleSel={() => toggleSel(p.id)}
                          onVerDetalle={() => setModalPartida(p)}
                          onSeleccionar={() => { setModoSel(true); setSeleccionadas(new Set([p.id])); }}
                          onUpdate={(f, v) => updatePartida(p.id, f, v)}
                          onEliminar={() => eliminarPartida(p.id)}
                          onAddEtiqueta={(e) => updatePartida(p.id, "etiquetas", [...p.etiquetas, e])}
                          onRemoveEtiqueta={(e) => updatePartida(p.id, "etiquetas", p.etiquetas.filter((x) => x !== e))}
                          canDelete={false}
                          uos={uos}
                        />
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </DndContext>
      </div>

      {/* ── Total bar ── */}
      <div className="shrink-0 border-t px-6 py-5 flex items-center gap-10 justify-end bg-black/30">
        <span className="text-sm font-bold tracking-widest uppercase text-primary">Total Presupuesto</span>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">PVP</span>
          <span className="text-base font-bold tabular-nums text-primary">{fmt(totalPvp)}</span>
        </div>

        <div className="w-px h-8 bg-border" />

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Coste previsto</span>
          <span className="text-base font-bold tabular-nums text-primary">{fmt(totalCoste)}</span>
        </div>

        <div className="w-px h-8 bg-border" />

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Coste objetivo</span>
          <span className="text-base font-bold tabular-nums text-primary">{fmt(totalCosteObj)}</span>
        </div>

        <div className="w-px h-8 bg-border" />

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Margen previsto</span>
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold tabular-nums ${totalMargen < 0 ? "text-destructive" : "text-primary"}`}>
              {fmt(totalMargen)}
            </span>
            <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded border ${totalMargen < 0 ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/40 bg-primary/10 text-primary"}`}>
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <PartidaModal
        partida={modalPartida}
        allEtiquetas={etiquetasDisp}
        onSave={savePartidaFromModal}
        onClose={() => setModalPartida(null)}
      />
    </div>
  );
}

// ── Chapter drag handle (needs useSortable) ──────────────────────────────────

function ChapterDragHandle({ capId }: { capId: string }) {
  const { attributes, listeners, setNodeRef } = useSortable({
    id: capId,
    data: { type: "chapter" },
  });

  return (
    <td ref={setNodeRef} className="w-7 px-1">
      <button
        className="cursor-grab active:cursor-grabbing flex items-center justify-center w-full py-0.5 text-muted-foreground/40 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </td>
  );
}
