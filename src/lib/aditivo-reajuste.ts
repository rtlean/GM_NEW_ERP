import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { obterClienteServidor } from "./supabase/server";
import { listarContratosParaReajuste } from "./contratos";
import { buscarReajusteAgendado, type ReajusteAgendado } from "./reajustes";
import { buscarLocatario } from "./locatarios";
import { listarImoveisParaSelecao } from "./imoveis";
import { buscarLocadorParaEdicao } from "./locadores-cadastro";
import { documentoAtual } from "./contratos-documentos";
import { caminhoDocumento, TIPOS } from "./contratos-documentos-regras";
import { LOGO_SOLUCOES_PNG_BASE64 } from "./aditivo-logo";
import { lerObservacaoReajuste, montarLinhasAditivo, type LinhaAditivo } from "./aditivo-reajuste-regras";

// Aditivo de reajuste em PDF (US-4.7). Guardado como nova versão em contract_documents (bucket privado).
// Nunca apaga nada. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;
const BUCKET = "contract-documents";

export type ResultadoAditivo = { ok: true; versao: number } | { ok: false; erro: string };

/** Gera o aditivo do reajuste agendado e guarda como nova versão do contrato. */
export async function gerarAditivoReajuste(params: { contratoId: number; dataEfetiva: string; usuarioId: number }): Promise<ResultadoAditivo> {
  const { contratoId, dataEfetiva, usuarioId } = params;
  const reajuste = await buscarReajusteAgendado(contratoId, dataEfetiva);
  if (!reajuste) return { ok: false, erro: "Reajuste agendado não encontrado." };
  const indice = lerObservacaoReajuste(reajuste.observacao);
  if (!indice) return { ok: false, erro: "Este lançamento não é um reajuste pelo índice." };

  const dados = await montarDados(contratoId, reajuste);
  if (typeof dados === "string") return { ok: false, erro: dados };

  const linhas = montarLinhasAditivo({ ...dados, indice: indice.indice, percentual: indice.percentual, dataEfetiva });
  const bytes = await montarPdf(linhas);

  const db = obterClienteServidor();
  const anterior = await documentoAtual(contratoId);
  const versao = anterior ? anterior.versao + 1 : 1;
  const nomeArquivo = `Aditivo reajuste ${dataEfetiva}.pdf`;
  const chave = caminhoDocumento(EMPRESA_ID, contratoId, versao, nomeArquivo, "pdf");

  const { error: erroEnvio } = await db.storage.from(BUCKET).upload(chave, bytes, { contentType: TIPOS.pdf.mime, upsert: false });
  if (erroEnvio) return { ok: false, erro: "Não foi possível guardar o aditivo. Tente de novo." };

  const { error: erroRegistro } = await db.from("contract_documents").insert({
    company_id: EMPRESA_ID,
    contract_id: contratoId,
    file_name: nomeArquivo,
    mime_type: TIPOS.pdf.mime,
    storage_key: chave,
    storage_url: `/api/contratos/${contratoId}/arquivo`,
    version: versao,
    created_by: usuarioId,
    updated_by: usuarioId,
  });
  if (erroRegistro) {
    await db.storage.from(BUCKET).remove([chave]);
    return { ok: false, erro: "Não foi possível registrar o aditivo. Tente de novo." };
  }

  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "contract",
    entity_id: contratoId,
    action: "contract.addendum_generated",
    metadata: JSON.stringify({ versao, dataEfetiva, indice: indice.indice, percentual: indice.percentual, arquivo: nomeArquivo }),
  };
  // Se a auditoria falhar duas vezes, o aditivo fica guardado e a tela avisa. Nada é apagado.
  const primeira = await db.from("audit_events").insert(evento);
  if (primeira.error) {
    const segunda = await db.from("audit_events").insert(evento);
    if (segunda.error) return { ok: true, versao };
  }
  return { ok: true, versao };
}

