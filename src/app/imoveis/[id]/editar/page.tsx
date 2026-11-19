import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { buscarImovel } from "@/lib/imoveis-cadastro";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";
import { FormularioImovel } from "@/components/imoveis/FormularioImovel";

function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function EditarImovelPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("imoveis");
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const imovel = await buscarImovel(numero);
  if (!imovel) notFound();
  const opcoes = await listarOpcoesDeLocador();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href={`/imoveis?id=${numero}`} className="font-semibold text-navy underline">
        ← Voltar para o imóvel
      </Link>
      <h1 className="text-2xl font-bold text-navy">Editar imóvel {imovel.code}</h1>
      <FormularioImovel
        id={numero}
        opcoes={opcoes}
        inicial={{
          ownerId: imovel.owner_id ? String(imovel.owner_id) : "",
          tipo: imovel.type ?? "Outro",
          situacao: imovel.occupancy_status,
          endereco: imovel.address,
          numero: imovel.numero ?? "",
          complemento: imovel.complemento ?? "",
          bairro: imovel.bairro ?? "",
          cep: imovel.zip_code ?? "",
          cidade: imovel.city,
          uf: imovel.state,
          aluguel: centavosParaTexto(imovel.rent_cents),
          caracteristicas: imovel.caracteristicas ?? "",
        }}
      />
    </main>
  );
}
