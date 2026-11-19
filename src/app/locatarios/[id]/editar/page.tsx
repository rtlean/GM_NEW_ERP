import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { formatarTelefone } from "@/lib/locadores";
import { buscarLocatario } from "@/lib/locatarios";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";
import { FormularioLocatario } from "@/components/locatarios/FormularioLocatario";

export default async function EditarLocatarioPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("locatarios");
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const locatario = await buscarLocatario(numero);
  if (!locatario) notFound();
  const opcoes = await listarOpcoesDeLocador();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href={`/locatarios?id=${numero}`} className="font-semibold text-navy underline">
        ← Voltar para o locatário
      </Link>
      <h1 className="text-2xl font-bold text-navy">Editar locatário</h1>
      <FormularioLocatario
        id={numero}
        opcoes={opcoes}
        inicial={{
          nome: locatario.full_name,
          documento: locatario.document ?? "",
          email: locatario.email ?? "",
          whatsapp: formatarTelefone(locatario.phone) === "—" ? "" : formatarTelefone(locatario.phone),
          locadores: locatario.locadores.map((o) => o.id),
        }}
      />
    </main>
  );
}
