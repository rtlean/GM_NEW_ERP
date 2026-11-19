import { exigirSessaoAtiva } from "@/lib/acesso";
import { FormularioTrocarSenha } from "@/components/usuarios/FormularioTrocarSenha";

export default async function PaginaTrocarSenha({
  searchParams,
}: {
  searchParams: Promise<{ voluntaria?: string }>;
}) {
  await exigirSessaoAtiva();
  const { voluntaria } = await searchParams;

  return (
    <section className="mx-auto mt-10 max-w-sm rounded-lg border border-line bg-white p-8">
      <h1 className="mb-2 text-2xl font-bold">{voluntaria ? "Trocar minha senha" : "Escolha sua senha"}</h1>
      <p className="mb-6 text-muted">
        {voluntaria ? "Digite a nova senha para o seu acesso." : "Sua senha provisória precisa ser trocada antes de continuar."}
      </p>
      <FormularioTrocarSenha />
    </section>
  );
}
