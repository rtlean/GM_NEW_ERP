import "server-only";
import { listarContratosAtivosParaPainel } from "./contratos";
import { listarImoveisParaPainel } from "./imoveis";
import { listarLocadoresParaPainel } from "./locadores";
import { listarLocatariosParaPainel } from "./locatarios";
import { montarPainel, type PainelDeCarteira } from "./dashboard-regras";

/** Lê os cadastros de cada módulo (só leitura) e monta o painel. */
export async function carregarPainel(): Promise<PainelDeCarteira> {
  const [contratos, imoveis, locadores, locatarios] = await Promise.all([
    listarContratosAtivosParaPainel(),
    listarImoveisParaPainel(),
    listarLocadoresParaPainel(),
    listarLocatariosParaPainel(),
  ]);
  return montarPainel({ contratos, imoveis, locadores, locatarios });
}
