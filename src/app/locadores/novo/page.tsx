import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { paraFormulario } from "@/lib/cadastro-locador";
import { FormularioLocador } from "@/components/locadores/FormularioLocador";

export default async function NovoLocadorPage() {
  await exigirAcesso("locadores");
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href="/locadores" className="font-semibold text-navy underline">
        ← Voltar para locadores
      </Link>
      <h1 className="text-2xl font-bold text-navy">Novo locador</h1>
      <FormularioLocador inicial={paraFormulario({})} />
    </main>
  );
}
