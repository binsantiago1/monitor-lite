"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NuevaObraModalProps {
  open: boolean;
  onClose: () => void;
}

export function NuevaObraModal({ open, onClose }: NuevaObraModalProps) {
  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleClose = () => {
    setNombre("");
    setCliente("");
    setDireccion("");
    setFechaInicio("");
    setFechaFin("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva obra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre de la obra</Label>
              <Input
                id="nombre"
                placeholder="Ej: Edificio Residencial Las Flores"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Nombre del cliente o empresa"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Dirección completa de la obra"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha-inicio">Fecha inicio prevista</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  required
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fecha-fin">Fecha fin prevista</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  required
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">Crear obra</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
