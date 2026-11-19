import { listarLocadores, formatarTelefone, mascararDocumento } from "@/lib/locadores";

export default async function PaginaLocadores({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca = "" } = await searchParams;
  const locadores = await listarLocadores(busca);

  return (
    <section className="py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Locadores</h1>
          <p className="text-muted">{locadores.length} encontrado(s)</p>
        </div>

        <form method="get" className="flex gap-2">
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Nome ou CPF/CNPJ"
            className="w-64 rounded-md border border-line bg-white px-3 py-2 text-navy"
          />
          <button
            type="submit"
            className="rounded-md bg-navy px-4 py-2 font-semibold text-white"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">CPF/CNPJ</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {locadores.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  Nenhum locador encontrado.
                </td>
              </tr>
            ) : (
              locadores.map((locador) => (
                <tr key={locador.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{locador.nome}</td>
                  <td className="px-4 py-3 tabular-nums">{mascararDocumento(locador.documento)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatarTelefone(locador.telefone)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
