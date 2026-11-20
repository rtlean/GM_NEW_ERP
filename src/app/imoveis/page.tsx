import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { camposFaltando, percentualDoCadastro, type CampoProgresso } from "@/lib/cadastro-imovel";
import { listarImoveis, buscarImovel } from "@/lib/imoveis-cadastro";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";
import { FormularioImovel } from "@/components/imoveis/FormularioImovel";

// Tela de Imóveis no layout do design: lista à esquerda, cadastro à direita (mesma tela).

const SELO_SITUACAO: Record<string, { rotulo: string; classe: string }> = {
  vacant: { rotulo: "Disponível", classe: "bg-[#DDF0E7] text-[#17533B]" },
  occupied: { rotulo: "Alugado", classe: "bg-[#E8EDF6] text-[#002356]" },
  maintenance: { rotulo: "Em manutenção", classe: "bg-[#FBF3D9] text-[#7A5A10]" },
};

function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; id?: string; novo?: string; salvo?: string }>;
}) {
  await exigirAcesso("imoveis");
  const { busca = "", id, novo, salvo } = await searchParams;

  const [todos, opcoes] = await Promise.all([listarImoveis(), listarOpcoesDeLocador()]);
  const termo = busca.trim().toLowerCase();
  const lista = termo
    ? todos.filter((i) => [i.codigo, i.endereco, i.bairro ?? "", i.tipo ?? "", i.locadorNome].join(" ").toLowerCase().includes(termo))
    : todos;
  const disponiveis = todos.filter((i) => i.situacao === "vacant").length;

  const idNumero = Number(id) || undefined;
  const selecionado = !novo && idNumero ? await buscarImovel(idNumero) : null;
  const modoNovo = Boolean(novo) && !selecionado;

  const linkDoItem = (itemId: number) => {
    const q = new URLSearchParams({ ...(busca ? { busca } : {}), id: String(itemId) });
    return `/imoveis?${q.toString()}`;
  };

  let painel: React.ReactNode;
  if (selecionado || modoNovo) {
    const preenchidos: Record<CampoProgresso, boolean> = selecionado
      ? {
          endereco: Boolean(selecionado.address),
          cep: Boolean(selecionado.zip_code),
          bairro: Boolean(selecionado.bairro),
          aluguel: selecionado.rent_cents > 0,
          locador: Boolean(selecionado.owner_id),
        }
      : { endereco: false, cep: false, bairro: false, aluguel: false, locador: false };
    const faltam = camposFaltando(preenchidos);
    const inicial = selecionado
      ? {
          ownerId: selecionado.owner_id ? String(selecionado.owner_id) : "",
          tipo: selecionado.type ?? "Outro",
          situacao: selecionado.occupancy_status,
          endereco: selecionado.address,
          numero: selecionado.numero ?? "",
          complemento: selecionado.complemento ?? "",
          bairro: selecionado.bairro ?? "",
          cep: selecionado.zip_code ?? "",
          cidade: selecionado.city,
          uf: selecionado.state,
          aluguel: centavosParaTexto(selecionado.rent_cents),
          caracteristicas: selecionado.caracteristicas ?? "",
        }
      : { ownerId: "", tipo: "Apartamento", situacao: "vacant", endereco: "", numero: "", complemento: "", bairro: "", cep: "", cidade: "", uf: "ES", aluguel: "", caracteristicas: "" };

    painel = (
      <FormularioImovel
        key={selecionado ? `imovel-${selecionado.id}` : "novo"}
        id={selecionado?.id}
        opcoes={opcoes}
        inicial={inicial}
        titulo={selecionado ? `${selecionado.code} · ${selecionado.type ?? "Tipo não informado"}` : "Novo imóvel"}
        falta={faltam.length ? `Falta preencher: ${faltam.join(", ")}` : "Cadastro completo"}
        salvo={salvo === "1"}
      />
    );
  } else {
    painel = (
      <p className="rounded-2xl border border-line bg-white p-6 text-[#4F5B72]">Escolha um imóvel na lista ou clique em “Novo imóvel”.</p>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#002356]">Imóveis</h1>
          <p className="text-[#4F5B72]">
            {todos.length} imóveis · {disponiveis} disponíveis
          </p>
        </div>
        <Link href="/imoveis?novo=1" className="flex min-h-11 items-center rounded-[10px] bg-[#002356] px-5 font-bold text-white">
          Novo imóvel
        </Link>
      </header>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <section aria-label="Lista de imóveis" className="flex w-full flex-col gap-2 lg:max-w-sm">
          <form method="get">
            <input
              type="search"
              name="busca"
              aria-label="Buscar imóvel"
              defaultValue={busca}
              placeholder="Buscar por imóvel, bairro ou locador"
              className="min-h-11 w-full rounded-[10px] border border-[#D8DEE9] bg-white px-3.5 text-[#0E1B33]"
            />
          </form>
          {lista.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-4 text-[#4F5B72]">Nenhum imóvel encontrado.</p>
          ) : (
            lista.map((i) => {
              const ativo = selecionado?.id === i.id;
              const selo = SELO_SITUACAO[i.situacao] ?? { rotulo: i.situacao, classe: "bg-[#E8EDF6] text-[#002356]" };
              const pct = percentualDoCadastro({
                endereco: Boolean(i.endereco),
                cep: Boolean(i.cep),
                bairro: Boolean(i.bairro),
                aluguel: i.aluguelCentavos > 0,
                locador: Boolean(i.locadorId),
              });
              return (
                <Link
                  key={i.id}
                  href={linkDoItem(i.id)}
                  aria-current={ativo ? "true" : undefined}
                  className={`flex flex-col gap-1.5 rounded-2xl border-2 bg-white p-3.5 ${ativo ? "border-[#002356]" : "border-[#E8ECF3]"}`}
                >
                  <span className="flex justify-between gap-2">
                    <strong className="text-[#002356]">
                      {i.codigo} · {i.tipo ?? "Tipo não informado"}
                    </strong>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${selo.classe}`}>{selo.rotulo}</span>
                  </span>
                  <span className="text-sm text-[#4F5B72]">
                    {[i.tipo, i.bairro, i.locadorNome].filter(Boolean).join(" · ")}
                  </span>
                  <span className="h-1.5 rounded-full bg-[#E8EDF6]">
                    <span
                      className={`block h-1.5 rounded-full ${pct === 100 ? "bg-[#17694A]" : "bg-[#D4A853]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="text-xs text-[#4F5B72]">Cadastro {pct}% completo</span>
                </Link>
              );
            })
          )}
        </section>

        <div className="min-w-0 flex-1">{painel}</div>
      </div>
    </section>
  );
}
