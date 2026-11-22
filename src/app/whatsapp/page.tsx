import { exigirAcesso } from "@/lib/acesso";
import { estadoConfiguracaoWhatsApp } from "@/lib/whatsapp";
import { IntegracaoWhatsApp } from "@/components/whatsapp/IntegracaoWhatsApp";

// Integração WhatsApp (layout do design WhatsApp.dc.html). Token e ID ficam no servidor.
export const dynamic = "force-dynamic";

export default async function PaginaWhatsApp() {
  await exigirAcesso("whatsapp");
  return <IntegracaoWhatsApp configurado={estadoConfiguracaoWhatsApp()} />;
}
