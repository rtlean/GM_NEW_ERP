import { exigirAcesso } from "@/lib/acesso";
import { camposFaltando, paraEntrada, percentualDoCadastro, type CampoProgresso, type LinhaImovel } from "@/lib/cadastro-imovel";
import { listarImoveis, buscarImovel } from "@/lib/imoveis-cadastro";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";
import { FormularioImovel } from "@/components/imoveis/FormularioImovel";
import Link from "next/link";

// Tela de Imóveis no layout do design: lista à esquerda, cadastro à direita (mesma tela).

const SELO_SITUACAO: Record<string, { rotulo: string; classe: string }> = {
  vacant: { rotulo: "Disponível", classe: "bg-[#DDF0E7] text-[#17533B]" },
  occupied: { rotulo: "Alugado", classe: "bg-[#E8EDF6] text-[#002356]" },
  maintenance: { rotulo: "Em manutenção", classe: "bg-[#FBF3D9] text-[#7A5A10]" },
  sold: { rotulo: "Vendido", classe: "bg-[#EEF0F4] text-[#4F5B72]" },
};

/** Quais campos do progresso estão preenchidos numa linha do banco. */
function preenchidosDe(i: LinhaImovel): Record<CampoProgresso, boolean> {
  return {
    nome: Boolean(i.name),
    cep: Boolean(i.zip_code),
    endereco: Boolean(i.address),
    bairro: Boolean(i.bairro),
    matricula: Boolean(i.matricula),
    inscricaoIptu: Boolean(i.iptu_registration),
    banheiros: i.bathrooms !== null,
    areaUtil: i.useful_area_m2 !== null,
    areaTotal: i.total_area_m2 !== null,
    aluguel: i.rent_cents > 0,
    iptu: (i.iptu_cents ?? 0) > 0,
    locador: Boolean(i.owner_id),
  };
}

const nomeDoImovel = (i: { name: string | null; type: string | null; code: string }) => i.name || `${i.type ?? "Tipo não informado"} · ${i.code}`;

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
    ? todos.filter((i) => [i.code, i.name ?? "", i.address, i.bairro ?? "", i.type ?? "", i.locadorNome].join(" ").toLowerCase().includes(termo))
    : todos;
  const disponiveis = todos.filter((i) => i.occupancy_status === "vacant").length;

  const idNumero = Number(id) || undefined;
  const selecionado = !novo && idNumero ? await buscarImovel(idNumero) : null;
  const modoNovo = Boolean(novo) && !selecionado;

  const linkDoItem = (itemId: number) => {
    const q = new URLSearchParams({ ...(busca ? { busca } : {}), id: String(itemId) });
    return `/imoveis?${q.toString()}`;
  };

  let painel: React.ReactNode;
  if (selecionado || modoNovo) {
    const vazio: Record<CampoProgresso, boolean> = { nome: false, cep: false, endereco: false, bairro: false, matricula: false, inscricaoIptu: false, banheiros: false, areaUtil: false, areaTotal: false, aluguel: false, iptu: false, locador: false };
    const faltam = camposFaltando(selecionado ? preenchidosDe(selecionado) : vazio);
    painel = (
      <FormularioImovel
        key={selecionado ? `imovel-${selecionado.id}` : "novo"}
        id={selecionado?.id}
        opcoes={opcoes}
        inicial={selecionado ? paraEntrada(selecionado) : paraEntrada({ owner_id: null, name: null, type: "Apartamento", finality: "Locação", occupancy_status: "vacant", zip_code: null, address: "", numero: null, complemento: null, bairro: null, city: "", state: "ES", matricula: null, iptu_registration: null, bedrooms: null, suites: null, bathrooms: null, parking_spots: null, useful_area_m2: null, total_area_m2: null, floor: null, furnishing: "Sem mobília", pets_allowed: "Não informado", amenities: [], rent_cents: 0, sale_value_cents: null, condominium_cents: null, iptu_cents: null })}
        titulo={selecionado ? nomeDoImovel({ name: selecionado.name, type: selecionado.type, code: selecionado.code }) : "Novo imóvel"}
        falta={faltam.length ? `Falta preencher: ${faltam.join(", ")}` : "Cadastro completo"}
        salvo={salvo === "1"}
      />
    );
  } else {
    painel = <p className="rounded-2xl border border-[#E8ECF3] bg-white p-6 text-[#4F5B72]">Escolha um imóvel na lista ou clique em “Novo imóvel”.</p>;
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
            <p className="rounded-xl border border-[#E8ECF3] bg-white p-4 text-[#4F5B72]">Nenhum imóvel encontrado.</p>
          ) : (
            lista.map((i) => {
              const ativo = selecionado?.id === i.id;
              const selo = SELO_SITUACAO[i.occupancy_status] ?? { rotulo: i.occupancy_status, classe: "bg-[#E8EDF6] text-[#002356]" };
              const pct = percentualDoCadastro(preenchidosDe(i));
              return (
                <Link
                  key={i.id}
                  href={linkDoItem(i.id)}
                  aria-current={ativo ? "true" : undefined}
                  className={`flex flex-col gap-1.5 rounded-2xl border-2 bg-white p-3.5 ${ativo ? "border-[#002356]" : "border-[#E8ECF3]"}`}
                >
                  <span className="flex justify-between gap-2">
                    <strong className="text-[#002356]">{nomeDoImovel(i)}</strong>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${selo.classe}`}>{selo.rotulo}</span>
                  </span>
                  <span className="text-sm text-[#4F5B72]">{[i.type, i.bairro, i.locadorNome].filter(Boolean).join(" · ")}</span>
                  <span className="h-1.5 rounded-full bg-[#E8EDF6]">
                    <span className={`block h-1.5 rounded-full ${pct === 100 ? "bg-[#17694A]" : "bg-[#D4A853]"}`} style={{ width: `${pct}%` }} />
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
