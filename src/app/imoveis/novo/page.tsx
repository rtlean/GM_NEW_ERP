import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";

// O cadastro de imóvel agora fica na própria tela de Imóveis (layout do design).
export default async function NovoImovelPage() {
  await exigirAcesso("imoveis");
  redirect("/imoveis?novo=1");
}
