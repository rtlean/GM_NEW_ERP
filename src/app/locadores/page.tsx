import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { formatarReais } from "@/lib/dinheiro";
import { listarImoveisDoLocador } from "@/lib/imoveis";
import { formatarTelefone, listarLocadores, mascararDocumento } from "@/lib/locadores";

export default async function PaginaLocadores({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; semWhatsApp?: string; id?: string }>;
}) {
  await exigirAcesso("locadores");
  const { busca = "", semWhatsApp, id } = await searchParams;
  const filtroSemWhatsApp = semWhatsApp === "1";

  const locadores = await listarLocadores({ busca, semWhatsApp: filtroSemWhatsApp });
  const selecionado = locadores.find((l) => String(l.id) === id) ?? locadores[0];
  const imoveis = selecionado ? await listarImoveisDoLocador(selecionado.id) : [];

  const linkComFiltros = (params: Record<string, string>) => {
    const query = new URLSearchParams({
      ...(busca ? { busca } : {}),
      ...(filtroSemWhatsApp ? { semWhatsApp: "1" } : {}),
      ...params,
    });
    return `/locadores?${query.toString()}`;
  };

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Locadores</h1>
          <p className="text-muted">{locadores.length} encontrado(s)</p>
        </div>
        <Link href="/locadores/novo" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
          Novo locador
        </Link>

        <form method="get" className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Nome ou CPF/CNPJ"
            className="w-64 rounded-md border border-line bg-white px-3 py-2 text-navy"
          />
          <label className="flex items-center gap-2 font-semibold text-navy">
            <input type="checkbox" name="semWhatsApp" value="1" defaultChecked={filtroSemWhatsApp} className="h-5 w-5" />
            Sem WhatsApp
          </label>
          <button type="submit" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
            Buscar
          </button>
        </form>
      </header>

      <div className="flex flex-wrap items-start gap-5">
        <nav aria-label="Lista de locadores" className="flex max-h-[720px] min-w-[300px] flex-1 flex-col gap-2 overflow-y-auto">
          {locadores.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-4 text-muted">Nenhum locador encontrado.</p>
          ) : (
            locadores.map((l) => {
              const ativo = selecionado?.id === l.id;
              return (
                <Link
                  key={l.id}
                  href={linkComFiltros({ id: String(l.id) })}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-[60px] items-center justify-between gap-3 rounded-xl border-2 bg-white p-3 ${ativo ? "border-navy" : "border-line"}`}
                >
                  <span className="flex flex-col">
                    <strong className="text-navy">{l.nome}</strong>
                    <span className="text-muted">
                      {l.quantidadeImoveis} {l.quantidadeImoveis === 1 ? "imóvel" : "imóveis"} · {l.status}
                    </span>
                  </span>
                  <strong className="shrink-0 tabular-nums">{formatarReais(l.totalAluguelCentavos)}</strong>
                </Link>
              );
            })
          )}
        </nav>

        {selecionado ? (
          <section aria-label="Detalhe do locador" className="flex min-w-[320px] flex-[2] flex-col gap-4 rounded-2xl border border-line bg-white p-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-2xl font-extrabold text-navy">{selecionado.nome}</h2>
                <Link href={`/locadores/${selecionado.id}/editar`} className="rounded-md border border-line px-3 py-2 font-semibold text-navy">
                  Editar
                </Link>
              </div>
              <p className="text-muted">
                CPF/CNPJ {mascararDocumento(selecionado.documento)} · WhatsApp {formatarTelefone(selecionado.telefone)} · {selecionado.status}
              </p>
            </div>

            <h3 className="font-bold text-navy">Imóveis deste locador</h3>
            {imoveis.length === 0 ? (
              <p className="font-semibold text-[#7A4A00]">Nenhum imóvel cadastrado para este locador.</p>
            ) : (
              imoveis.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg p-3">
                  <span className="flex flex-col">
                    <strong>{i.tipo ?? "Tipo não informado"}</strong>
                    <span className="text-muted">
                      {[i.endereco, i.cidade && i.uf ? `${i.cidade}/${i.uf}` : i.cidade].filter(Boolean).join(" · ") || "Endereço não informado"}
                    </span>
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
