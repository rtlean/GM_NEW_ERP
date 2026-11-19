import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";
import { FormularioLocatario } from "@/components/locatarios/FormularioLocatario";

export default async function NovoLocatarioPage() {
  await exigirAcesso("locatarios");
  const opcoes = await listarOpcoesDeLocador();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href="/locatarios" className="font-semibold text-navy underline">
        ← Voltar para locatários
      </Link>
      <h1 className="text-2xl font-bold text-navy">Novo locatário</h1>
      <FormularioLocatario inicial={{ nome: "", documento: "", email: "", whatsapp: "", locadores: [] }} opcoes={opcoes} />
    </main>
  );
}
