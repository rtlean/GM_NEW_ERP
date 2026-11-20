import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";

// O cadastro de locador agora fica no painel da própria tela de Locadores (layout do design).
export default async function NovoLocadorPage() {
  await exigirAcesso("locadores");
  redirect("/locadores?novo=1");
}
