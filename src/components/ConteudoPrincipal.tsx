"use client";

import { usePathname } from "next/navigation";

// A tela de login tem layout próprio (painel dividido), então não recebe a faixa de conteúdo do ERP.
export default function ConteudoPrincipal({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/login") return <>{children}</>;
  return <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-7">{children}</main>;
}
