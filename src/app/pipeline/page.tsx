import { exigirAcesso } from "@/lib/acesso";
import { listarNegocios } from "@/lib/pipeline";
import { PipelineKanban } from "@/components/pipeline/PipelineKanban";

// Pipeline (US-P.1), layout do design Pipeline.dc.html. Tela exclusiva do dono (admin).
export const dynamic = "force-dynamic";

export default async function PaginaPipeline() {
  await exigirAcesso("pipeline");
  const negocios = await listarNegocios();
  return <PipelineKanban negocios={negocios} />;
}
