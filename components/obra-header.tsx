"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Home,
  LayoutDashboard,
  List,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "@/components/user-profile-menu";

const MODULOS = [
  { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { slug: "medicion", label: "Medición", icon: List },
  { slug: "planificacion", label: "Planificación", icon: CalendarDays },
  { slug: "control", label: "Control", icon: CheckSquare },
  { slug: "economico", label: "Económico", icon: TrendingUp },
  { slug: "registro", label: "Registro", icon: FileText },
];

export function ObraHeader({
  obraId,
  obraNombre,
}: {
  obraId: string;
  obraNombre: string;
}) {
  const pathname = usePathname();
  const moduloActivo = MODULOS.find((m) => pathname.includes(`/${m.slug}`));

  return (
    <header className="h-[72px] shrink-0 border-b flex items-center px-5 gap-4">
      {/* Left: obra name + active module */}
      <div className="w-72 shrink-0 flex items-center gap-2 min-w-0">
        <span className="font-semibold text-sm truncate">{obraNombre}</span>
        {moduloActivo && (
          <>
            <span className="text-muted-foreground text-sm">|</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {moduloActivo.label}
            </span>
          </>
        )}
      </div>

      {/* Center: module icon nav */}
      <nav className="flex-1 flex justify-center items-center gap-0.5">
        <Link href="/protected" title="Mis obras">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-px h-5 bg-border mx-1" />
        {MODULOS.map((m) => {
          const active = pathname.includes(`/${m.slug}`);
          return (
            <Link
              key={m.slug}
              href={`/protected/obras/${obraId}/${m.slug}`}
              title={m.label}
            >
              <Button
                variant={active ? "default" : "ghost"}
                size="sm"
                className={`h-9 w-9 p-0 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <m.icon className="h-4 w-4" />
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Right: user menu */}
      <div className="w-72 flex justify-end">
        <UserProfileMenu />
      </div>
    </header>
  );
}
