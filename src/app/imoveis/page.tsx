import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { TIPOS_DE_IMOVEL } from "@/lib/cadastro-imovel";
import { listarImoveis, buscarImovel } from "@/lib/imoveis-cadastro";
import { listarOpcoesDeLocador } from "@/lib/locadores-cadastro";

const ROTULO_SITUACAO: Record<string, string> = {
  occupied: "Alugado",
  vacant: "Disponível",
  maintenance: "Em manutenção",
};

function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
}

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; locador?: string; tipo?: string; id?: string }>;
}) {
  await exigirAcesso("imoveis");
  const { busca = "", locador = "", tipo = "", id } = await searchParams;

  const locadorId = Number(locador) || undefined;
  const [imoveis, opcoes] = await Promise.all([
    listarImoveis({ busca, locadorId, tipo: tipo || undefined }),
    listarOpcoesDeLocador(),
  ]);
  const selecionado = id ? await buscarImovel(Number(id)) : null;

  const linkComFiltros = (params: Record<string, string>) => {
    const q = new URLSearchParams({ ...(busca ? { busca } : {}), ...(locador ? { locador } : {}), ...(tipo ? { tipo } : {}), ...params });
    return `/imoveis?${q.toString()}`;
  };

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Imóveis</h1>
          <p className="text-muted">{imoveis.length} encontrado(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              name="busca"
              defaultValue={busca}
              placeholder="Endereço, bairro ou código"
              className="w-60 rounded-md border border-line bg-white px-3 py-2 text-navy"
            />
            <select name="locador" defaultValue={locador} className="rounded-md border border-line bg-white px-3 py-2 text-navy">
              <option value="">Todos os locadores</option>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            <select name="tipo" defaultValue={tipo} className="rounded-md border border-line bg-white px-3 py-2 text-navy">
              <option value="">Todos os tipos</option>
              {TIPOS_DE_IMOVEL.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
              Filtrar
            </button>
          </form>
          <Link href="/imoveis/novo" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
            Novo imóvel
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        <section aria-label="Lista de imóveis" className="flex flex-[3] flex-col gap-2">
          {imoveis.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-5 text-muted">Nenhum imóvel encontrado.</p>
          ) : (
            imoveis.map((i) => (
              <Link
                key={i.id}
                href={linkComFiltros({ id: String(i.id) })}
                className={`flex flex-col gap-1 rounded-xl border bg-white p-4 ${selecionado?.id === i.id ? "border-navy" : "border-line"}`}
              >
                <span className="font-bold text-navy">
                  {i.codigo} · {i.tipo ?? "Tipo não informado"}
                </span>
                <span className="text-sm text-muted">
                  {i.endereco}
                  {i.bairro ? `, ${i.bairro}` : ""} · {i.cidade}/{i.uf}
                </span>
                <span className="text-sm text-muted">
                  {i.locadorNome} · {reais(i.aluguelCentavos)} · {ROTULO_SITUACAO[i.situacao] ?? i.situacao}
                </span>
              </Link>
            ))
          )}
        </section>

        {selecionado ? (
          <section aria-label="Detalhe do imóvel" className="flex min-w-[320px] flex-[2] flex-col gap-3 rounded-2xl border border-line bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-2xl font-extrabold text-navy">
                {selecionado.code} · {selecionado.type}
              </h2>
              <Link href={`/imoveis/${selecionado.id}/editar`} className="rounded-md border border-line px-3 py-2 font-semibold text-navy">
                Editar
              </Link>
            </div>
            <p className="text-muted">
              {selecionado.address}
              {selecionado.numero ? `, ${selecionado.numero}` : ""}
              {selecionado.complemento ? ` · ${selecionado.complemento}` : ""}
            </p>
            <p className="text-muted">
              {selecionado.bairro ?? "Bairro não informado"} · {selecionado.city}/{selecionado.state}
              {selecionado.zip_code ? ` · CEP ${selecionado.zip_code}` : ""}
            </p>
            <p className="font-semibold text-navy">
              Aluguel de referência {reais(selecionado.rent_cents)} · {ROTULO_SITUACAO[selecionado.occupancy_status] ?? selecionado.occupancy_status}
            </p>
            {selecionado.caracteristicas ? <p className="whitespace-pre-line text-muted">{selecionado.caracteristicas}</p> : null}
          </section>
        ) : null}
      </div>
    </section>
  );
}
