import Image from "next/image";
import Link from "next/link";
import { entrar } from "@/lib/autenticacao";
import { CampoSenha } from "@/components/login/CampoSenha";
import { Ilustracao } from "@/components/login/Ilustracao";
import { pedirRedefinicaoAction, primeiroAcessoAction } from "./actions";

// Tela de Entrar no layout do design: painel de apresentação à esquerda e formulário à direita.

const ERROS: Record<string, string> = {
  "1": "E-mail ou senha incorretos.",
  bloqueado: "Acesso bloqueado. Fale com o administrador.",
  "sem-telas": "Seu acesso ainda não tem telas liberadas. Fale com o administrador.",
  provisoria: "E-mail ou senha provisória incorretos.",
  regras: "A nova senha precisa ter 10 caracteres ou mais, com letras e números.",
  "ja-trocada": "Esta conta já escolheu a senha. Use Entrar.",
  falha: "Não foi possível trocar a senha. Tente de novo.",
};

const OKS: Record<string, string> = { "senha-trocada": "Senha alterada. Entre com a nova senha." };
const AVISOS: Record<string, string> = { admin: "Procure o administrador para redefinir sua senha." };

const TITULOS = {
  entrar: ["Entrar", "Acesse o CRM com seu e-mail e senha."],
  esqueci: ["Redefinir senha", "Informe seu e-mail. O administrador faz a redefinição."],
  primeiro: ["Primeiro acesso", "Troque a senha provisória recebida do administrador."],
} as const;

const campo = "min-h-12 rounded-[10px] border border-[#A9B4C6] bg-white px-3.5 text-[15px] text-[#0E1B33]";
const botaoPrincipal = "min-h-12 rounded-[10px] bg-navy text-[15px] font-bold text-white";
const linkAcao = "flex min-h-11 items-center text-sm font-semibold text-navy underline";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; erro?: string; ok?: string; aviso?: string }>;
}) {
  const { modo, erro, ok, aviso } = await searchParams;
  const atual = modo === "esqueci" || modo === "primeiro" ? modo : "entrar";
  const [titulo, subtitulo] = TITULOS[atual];
  const mensagemErro = erro ? (ERROS[erro] ?? ERROS["1"]) : null;

  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      <section aria-hidden="true" className="flex flex-1 flex-col justify-end gap-6 bg-navy p-12 text-white lg:basis-[420px]">
        <Ilustracao />
        <div className="max-w-[480px] text-[40px] font-extrabold leading-[1.12] tracking-tight">Imóveis, contratos e repasses em um só lugar.</div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:basis-[420px]">
        <div className="flex w-full max-w-[400px] flex-col gap-5">
          <Image src="/logo.png" alt="Soluções Imobiliárias" width={210} height={60} priority className="h-auto w-[210px]" />
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight text-navy">{titulo}</h1>
            <p className="mt-1 text-muted">{subtitulo}</p>
          </div>

          {mensagemErro ? (
            <p role="alert" className="rounded-[10px] bg-[#FBEDED] p-3.5 font-semibold text-[#8A1C1C]">{mensagemErro}</p>
          ) : null}
          {ok && OKS[ok] ? <p role="status" className="rounded-[10px] bg-[#DDF0E7] p-3.5 font-semibold text-[#17533B]">{OKS[ok]}</p> : null}
          {aviso && AVISOS[aviso] ? <p role="status" className="rounded-[10px] bg-warn p-3.5 font-semibold text-[#7A4A00]">{AVISOS[aviso]}</p> : null}

          {atual === "entrar" ? (
            <form action={entrar} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 font-semibold">
                E-mail
                <input type="email" name="email" required autoComplete="username" className={campo} />
              </label>
              <label className="flex flex-col gap-1 font-semibold">
                Senha
                <CampoSenha name="senha" autoComplete="current-password" />
              </label>
              <button type="submit" className={botaoPrincipal}>Entrar</button>
              <div className="flex flex-wrap justify-between gap-2">
                <Link href="/login?modo=esqueci" className={linkAcao}>Esqueci minha senha</Link>
                <Link href="/login?modo=primeiro" className={linkAcao}>Primeiro acesso</Link>
              </div>
            </form>
          ) : null}

          {atual === "esqueci" ? (
            <form action={pedirRedefinicaoAction} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 font-semibold">
                E-mail
                <input type="email" name="email" required autoComplete="username" className={campo} />
              </label>
              <button type="submit" className={botaoPrincipal}>Pedir redefinição</button>
              <Link href="/login" className={linkAcao}>Voltar para o login</Link>
            </form>
          ) : null}

          {atual === "primeiro" ? (
            <form action={primeiroAcessoAction} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 font-semibold">
                E-mail
                <input type="email" name="email" required autoComplete="username" className={campo} />
              </label>
              <label className="flex flex-col gap-1 font-semibold">
                Senha provisória
                <input type="password" name="provisoria" required autoComplete="current-password" className={campo} />
              </label>
              <label className="flex flex-col gap-1 font-semibold">
                Nova senha
                <input type="password" name="nova" required autoComplete="new-password" className={campo} />
              </label>
              <p className="text-muted">Use ao menos 10 caracteres, somente letras e números, com pelo menos um de cada.</p>
              <button type="submit" className={botaoPrincipal}>Salvar nova senha</button>
              <Link href="/login" className={linkAcao}>Voltar para o login</Link>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
