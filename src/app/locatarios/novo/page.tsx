import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";

// O cadastro de locatário fica no painel da própria tela de Locatários (layout do design).
export default async function NovoLocatarioPage() {
  await exigirAcesso("locatarios");
  redirect("/locatarios?novo=1");
}
