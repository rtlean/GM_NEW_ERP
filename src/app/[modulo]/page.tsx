import { notFound } from "next/navigation";
import { TODAS_AS_ROTAS } from "@/lib/menu";
import { exigirAcesso } from "@/lib/acesso";

// Página provisória: cada módulo ganha sua pasta própria (ex.: src/app/locadores/page.tsx), que substitui esta.
export function generateStaticParams() {
  return TODAS_AS_ROTAS.map((i) => ({ modulo: i.rota }));
}
export const dynamicParams = false;

export default async function EmConstrucao({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  const item = TODAS_AS_ROTAS.find((i) => i.rota === modulo);
  if (!item) notFound();
  await exigirAcesso(item.rota);
  return (
    <section className="py-6">
      <h1 className="mb-2 text-2xl font-bold">{item.rotulo}</h1>
      <p className="text-muted">Em construção.</p>
    </section>
  );
}
