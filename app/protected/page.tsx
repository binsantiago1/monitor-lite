"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NuevaObraModal } from "@/components/nueva-obra-modal";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { OBRAS_FAKE, type EstadoObra } from "@/lib/fake-data";
import { PlusIcon, MapPinIcon, UserIcon, CalendarIcon } from "lucide-react";

function estadoBadgeVariant(
  estado: EstadoObra
): "default" | "secondary" | "outline" {
  if (estado === "En ejecución") return "default";
  if (estado === "En planificación") return "secondary";
  return "outline";
}

export default function ObrasPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      {/* Home header */}
      <header className="h-14 shrink-0 border-b flex items-center px-6 gap-6">
        <span className="font-bold text-lg tracking-tight shrink-0">
          Monitor Lite
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/protected"
            className="text-foreground font-medium transition-colors"
          >
            Mis obras
          </Link>
          <Link
            href="/protected/base-de-datos"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Base de datos
          </Link>
          <Link
            href="/protected/calendario"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Calendario general
          </Link>
        </nav>
        <div className="ml-auto">
          <UserProfileMenu />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mis obras</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {OBRAS_FAKE.length} obras registradas
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva obra
          </Button>
        </div>

        <div className="grid gap-4">
          {OBRAS_FAKE.map((obra) => (
            <Card
              key={obra.id}
              className="hover:bg-accent/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{obra.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <UserIcon className="w-3 h-3" />
                      {obra.cliente}
                    </CardDescription>
                  </div>
                  <Badge variant={estadoBadgeVariant(obra.estado)}>
                    {obra.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" />
                    {obra.direccion}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {obra.fechaInicio} — {obra.fechaFinPrevista}
                  </span>
                </div>
                <Link href={`/protected/obras/${obra.id}`}>
                  <Button variant="outline" size="sm">
                    Abrir obra
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <NuevaObraModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
