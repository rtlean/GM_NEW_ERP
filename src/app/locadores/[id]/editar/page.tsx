import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { paraFormulario } from "@/lib/cadastro-locador";
import { buscarLocadorParaEdicao } from "@/lib/locadores-cadastro";
import { FormularioLocador } from "@/components/locadores/FormularioLocador";

export default async function EditarLocadorPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("locadores");
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const locador = await buscarLocadorParaEdicao(numero);
  if (!locador) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href={`/locadores?id=${numero}`} className="font-semibold text-navy underline">
        ← Voltar para o locador
      </Link>
      <h1 className="text-2xl font-bold text-navy">Editar locador</h1>
      <FormularioLocador inicial={paraFormulario(locador)} id={numero} />
    </main>
  );
}
