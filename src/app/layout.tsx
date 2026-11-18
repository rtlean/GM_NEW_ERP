import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import TopNav from "@/components/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP GM Soluções Imobiliárias",
  description: "Gestão de locação da GM Soluções Imobiliárias",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg font-sans text-[14px] text-navy antialiased">
        <TopNav />
        <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-7">{children}</main>
      </body>
    </html>
  );
}
