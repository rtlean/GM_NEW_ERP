import Image from "next/image";
import { exigirSessaoAtiva } from "@/lib/acesso";
import { FormularioTrocarSenha } from "@/components/usuarios/FormularioTrocarSenha";

// Troca obrigatória (senha provisória ou redefinida pelo administrador) e "Minha senha" (troca voluntária), no mesmo visual da tela de Entrar.
export default async function PaginaTrocarSenha({ searchParams }: { searchParams: Promise<{ voluntaria?: string }> }) {
  await exigirSessaoAtiva();
  const { voluntaria } = await searchParams;
  const ehVoluntaria = voluntaria === "1";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-5">
        <Image src="/logo.png" alt="Soluções Imobiliárias" width={210} height={60} className="h-auto w-[210px]" />
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight text-navy">{ehVoluntaria ? "Minha senha" : "Escolha sua senha"}</h1>
          <p className="mt-1 text-muted">
            {ehVoluntaria ? "Troque sua senha. Vamos pedir a senha atual antes." : "Sua senha provisória precisa ser trocada antes de continuar."}
          </p>
        </div>
        <FormularioTrocarSenha voluntaria={ehVoluntaria} />
      </div>
    </main>
  );
}
