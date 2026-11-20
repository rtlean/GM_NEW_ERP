import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { GRUPOS_DE_TELAS, MODELOS_DE_ACESSO } from "@/lib/permissoes";
import { listarUsuarios, type UsuarioLinha } from "@/lib/usuarios";
import { FormularioTelas } from "@/components/usuarios/FormularioTelas";
import { NovoUsuarioForm } from "@/components/usuarios/NovoUsuarioForm";
import { RedefinirSenhaBotao } from "@/components/usuarios/RedefinirSenhaBotao";
import { bloquearAction, salvarContatoAction } from "./actions";

// Tela "Usuários e acessos" no layout do design: lista à esquerda, permissões à direita.
// As mudanças de telas valem na hora (o formulário se envia a cada marcação).

const MENSAGENS: Record<string, string> = {
  dados: "Dados salvos.",
  bloqueado: "Acesso bloqueado. As sessões abertas deste usuário foram encerradas.",
  liberado: "Acesso liberado.",
};

const TOTAL_DE_TELAS = GRUPOS_DE_TELAS.flatMap((g) => g.telas).length;

const PILULA: Record<"admin" | "bloqueado" | "ativo", string> = {
  admin: "bg-[#F4E6C2] text-navy",
  bloqueado: "bg-[#FBEDED] text-[#8A1C1C]",
  ativo: "bg-[#DDF0E7] text-[#17533B]",
};

