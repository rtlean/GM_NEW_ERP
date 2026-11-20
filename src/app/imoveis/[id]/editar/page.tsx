import { notFound, redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";

// A edição também acontece no painel da tela de Imóveis.
export default async function EditarImovelPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("imoveis");
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();
  redirect(`/imoveis?id=${numero}`);
}
