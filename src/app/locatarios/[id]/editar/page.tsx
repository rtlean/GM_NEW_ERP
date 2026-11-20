import { notFound, redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";

// A edição também acontece no painel da tela de Locatários.
export default async function EditarLocatarioPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("locatarios");
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();
  redirect(`/locatarios?id=${numero}&editar=1`);
}
