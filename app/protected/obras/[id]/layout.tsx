import { OBRAS_FAKE } from "@/lib/fake-data";
import { ObraHeader } from "@/components/obra-header";

export default async function ObraLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const obra = OBRAS_FAKE.find((o) => o.id === id);
  const nombreObra = obra?.nombre ?? "Obra";

  return (
    <div className="flex flex-col h-screen">
      <ObraHeader obraId={id} obraNombre={nombreObra} />
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
