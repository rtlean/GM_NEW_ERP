import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import TopNav from "@/components/TopNav";
import { perfilAtual } from "@/lib/acesso";
import { menuPermitido } from "@/lib/permissoes";
import "./globals.css";

// Cada página depende da sessão do usuário: não é gerada antes da hora (e o build não precisa das chaves).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ERP GM Soluções Imobiliárias",
  description: "Gestão de locação da GM Soluções Imobiliárias",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const menu = menuPermitido(await perfilAtual());
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg font-sans text-[14px] text-navy antialiased">
        <TopNav menu={menu} />
        <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-7">{children}</main>
      </body>
    </html>
  );
}
