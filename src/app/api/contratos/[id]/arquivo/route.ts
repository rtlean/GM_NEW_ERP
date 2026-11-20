import { telaLiberada } from "@/lib/acesso";
import { baixarDocumentoAtual } from "@/lib/contratos-documentos";

// Entrega o arquivo atual do contrato (PDF ou Word) só para quem está logado e tem a tela de contratos.
// Não expõe a chave do Storage: o servidor lê o arquivo e envia os bytes.
export const dynamic = "force-dynamic";

export async function GET(_pedido: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await telaLiberada("contratos"))) return new Response("Não autorizado.", { status: 401 });

  const { id } = await params;
  const contratoId = Number(id);
  if (!Number.isInteger(contratoId) || contratoId <= 0) return new Response("Não encontrado.", { status: 404 });

  const arquivo = await baixarDocumentoAtual(contratoId);
  if (!arquivo) return new Response("Este contrato ainda não tem arquivo.", { status: 404 });

  const nome = arquivo.documento.nomeArquivo;
  return new Response(new Blob([arquivo.bytes as BlobPart], { type: arquivo.documento.tipo === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