function situacao(usuario: UsuarioLinha): { rotulo: string; cor: keyof typeof PILULA } {
  if (usuario.role === "admin") return { rotulo: "Administrador", cor: "admin" };
  if (usuario.status === "inactive") return { rotulo: "Bloqueado", cor: "bloqueado" };
  return { rotulo: "Ativo", cor: "ativo" };
}

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; novo?: string; editar?: string; ok?: string; erro?: string }>;
}) {
  await exigirAcesso("usuarios");
  const { u, novo, editar, ok, erro } = await searchParams;

  const lista = await listarUsuarios();
  const selecionado: UsuarioLinha | undefined = lista.find((x) => String(x.id) === u) ?? lista.find((x) => x.role === "user");
  const ativos = lista.filter((x) => x.status === "active").length;

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Usuários e acessos</h1>
          <p className="text-muted">
            {lista.length} usuários · {ativos} ativos
          </p>
        </div>
        <Link href="/usuarios?novo=1" className="flex min-h-11 items-center rounded-[10px] bg-navy px-5 font-bold text-white">
          Novo usuário
        </Link>
      </header>

      {ok && MENSAGENS[ok] ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#DDF0E7] px-4 py-3 font-semibold text-[#17533B]">
          <span>{MENSAGENS[ok]}</span>
          <Link href={selecionado ? `/usuarios?u=${selecionado.id}` : "/usuarios"} className="min-h-11 px-3 py-3 font-bold">
            Fechar
          </Link>
        </div>
      ) : null}
      {erro ? <p role="alert" className="rounded-xl bg-[#FBEDED] px-4 py-3 font-semibold text-[#8A1C1C]">{erro}</p> : null}

      {novo ? <NovoUsuarioForm /> : null}

      <div className="flex flex-wrap items-start gap-5">
        <nav aria-label="Usuários" className="flex min-w-[280px] flex-1 flex-col gap-2">
          {lista.map((x) => {
            const ativo = selecionado?.id === x.id;
            const { rotulo, cor } = situacao(x);
            return (
              <Link
                key={x.id}
                href={`/usuarios?u=${x.id}`}
                aria-current={ativo ? "page" : undefined}
                className={`flex flex-col gap-1 rounded-[14px] border-2 bg-white p-3.5 ${ativo ? "border-navy" : "border-[#E8ECF3]"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-navy">{x.nome}</strong>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PILULA[cor]}`}>{rotulo}</span>
                </span>
                <span className="break-all text-muted">{x.email}</span>
                <span className="text-muted">{x.role === "admin" ? "Todas as telas" : `${x.telas.length} de ${TOTAL_DE_TELAS} telas`}</span>
              </Link>
            );
          })}
        </nav>

        {selecionado ? (
          <section
            aria-label="Permissões"
            className="flex min-w-[320px] flex-[3] flex-col gap-4 rounded-2xl border border-[#E8ECF3] bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[22px] font-extrabold leading-tight text-navy">{selecionado.nome}</h2>
                <p className="break-all text-muted">
                  {selecionado.email} · {selecionado.role === "admin" ? "Administrador" : "Operacional"}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {selecionado.role === "user" ? (
                  <>
                    <Link href={`/usuarios?u=${selecionado.id}&editar=1`} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-navy">
                      Editar nome e e-mail
                    </Link>
                    <RedefinirSenhaBotao id={selecionado.id} />
                    <form action={bloquearAction}>
                      <input type="hidden" name="id" value={selecionado.id} />
                      <input type="hidden" name="bloqueado" value={selecionado.status === "inactive" ? "0" : "1"} />
                      <button type="submit" className="min-h-11 rounded-[10px] border border-[#A32020] bg-white px-3 font-semibold text-[#A32020]">
                        {selecionado.status === "inactive" ? "Desbloquear" : "Bloquear acesso"}
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>

            {editar && selecionado.role === "user" ? (
              <form action={salvarContatoAction} className="flex flex-wrap items-end gap-3 rounded-xl bg-[#F6F8FC] p-3.5">
                <input type="hidden" name="id" value={selecionado.id} />
                <label className="flex min-w-[200px] flex-1 flex-col gap-1 font-semibold">
                  Nome
                  <input name="nome" defaultValue={selecionado.nome} required className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 font-normal" />
                </label>
                <label className="flex min-w-[240px] flex-1 flex-col gap-1 font-semibold">
                  E-mail
                  <input type="email" name="email" defaultValue={selecionado.email} required className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 font-normal" />
                </label>
                <button type="submit" className="min-h-11 rounded-[10px] bg-navy px-4 font-bold text-white">Salvar</button>
                <Link href={`/usuarios?u=${selecionado.id}`} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-navy">
                  Cancelar
                </Link>
              </form>
            ) : null}

            {selecionado.role === "admin" ? (
              <p className="rounded-xl bg-[#F0F3FA] p-3.5">O administrador tem acesso a todas as telas. Este perfil não pode ser restringido nem bloqueado aqui.</p>
            ) : (
              <FormularioTelas id={selecionado.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong aria-live="polite" className="text-navy">
                    {selecionado.telas.length} de {TOTAL_DE_TELAS} telas liberadas
                  </strong>
                  <div role="group" aria-label="Modelos de acesso" className="flex flex-wrap gap-1.5">
                    {MODELOS_DE_ACESSO.map((m) => (
                      <button key={m.chave} type="submit" name="modelo" value={m.chave} className="min-h-11 rounded-full border border-[#D8DEE9] bg-white px-3 text-[13px] font-semibold text-navy">
                        {m.rotulo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {GRUPOS_DE_TELAS.map((g) => {
                    const tudo = g.telas.every((t) => selecionado.telas.includes(t.chave));
                    return (
                      <fieldset key={g.chave} className="flex min-w-0 flex-col gap-0.5 rounded-[14px] border border-[#E8ECF3] p-3">
                        <legend className="px-1.5 font-bold text-navy">{g.rotulo}</legend>
                        <button
                          type="submit"
                          name="grupo"
                          value={`${tudo ? "restringir" : "liberar"}:${g.chave}`}
                          className="min-h-9 w-fit self-start text-[13px] font-semibold text-navy underline"
                        >
                          {tudo ? "Restringir todas" : "Liberar todas"}
                        </button>
                        {g.telas.map((t) => {
                          const liberada = selecionado.telas.includes(t.chave);
                          return (
                            <label key={t.chave} className="flex min-h-11 items-center justify-between gap-3 border-t border-[#F0F3FA]">
                              <span>{t.rotulo}</span>
                              <span className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${liberada ? "text-[#17533B]" : "text-muted"}`}>{liberada ? "Liberada" : "Restrita"}</span>
                                <input type="checkbox" name="tela" value={t.chave} defaultChecked={liberada} className="h-[22px] w-[22px]" />
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                    );
                  })}
                </div>
                <p className="text-muted">Mudanças valem imediatamente. Usuários e acessos é exclusivo do administrador e não pode ser liberado.</p>
              </FormularioTelas>
            )}
          </section>
        ) : (
          <p className="text-muted">Nenhum usuário operacional cadastrado ainda.</p>
        )}
      </div>
    </section>
  );
}
