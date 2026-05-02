import { redirect } from "next/navigation";

export default async function ObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/protected/obras/${id}/dashboard`);
}
