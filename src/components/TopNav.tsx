"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU, grupoDoCaminho } from "@/lib/menu";
import { sair } from "@/lib/autenticacao";

export default function TopNav() {
  const caminho = usePathname();
  const grupo = grupoDoCaminho(caminho);

  // Tela de login não mostra o menu.
  if (caminho === "/login") return null;

  return (
    <header className="bg-white shadow-[0_1px_0_var(--line),0_6px_20px_rgba(0,35,86,.05)]">
      <div className="mx-auto flex max-w-[1320px] items-center gap-5 px-4 py-2.5 sm:px-7">
        <Link href="/dashboard" className="shrink-0">
          <Image src="/logo.png" alt="Soluções Imobiliárias, ir para o Dashboard" width={150} height={43} priority className="h-auto w-[110px] sm:w-[150px]" />
        </Link>
        <nav aria-label="Principal" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {MENU.map((g) => {
            const ativo = g === grupo;
            return (
              <Link
                key={g.rotulo}
                href={`/${g.itens[0].rota}`}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center rounded-full px-3.5 ${ativo ? "bg-navy font-bold text-white" : "font-medium text-navy"}`}
              >
                {g.rotulo}
              </Link>
            );
          })}
        </nav>
        <form action={sair}><button type="submit" className="flex min-h-11 items-center px-1.5 font-semibold text-navy">Sair</button></form>
      </div>
      {grupo && grupo.itens.length > 1 && (
        <nav aria-label={grupo.rotulo} className="border-t border-line">
          <div className="mx-auto flex max-w-[1320px] gap-0.5 overflow-x-auto px-4 sm:px-7">
            {grupo.itens.map((i) => {
              const ativo = caminho === `/${i.rota}` || caminho.startsWith(`/${i.rota}/`);
              return (
                <Link
                  key={i.rota}
                  href={`/${i.rota}`}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-11 shrink-0 items-center border-b-[3px] px-3 ${ativo ? "border-gold font-bold text-navy" : "border-transparent font-medium text-muted"}`}
                >
                  {i.rotulo}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
