import { entrar } from "@/lib/autenticacao";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const mensagens: Record<string, string> = {
    "1": "E-mail ou senha incorretos",
    bloqueado: "Acesso bloqueado. Fale com o administrador.",
    "sem-telas": "Seu acesso ainda não tem telas liberadas. Fale com o administrador.",
  };
  const mensagem = erro ? (mensagens[erro] ?? mensagens["1"]) : null;

  return (
    <section className="mx-auto mt-16 max-w-sm rounded-lg border border-line bg-white p-8">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>

      <form action={entrar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-muted">E-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            className="rounded-md border border-line px-3 py-2 text-navy"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-semibold text-muted">Senha</span>
          <input
            type="password"
            name="senha"
            required
            autoComplete="current-password"
            className="rounded-md border border-line px-3 py-2 text-navy"
          />
        </label>

        {mensagem ? (
          <p role="alert" className="rounded-md bg-warn px-3 py-2 text-navy">
            {mensagem}
          </p>
        ) : null}

        <button type="submit" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
          Entrar
        </button>
      </form>
    </section>
  );
}
