import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { formatarReais } from "@/lib/dinheiro";
import { paraFormulario, ROTULO_FORMA_DE_REPASSE, type EntradaLocador } from "@/lib/cadastro-locador";
import { buscarLocadorParaEdicao } from "@/lib/locadores-cadastro";
import { listarImoveisDoLocador } from "@/lib/imoveis";
import { listarLocadores } from "@/lib/locadores";
import { FormularioLocador } from "@/components/locadores/FormularioLocador";

// Tela de Locadores no layout do design: painel de cadastro acima, lista à esquerda, detalhe à direita.

export default async function PaginaLocadores({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; novo?: string; editar?: string; salvo?: string }>;
}) {
  await exigirAcesso("locadores");
  const { id, novo, editar, salvo } = await searchParams;

  const locadores = (await listarLocadores()).sort(
    (a, b) => b.totalAluguelCentavos - a.totalAluguelCentavos || a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const idNumero = Number(id) || undefined;
  const selecionado = locadores.find((l) => l.id === idNumero) ?? (novo ? undefined : locadores[0]);

  const dados = selecionado ? await buscarLocadorParaEdicao(selecionado.id) : null;
  const imoveis = selecionado ? await listarImoveisDoLocador(selecionado.id) : [];
  const formulario: EntradaLocador | null = novo
    ? paraFormulario({})
    : editar && dados
      ? paraFormulario(dados)
      : null;

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#002356]">Locadores</h1>
          <p className="text-[#4F5B72]">{locadores.length} locadores cadastrados</p>
        </div>
        <Link href="/locadores?novo=1" className="flex min-h-11 items-center rounded-[10px] bg-[#002356] px-5 font-bold text-white">
          Novo locador
        </Link>
      </header>

      {salvo ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#DDF0E7] px-4 py-3 font-semibold text-[#17533B]">
          <span>{salvo === "criado" ? "Locador cadastrado. Agora cadastre o imóvel dele em um novo contrato." : "Dados do locador atualizados."}</span>
          <Link href={`/locadores?id=${idNumero}`} className="min-h-11 px-3 py-3 font-bold">
            Fechar
          </Link>
        </div>
      ) : null}

      {formulario ? (
        <FormularioLocador
          key={editar && dados ? `editar-${dados.id}` : "novo"}
          inicial={formulario}
          id={editar && dados ? dados.id : undefined}
          titulo={editar && dados ? "Editar locador" : "Novo locador"}
        />
      ) : null}

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Lista de locadores" className="flex max-h-[720px] min-w-[300px] flex-1 flex-col gap-2 overflow-y-auto p-0.5">
          {locadores.length === 0 ? (
            <p className="rounded-xl border border-[#E8ECF3] bg-white p-4 text-[#4F5B72]">Nenhum locador cadastrado.</p>
          ) : (
            locadores.map((l) => {
              const ativo = selecionado?.id === l.id;
              return (
                <Link
                  key={l.id}
                  href={`/locadores?id=${l.id}`}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-[60px] items-center justify-between gap-3 rounded-[14px] border-2 bg-white p-3.5 ${ativo ? "border-[#002356]" : "border-[#E8ECF3]"}`}
                >
                  <span className="flex flex-col">
                    <strong className="text-[#002356]">{l.nome}</strong>
                    <span className="text-[#4F5B72]">
                      {l.quantidadeImoveis} {l.quantidadeImoveis === 1 ? "imóvel" : "imóveis"}
                    </span>
                  </span>
                  <strong className="shrink-0 tabular-nums">{formatarReais(l.totalAluguelCentavos)}</strong>
                </Link>
              );
            })
          )}
        </section>

        {selecionado && dados ? (
          <section
            aria-label="Detalhe do locador"
            className="flex min-w-[320px] flex-[2] flex-col gap-3 rounded-2xl border border-[#E8ECF3] bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-[#002356]">{dados.full_name}</h2>
                <p className="text-[#4F5B72]">
                  Taxa de {paraFormulario(dados).taxa}% · repasse por {ROTULO_FORMA_DE_REPASSE[dados.preferred_repass_method as keyof typeof ROTULO_FORMA_DE_REPASSE] ?? "Pix"}
                  {dados.city ? ` · ${dados.city}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/locadores?id=${dados.id}&editar=1`} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-[#002356]">
                  Editar dados
                </Link>
                <Link href="/contratos" className="flex min-h-11 items-center px-2 font-semibold text-[#002356] underline">
                  Novo contrato
                </Link>
              </div>
            </div>

            <h3 className="mt-1 text-[15px] font-bold text-[#002356]">Imóveis deste locador</h3>
            {imoveis.length === 0 ? (
              <p className="font-semibold text-[#7A4A00]">Nenhum imóvel cadastrado para este locador.</p>
            ) : (
              imoveis.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F6F8FC] p-3.5">
                  <span className="flex flex-col">
                    <strong>{i.tipo ?? "Tipo não informado"}</strong>
                    <span className="text-[#4F5B72]">Locatário: a definir no contrato (US-3.5)</span>
                  </span>
                  <strong className="tabular-nums">{formatarReais(i.aluguelCentavos)}</strong>
                </div>
              ))
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
