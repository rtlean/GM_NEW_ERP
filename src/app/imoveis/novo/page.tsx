import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";
import { FormularioImovel } from "@/components/imoveis/FormularioImovel";

export default async function NovoImovelPage() {
  await exigirAcesso("imoveis");
  const opcoes = await listarOpcoesDeLocador();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href="/imoveis" className="font-semibold text-navy underline">
        ← Voltar para imóveis
      </Link>
      <h1 className="text-2xl font-bold text-navy">Novo imóvel</h1>
      <FormularioImovel
        opcoes={opcoes}
        inicial={{ ownerId: "", tipo: "Apartamento", situacao: "vacant", endereco: "", numero: "", complemento: "", bairro: "", cep: "", cidade: "", uf: "ES", aluguel: "", caracteristicas: "" }}
      />
    </main>
  );
}
