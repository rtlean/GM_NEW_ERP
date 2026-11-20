import { notFound, redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";

// A edição também acontece no painel da tela de Locadores.
export default async function EditarLocadorPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("locadores");
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();
  redirect(`/locadores?id=${numero}&editar=1`);
}
