import { exigirAcesso } from "@/lib/acesso";
import { IntegracaoWhatsApp } from "@/components/whatsapp/IntegracaoWhatsApp";

// Integração WhatsApp (layout do design WhatsApp.dc.html). Nesta fatia não envia nem guarda dados.
export const dynamic = "force-dynamic";

export default async function PaginaWhatsApp() {
  await exigirAcesso("whatsapp");
  return <IntegracaoWhatsApp />;
}
