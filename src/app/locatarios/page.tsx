import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { formatarReais } from "@/lib/dinheiro";
import { nomesParecidos } from "@/lib/cadastro-locatario";
import { formatarTelefone } from "@/lib/locadores";
import { buscarLocatario, listarLocatarios, listarNomesDeLocatarios, type FiltroLocatarios } from "@/lib/locatarios";
import { FormularioLocatario } from "@/components/locatarios/FormularioLocatario";

// Tela de Locatários no layout do design: painel de cadastro acima, lista à esquerda, detalhe à direita.

const FILTROS: { valor: FiltroLocatarios; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "mais-de-um-imovel", rotulo: "Com mais de um imóvel" },
];

export default async function PaginaLocatarios({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; id?: string; novo?: string; editar?: string; salvo?: string }>;
}) {
  await exigirAcesso("locatarios");
  const { busca = "", filtro, id, novo, editar, salvo } = await searchParams;
  const filtroAtual: FiltroLocatarios = filtro === "mais-de-um-imovel" ? "mais-de-um-imovel" : "todos";

  const locatarios = await listarLocatarios({ busca, filtro: filtroAtual });
  const idNumero = Number(id) || undefined;
  const selecionadoLinha = locatarios.find((l) => l.id === idNumero) ?? (novo ? undefined : locatarios[0]);
  const dados = selecionadoLinha ? await buscarLocatario(selecionadoLinha.id) : null;
  const parecidos = dados ? nomesParecidos(dados.full_name, await listarNomesDeLocatarios(), dados.id) : [];

  const linkComFiltros = (params: Record<string, string>) => {
    const q = new URLSearchParams({ ...(busca ? { busca } : {}), ...(filtroAtual !== "todos" ? { filtro: filtroAtual } : {}), ...params });
    return `/locatarios?${q.toString()}`;
  };

  const formulario = novo
    ? { titulo: "Novo locatário", inicial: { nome: "", documento: "", rg: "", email: "", whatsapp: "", observacoes: "" }, id: undefined }
    : editar && dados
      ? {
          titulo: "Editar locatário",
          id: dados.id,
          inicial: {
            nome: dados.full_name,
            documento: dados.document ?? "",
            rg: dados.rg ?? "",
            email: dados.email ?? "",
            whatsapp: formatarTelefone(dados.phone) === "—" ? "" : formatarTelefone(dados.phone),
            observacoes: dados.notes ?? "",
          },
        }
      : null;

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#002356]">Locatários</h1>
          <p className="text-[#4F5B72]">{locatarios.length} locatários</p>
        </div>
        <Link href="/locatarios?novo=1" className="flex min-h-11 items-center rounded-[10px] bg-[#002356] px-5 font-bold text-white">
          Novo locatário
        </Link>
      </header>

      {salvo ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#DDF0E7] px-4 py-3 font-semibold text-[#17533B]">
          <span>
            {salvo === "criado"
              ? "Locatário cadastrado. Para vincular um imóvel, crie o contrato."
              : "Dados do locatário atualizados. Os contratos dele continuam vinculados."}
          </span>
          <Link href={`/locatarios?id=${idNumero}`} className="min-h-11 px-3 py-3 font-bold">
            Fechar
          </Link>
        </div>
      ) : null}

      {formulario ? (
        <FormularioLocatario
          key={formulario.id ? `editar-${formulario.id}` : "novo"}
          inicial={formulario.inicial}
          id={formulario.id}
          titulo={formulario.titulo}
          cancelarPara={dados ? `/locatarios?id=${dados.id}` : "/locatarios"}
        />
      ) : null}

      <form method="get" className="flex flex-wrap items-center gap-2">
        {filtroAtual !== "todos" ? <input type="hidden" name="filtro" value={filtroAtual} /> : null}
        <input
          type="search"
          name="busca"
          defaultValue={busca}
          aria-label="Buscar locatário"
          placeholder="Buscar locatário"
          className="min-h-11 w-full max-w-[460px] flex-1 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5 text-[14px] text-[#0E1B33]"
        />
        {FILTROS.map((f) => {
          const ativo = filtroAtual === f.valor;
          return (
            <Link
              key={f.valor}
              href={linkComFiltros({ ...(f.valor !== "todos" ? { filtro: f.valor } : {}) })}
              aria-current={ativo ? "true" : undefined}
              className={`flex min-h-11 items-center rounded-full border px-4 text-[13px] font-semibold ${ativo ? "border-[#002356] bg-[#002356] text-white" : "border-[#D8DEE9] bg-white text-[#002356]"}`}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </form>

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Lista de locatários" className="flex max-h-[660px] min-w-[300px] flex-1 flex-col gap-2 overflow-y-auto p-0.5">
          {locatarios.length === 0 ? (
            <p className="rounded-xl border border-[#E8ECF3] bg-white p-4 text-[#4F5B72]">Nenhum locatário encontrado.</p>
          ) : (
            locatarios.map((l) => {
              const ativo = dados?.id === l.id;
              return (
                <Link
                  key={l.id}
                  href={linkComFiltros({ id: String(l.id) })}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-[56px] items-center justify-between gap-3 rounded-[14px] border-2 bg-white px-3.5 py-2 ${ativo ? "border-[#002356]" : "border-[#E8ECF3]"}`}
                >
                  <strong className="text-[#002356]">{l.nome}</strong>
                  <span className="shrink-0 text-[#4F5B72]">
                    {l.quantidadeImoveis === 0
                      ? "Sem imóvel"
                      : `${l.quantidadeImoveis} ${l.quantidadeImoveis === 1 ? "imóvel" : "imóveis"}`}
                  </span>
                </Link>
              );
            })
          )}
        </section>

        {dados ? (
          <section
            aria-label="Detalhe do locatário"
            className="flex min-w-[320px] flex-[2] flex-col gap-3 rounded-2xl border border-[#E8ECF3] bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-[#002356]">{dados.full_name}</h2>
                <p className="text-[#4F5B72]">
                  {dados.imoveis.length} {dados.imoveis.length === 1 ? "imóvel" : "imóveis"} · {dados.quantidadeLocadores}{" "}
                  {dados.quantidadeLocadores === 1 ? "locador" : "locadores"}
                </p>
                <Link
                  href={`/locatarios?id=${dados.id}&editar=1`}
                  className="mt-2 inline-flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-[#002356]"
                >
                  Editar dados
                </Link>
              </div>
              <div className="text-right">
                <p className="text-[#4F5B72]">Aluguéis por mês</p>
                <strong className="text-[22px] tabular-nums text-[#002356]">{formatarReais(dados.totalAluguelCentavos)}</strong>
              </div>
            </div>

            {parecidos.length > 0 ? (
              <p className="rounded-xl bg-[#FBF3D9] p-3.5 text-[#0E1B33]">
                &ldquo;{dados.full_name}&rdquo; tem nome muito parecido com {parecidos.map((p) => `"${p.nome}"`).join(", ")}. Confira o CPF ou CNPJ para saber se é o mesmo cadastro.
              </p>
            ) : null}

            {dados.imoveis.length === 0 ? (
              <p className="font-semibold text-[#7A4A00]">
                Nenhum imóvel vinculado ainda. <Link href="/contratos" className="underline">Criar contrato</Link>
              </p>
            ) : (
              dados.imoveis.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F6F8FC] p-3.5">
                  <span className="flex flex-col">
                    <strong>{i.tipo ?? "Tipo não informado"}</strong>
                    <span className="text-[#4F5B72]">Registro {i.codigo}</span>
                  </span>
                  <span className="flex flex-col text-right">
                    <span className="text-[12px] text-[#4F5B72]">Locador</span>
                    <strong>{i.locador}</strong>
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