async function montarDados(contratoId: number, reajuste: ReajusteAgendado) {
  const contrato = (await listarContratosParaReajuste()).find((c) => c.id === contratoId);
  if (!contrato) return "Contrato ativo não encontrado.";

  const [locatario, imoveis] = await Promise.all([buscarLocatario(contrato.tenantId), listarImoveisParaSelecao()]);
  const imovel = imoveis.find((i) => i.id === contrato.propertyId);
  if (!locatario) return "Locatário não encontrado.";
  if (!imovel) return "Imóvel do contrato não encontrado.";
  if (imovel.ownerId == null) return "O imóvel não tem locador vinculado.";
  const locador = await buscarLocadorParaEdicao(imovel.ownerId);
  if (!locador) return "Locador não encontrado.";

  if (!locador.document) return "Cadastre o CPF/CNPJ do locador antes de gerar o aditivo.";
  if (!locatario.document) return "Cadastre o CPF/CNPJ do locatário antes de gerar o aditivo.";

  return {
    contratoId,
    locadorNome: locador.full_name,
    locadorDocumento: locador.document,
    locatarioNome: locatario.full_name,
    locatarioDocumento: locatario.document,
    imovel: `${imovel.tipo ?? "Imóvel"} ${imovel.codigo ?? ""}, ${imovel.endereco ?? ""}`.replace(/\s+/g, " ").trim(),
    anteriorCentavos: reajuste.anteriorCentavos,
    novoCentavos: reajuste.novoCentavos,
  };
}

const A4: [number, number] = [595.28, 841.89];
const MARGEM = 64;
const LARGURA_TEXTO = A4[0] - MARGEM * 2;

/** Quebra o texto em linhas que cabem na largura. */
function quebrar(texto: string, fonte: PDFFont, tamanho: number): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (fonte.widthOfTextAtSize(teste, tamanho) > LARGURA_TEXTO && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

async function montarPdf(linhas: LinhaAditivo[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(Buffer.from(LOGO_SOLUCOES_PNG_BASE64, "base64"));

  let pagina: PDFPage = pdf.addPage(A4);
  let y = A4[1] - MARGEM;
  const cor = rgb(0, 0.137, 0.337);

  pagina.drawImage(logo, { x: MARGEM, y: y - 50, width: 168 * 0.8, height: 63 * 0.8 });
  y -= 50 + 28;

  const novaPaginaSeNecessario = (altura: number) => {
    if (y - altura < MARGEM) {
      pagina = pdf.addPage(A4);
      y = A4[1] - MARGEM;
    }
  };

  for (const l of linhas) {
    if (l.tipo === "espaco") {
      y -= 10;
      continue;
    }
    if (l.tipo === "assinatura") {
      novaPaginaSeNecessario(60);
      pagina.drawLine({ start: { x: MARGEM, y: y - 30 }, end: { x: MARGEM + 260, y: y - 30 }, thickness: 0.6, color: cor });
      pagina.drawText(l.texto, { x: MARGEM, y: y - 44, size: 10, font: normal, color: cor });
      y -= 64;
      continue;
    }
    const fonte = l.tipo === "titulo" || l.tipo === "destaque" ? negrito : normal;
    const tamanho = l.tipo === "titulo" ? 14 : 11;
    const alinhamento = l.tipo === "titulo" ? "centro" : "esquerda";
    for (const parte of quebrar(l.texto, fonte, tamanho)) {
      novaPaginaSeNecessario(tamanho + 6);
      const largura = fonte.widthOfTextAtSize(parte, tamanho);
      const x = alinhamento === "centro" ? (A4[0] - largura) / 2 : MARGEM;
      pagina.drawText(parte, { x, y: y - tamanho, size: tamanho, font: fonte, color: rgb(0.055, 0.106, 0.2) });
      y -= tamanho + 6;
    }
    y -= 4;
  }
  return pdf.save();
}
