import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { formatarTelefone, mascararDocumento } from "@/lib/locadores";
import { buscarLocatario, listarLocatarios } from "@/lib/locatarios";

export default async function LocatariosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; id?: string }>;
}) {
  await exigirAcesso("locatarios");
  const { busca = "", id } = await searchParams;

  const locatarios = await listarLocatarios({ busca });
  const selecionadoId = Number(id);
  const selecionado = id ? await buscarLocatario(selecionadoId) : null;

  const linkComBusca = (params: Record<string, string>) => {
    const q = new URLSearchParams({ ...(busca ? { busca } : {}), ...params });
    return `/locatarios?${q.toString()}`;
  };

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Locatários</h1>
          <p className="text-muted">{locatarios.length} encontrado(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex items-center gap-3">
            <input
              type="search"
              name="busca"
              defaultValue={busca}
              placeholder="Nome ou CPF/CNPJ"
              className="w-64 rounded-md border border-line bg-white px-3 py-2 text-navy"
            />
            <button type="submit" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
              Buscar
            </button>
          </form>
          <Link href="/locatarios/novo" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
            Novo locatário
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        <section aria-label="Lista de locatários" className="flex flex-[3] flex-col gap-2">
          {locatarios.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-5 text-muted">Nenhum locatário encontrado.</p>
          ) : (
            locatarios.map((l) => {
              const ativo = selecionado?.id === l.id;
              return (
                <Link
                  key={l.id}
                  href={linkComBusca({ id: String(l.id) })}
                  className={`flex flex-col gap-1 rounded-xl border p-4 ${ativo ? "border-navy bg-white" : "border-line bg-white"}`}
                >
                  <span className="font-bold text-navy">{l.nome}</span>
                  <span className="text-sm text-muted">
                    {mascararDocumento(l.documento)} · {l.contratosAtivos > 0 ? `${l.contratosAtivos} contrato(s) ativo(s)` : "Sem contrato ativo"}
                  </span>
                </Link>
              );
            })
          )}
        </section>

        {selecionado ? (
          <section aria-label="Detalhe do locatário" className="flex min-w-[320px] flex-[2] flex-col gap-4 rounded-2xl border border-line bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-navy">{selecionado.full_name}</h2>
                <p className="text-muted">
                  CPF/CNPJ {mascararDocumento(selecionado.document)} · WhatsApp {formatarTelefone(selecionado.phone)}
                </p>
                {selecionado.email ? <p className="text-muted">{selecionado.email}</p> : null}
              </div>
              <Link href={`/locatarios/${selecionado.id}/editar`} className="rounded-md border border-line px-3 py-2 font-semibold text-navy">
                Editar
              </Link>
            </div>
            <h3 className="font-bold text-navy">Locadores ligados</h3>
            {selecionado.locadores.length === 0 ? (
              <p className="text-muted">Nenhum locador ligado.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {selecionado.locadores.map((o) => (
                  <li key={o.id} className="font-semibold text-navy">
                    {o.nome}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
