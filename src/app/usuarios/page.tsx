import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { GRUPOS_DE_TELAS } from "@/lib/permissoes";
import { listarUsuarios, type UsuarioLinha } from "@/lib/usuarios";
import { NovoUsuarioForm } from "@/components/usuarios/NovoUsuarioForm";
import { RedefinirSenhaBotao } from "@/components/usuarios/RedefinirSenhaBotao";
import { bloquearAction, salvarContatoAction, salvarTelasAction } from "./actions";

const MENSAGENS: Record<string, string> = {
  dados: "Dados salvos.",
  telas: "Telas salvas. As mudanças valem imediatamente.",
  bloqueado: "Acesso bloqueado. As sessões abertas deste usuário foram encerradas.",
  liberado: "Acesso liberado.",
};

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; novo?: string; ok?: string; erro?: string }>;
}) {
  await exigirAcesso("usuarios");
  const { u, novo, ok, erro } = await searchParams;

  const lista = await listarUsuarios();
  const selecionado: UsuarioLinha | undefined =
    lista.find((x) => String(x.id) === u) ?? lista.find((x) => x.role === "user");
  const ativos = lista.filter((x) => x.status === "active").length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Usuários e acessos</h1>
          <p className="text-muted">
            {lista.length} usuários · {ativos} ativos
          </p>
        </div>
        <Link href="/usuarios?novo=1" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">
          Novo usuário
        </Link>
      </header>

      {ok && MENSAGENS[ok] ? <p role="status" className="rounded-md bg-[#DDF0E7] px-4 py-3 font-semibold text-[#17533B]">{MENSAGENS[ok]}</p> : null}
      {erro ? <p role="alert" className="rounded-md bg-red-50 px-4 py-3 font-semibold text-red-800">{erro}</p> : null}

      {novo ? <NovoUsuarioForm /> : null}

      <div className="flex flex-wrap items-start gap-5">
        <nav aria-label="Usuários" className="flex min-w-[260px] flex-1 flex-col gap-2">
          {lista.map((x) => {
            const ativo = selecionado?.id === x.id;
            const rotulo = x.role === "admin" ? "Administrador" : x.status === "inactive" ? "Bloqueado" : "Ativo";
            return (
              <Link
                key={x.id}
                href={`/usuarios?u=${x.id}`}
                aria-current={ativo ? "page" : undefined}
                className={`flex flex-col gap-1 rounded-xl border-2 bg-white p-3 ${ativo ? "border-navy" : "border-line"}`}
              >
                <span className="flex justify-between gap-2">
                  <strong className="text-navy">{x.nome}</strong>
                  <span className="text-xs font-bold">{rotulo}</span>
                </span>
                <span className="break-all text-muted">{x.email}</span>
                <span className="text-muted">{x.role === "admin" ? "Todas as telas" : `${x.telas.length} telas liberadas`}</span>
              </Link>
            );
          })}
        </nav>

        {selecionado ? (
          <section aria-label="Permissões" className="flex min-w-[320px] flex-[3] flex-col gap-5 rounded-2xl border border-line bg-white p-6">
            <div>
              <h2 className="text-2xl font-extrabold text-navy">{selecionado.nome}</h2>
              <p className="break-all text-muted">{selecionado.email} · {selecionado.role === "admin" ? "Administrador" : "Operacional"}</p>
            </div>

            {selecionado.role === "admin" ? (
              <p className="rounded-xl bg-[#F0F3FA] p-4">O administrador tem acesso a todas as telas. Este perfil não pode ser restringido nem bloqueado aqui.</p>
            ) : (
              <>
                <form action={salvarContatoAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={selecionado.id} />
                  <label className="flex flex-1 flex-col gap-1 font-semibold">
                    Nome
                    <input name="nome" defaultValue={selecionado.nome} required className="rounded-md border border-line px-3 py-2 font-normal" />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 font-semibold">
                    E-mail
                    <input type="email" name="email" defaultValue={selecionado.email} required className="rounded-md border border-line px-3 py-2 font-normal" />
                  </label>
                  <button type="submit" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">Salvar dados</button>
                </form>

                <div className="flex flex-wrap items-start gap-3">
                  <RedefinirSenhaBotao id={selecionado.id} />
                  <form action={bloquearAction}>
                    <input type="hidden" name="id" value={selecionado.id} />
                    <input type="hidden" name="bloqueado" value={selecionado.status === "inactive" ? "0" : "1"} />
                    <button type="submit" className="rounded-md border border-[#A32020] px-3 py-2 font-semibold text-[#A32020]">
                      {selecionado.status === "inactive" ? "Desbloquear" : "Bloquear acesso"}
                    </button>
                  </form>
                </div>

                <form action={salvarTelasAction} className="flex flex-col gap-4">
                  <input type="hidden" name="id" value={selecionado.id} />
                  <p className="font-semibold">{selecionado.telas.length} de {GRUPOS_DE_TELAS.flatMap((g) => g.telas).length} telas liberadas</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {GRUPOS_DE_TELAS.map((g) => (
                      <fieldset key={g.chave} className="flex flex-col gap-1 rounded-xl border border-line p-4">
                        <legend className="px-1 font-bold text-navy">{g.rotulo}</legend>
                        <div className="flex gap-3 text-sm">
                          <button type="submit" name="grupo" value={`liberar:${g.chave}`} className="text-navy underline">Liberar todas</button>
                          <button type="submit" name="grupo" value={`restringir:${g.chave}`} className="text-navy underline">Restringir todas</button>
                        </div>
                        {g.telas.map((t) => (
                          <label key={t.chave} className="flex min-h-11 items-center justify-between gap-3 border-t border-[#F0F3FA]">
                            <span>{t.rotulo}</span>
                            <input type="checkbox" name="tela" value={t.chave} defaultChecked={selecionado.telas.includes(t.chave)} className="h-5 w-5" />
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                  <div>
                    <button type="submit" className="rounded-md bg-navy px-4 py-2 font-semibold text-white">Salvar telas</button>
                  </div>
                  <p className="text-muted">Mudanças valem imediatamente. Usuários e acessos é exclusivo do administrador.</p>
                </form>
              </>
            )}
          </section>
        ) : (
          <p className="text-muted">Nenhum usuário operacional cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
