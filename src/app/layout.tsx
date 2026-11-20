import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import TopNav from "@/components/TopNav";
import ConteudoPrincipal from "@/components/ConteudoPrincipal";
import { perfilAtual } from "@/lib/acesso";
import { ATALHOS } from "@/lib/menu";
import { atalhosPermitidos, menuPermitido } from "@/lib/permissoes";
import "./globals.css";

// Cada página depende da sessão do usuário: não é gerada antes da hora (e o build não precisa das chaves).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ERP GM Soluções Imobiliárias",
  description: "Gestão de locação da GM Soluções Imobiliárias",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const perfil = await perfilAtual();
  const menu = menuPermitido(perfil);
  const atalhos = atalhosPermitidos(perfil, ATALHOS);
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg font-sans text-[14px] text-navy antialiased">
        <TopNav menu={menu} atalhos={atalhos} />
        <ConteudoPrincipal>{children}</ConteudoPrincipal>
      </body>
    </html>
  );
}
