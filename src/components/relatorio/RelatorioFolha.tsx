import { formatarReais } from "@/lib/dinheiro";
import { cidadeComUf, dataHoraTexto, rotuloStatus, type LinhaLocatario, type LinhaRateio } from "@/lib/relatorio-regras";
import type { DesempenhoLocador, RelatorioLocador } from "@/lib/relatorio";

// Folha do relatório, layout do design RelatorioPDF.dc.html: cinco páginas A4 paisagem (1123 x 794 px).
// Cada página tem o mesmo cabeçalho (logo, linha dourada, proprietário e cidade). Os números vêm de lib/relatorio.
// A página de Desempenho mostra só o que o sistema calcula; sem regra definida, o item não aparece.
export function RelatorioFolha({ r }: { r: RelatorioLocador }) {
  const mes = competenciaTexto(r.competencia);
  const multas = r.linhas.reduce((s, l) => s + (l.boletoCentavos - l.aluguelCentavos), 0);
  const somaRateio = (k: keyof Pick<LinhaRateio, "aguaCentavos" | "luzCentavos" | "limpezaCentavos" | "outrasCentavos">) => r.rateio.reduce((s, x) => s + x[k], 0);
  const totalPintura = r.linhas.reduce((s, l) => s + l.pinturaCentavos, 0);
  const totalDespesas = r.despesasDoLocador.reduce((s, d) => s + d.valorCentavos, 0);
  const totalPagoAluguel = r.linhas.reduce((s, l) => s + l.pagoAluguelCentavos, 0);
  const totalValorTotal = r.linhas.reduce((s, l) => s + l.totalCentavos, 0);
  const cabecalho = <Cabecalho r={r} />;

  return (
    <div className="area-impressao">
      <style>{ESTILO_FOLHA}</style>

      <section className="pagina">
        <Cabecalho r={r} comFaixa mesExtenso={mesExtenso(r.competencia)} />
        <Tabela
          titulo="Locatários"
          larguras={["3%", "13%", "11%", "6%", "6%", "5%", "5%", "5%", "5%", "5%", "6.5%", "5%", "6%", "6%", "6%", "6%"]}
          colunas={["Nº", "Locatário", "Imóvel", "Valor locação", "Vencimento", "Status", "Seguro imóvel", "Seguro fiança", "Taxa de pintura", "Valor pendência", "Data pagamento", "Total taxas", "Pago aluguel", "Valor total", "Total", "Valor boleto"]}
          linhas={r.linhas.map((l) => [
            l.numero, l.locatario, l.imovel, dinheiro(l.aluguelCentavos), data(l.vencimento), rotuloStatus(l.status),
            dinheiro(l.seguroImovelCentavos), dinheiro(l.seguroFiancaCentavos), dinheiro(l.pinturaCentavos), dinheiro(l.pendenciaCentavos),
            data(l.dataPagamento), dinheiro(l.taxaCentavos), dinheiro(l.pagoAluguelCentavos), dinheiro(l.valorTotalCentavos), dinheiro(l.totalCentavos), dinheiro(l.boletoCentavos),
          ])}
          rodape={[["", "TOTAL", "", dinheiro(r.resumo.totalPrevisto), "", "", dinheiro(0), dinheiro(0), dinheiro(totalPintura), dinheiro(r.resumo.totalPendente), "", dinheiro(r.resumo.totalTaxas), dinheiro(totalPagoAluguel), dinheiro(r.resumo.totalRecebido), dinheiro(totalValorTotal), dinheiro(r.resumo.totalBoleto)]]}
        />
        <div className="campos-linha">
          <Campo rotulo="TOTAL" valor={dinheiro(r.resumo.totalRecebido)} />
          <Campo rotulo="VALOR PENDENTE DO MÊS" valor={dinheiro(r.resumo.totalPendente)} />
          <Campo rotulo="VALOR LÍQUIDO RECEBIDO" valor={dinheiro(r.resumo.totalRecebido)} />
          <Campo rotulo="VALOR BOLETO" valor={dinheiro(r.resumo.totalBoleto)} />
        </div>
      </section>

      <section className="pagina">
        {cabecalho}
        <Tabela
          titulo="Relação de rateio de água, luz, taxa de limpeza"
          larguras={["5%", "25%", "12%", "12%", "12%", "12%", "10%", "12%", "10%"]}
          colunas={["Nº", "Inquilino", "Aluguel", "Água", "Luz", "Taxa de limpeza", "Outras", "Valor pago", "Total"]}
          linhas={r.rateio.map((x) => [x.numero, x.inquilino, dinheiro(x.aluguelCentavos), dinheiro(x.aguaCentavos), dinheiro(x.luzCentavos), dinheiro(x.limpezaCentavos), dinheiro(x.outrasCentavos), dinheiro(x.valorPagoCentavos), dinheiro(x.totalCentavos)])}
          rodape={[["TOTAL", "", dinheiro(r.rateio.reduce((s, x) => s + x.aluguelCentavos, 0)), dinheiro(somaRateio("aguaCentavos")), dinheiro(somaRateio("luzCentavos")), dinheiro(somaRateio("limpezaCentavos")), dinheiro(somaRateio("outrasCentavos")), dinheiro(r.rateio.reduce((s, x) => s + x.valorPagoCentavos, 0)), dinheiro(r.rateio.reduce((s, x) => s + x.totalCentavos, 0))]]}
        />
        <p className="nota">O rateio é cobrado do inquilino à parte do aluguel fixo e entra como arrecadado quando o lançamento do mês está pago.</p>
        <Tabela
          titulo="Pendências detalhadas"
          larguras={["20%", "18%", "11%", "11%", "10%", "11%", "9%", "10%"]}
          colunas={["Inquilino", "Imóvel", "Valor locação", "Vencimento", "Status", "Data pagamento", "Valor pago", "Valor pendente"]}
          linhas={r.pendencias.map((l: LinhaLocatario) => [l.locatario, l.imovel, dinheiro(l.aluguelCentavos), data(l.vencimento), rotuloStatus(l.status), data(l.dataPagamento), dinheiro(l.valorTotalCentavos), dinheiro(l.pendenciaCentavos)])}
          vazio="Nenhuma pendência neste mês."
        />
      </section>

      <section className="pagina">
        {cabecalho}
        <div className="duas-colunas">
          <div className="coluna-largura">
            <h3 className="faixa-cinza verde">RESUMO FINAL – {mes}</h3>
            <div className="lista-campos">
              <Campo rotulo="Total de inquilinos" valor={String(r.resumo.totalInquilinos)} />
              <Campo rotulo="Total adimplentes" valor={String(r.resumo.adimplentes)} />
              <Campo rotulo="Total com pendências" valor={String(r.resumo.comPendencias)} />
              <Campo rotulo="Total recebido pendências" valor={dinheiro(0)} />
              <Campo rotulo="Total geral de pendências no mês" valor={dinheiro(r.resumo.totalPendente)} />
              <Campo rotulo="Total arrecadado aluguel (pago)" valor={dinheiro(totalPagoAluguel)} />
              <Campo rotulo="Total arrecadado seguro imóvel" valor={dinheiro(0)} />
              <Campo rotulo="Total arrecadado seguro fiança" valor={dinheiro(0)} />
              <Campo rotulo="Total arrecadado taxa de pintura" valor={dinheiro(totalPintura)} />
              <Campo rotulo="Total arrecadado água" valor={dinheiro(somaRateio("aguaCentavos"))} />
              <Campo rotulo="Total arrecadado luz" valor={dinheiro(somaRateio("luzCentavos"))} />
              <Campo rotulo="Total arrecadado taxa de limpeza / condomínio" valor={dinheiro(somaRateio("limpezaCentavos"))} />
              <Campo rotulo="Acréscimos (multas) da competência" valor={dinheiro(multas)} />
              <Campo rotulo="Total de locação, água, luz, taxa de limpeza" valor={dinheiro(r.rateio.reduce((s, x) => s + x.aluguelCentavos, 0) + somaRateio("aguaCentavos") + somaRateio("luzCentavos") + somaRateio("limpezaCentavos"))} />
            </div>
          </div>
          <div className="coluna-largura">
            <Tabela
              titulo="Despesa do mês (cobrada do locador)"
              larguras={["60%", "20%", "20%"]}
              colunas={["Descrição", "Data", "Valor"]}
              linhas={r.despesasDoLocador.map((d) => [d.descricao, data(d.data), dinheiro(d.valorCentavos)])}
              rodape={[["TOTAL DESPESA DO MÊS", "", dinheiro(totalDespesas)]]}
              vazio="Nenhuma despesa cobrada do locador neste mês."
            />
            <div className="lista-campos">
              <Campo rotulo="Total de despesa do mês" valor={dinheiro(r.resumo.totalDespesasDoLocador)} />
              <Campo rotulo={`Taxa de administração (${(r.taxaBps / 100).toFixed(2).replace(".", ",")}%)`} valor={dinheiro(r.resumo.totalTaxas)} />
              <Campo rotulo="Valor líquido a repassar" valor={dinheiro(r.resumo.totalAPagar)} />
              <Campo rotulo="Data do repasse" valor={data(r.repasseLiberadoEm)} />
            </div>
          </div>
        </div>
      </section>

      <section className="pagina">
        {cabecalho}
        <h3 className="faixa-cinza">CONTA PARA REPASSE</h3>
        <div className="lista-campos">
          <Campo rotulo="Banco" valor={r.locador.banco ?? "—"} />
          <Campo rotulo="Agência" valor={r.locador.agencia ?? "—"} />
          <Campo rotulo="Conta" valor={r.locador.conta ?? "—"} />
          <Campo rotulo="Chave Pix" valor={r.locador.pix ?? "—"} />
        </div>
      </section>

      <section className="pagina">
        {cabecalho}
        <h2 className="titulo-pagina">DESEMPENHO DAS LOCAÇÕES DO LOCADOR</h2>
        <Desempenho d={r.desempenho} />
      </section>
    </div>
  );
}

function Cabecalho({ r, comFaixa = false, mesExtenso: mes = "" }: { r: RelatorioLocador; comFaixa?: boolean; mesExtenso?: string }) {
  return (
    <header className="cabecalho">
      <div className="linha-cabecalho">
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem estática da pasta public, usada no PDF */}
        <img src="/logo.png" alt="Soluções Imobiliárias" className="logo" />
        {comFaixa ? (
          <>
            <span className="barra-inclinada" />
            <div className="faixa-titulo">
              RELATÓRIO MENSAL DE LOCAÇÃO –{" "}<span className="mes-dourado">{mes}</span>
            </div>
            <span className="barra-inclinada" />
          </>
        ) : null}
      </div>
      <div className="identificacao">
        <div className="bloco-id">
          <span className="rotulo-id">PROPRIETÁRIO:</span>
          <strong className="nome-id">{r.locador.nome}</strong>
        </div>
        <div className="divisor-dourado" />
        <div className="bloco-id">
          <span className="rotulo-id">CIDADE:</span>
          <strong className="nome-id">{cidadeComUf(r.locador.cidade, r.locador.uf)}</strong>
        </div>
      </div>
      {r.conferencia.conferido ? (
        <div className="conferido">
          CONFERIDO{r.conferencia.conferidoPor ? ` por ${r.conferencia.conferidoPor}` : ""}
          {r.conferencia.conferidoEm ? ` em ${dataHoraTexto(r.conferencia.conferidoEm)}` : ""}
        </div>
      ) : null}
    </header>
  );
}

function Desempenho({ d }: { d: DesempenhoLocador }) {
  const maximo = Math.max(1, ...d.meses.flatMap((m) => [m.previsto ?? 0, m.recebido ?? 0]));
  const alturaMax = 150;
  const larguraBarra = 14;
  const grupo = 80;
  const largura = grupo * d.meses.length + 20;
  return (
    <div className="desempenho">
      <div className="coluna-largura">
        <h3 className="faixa-cinza">Evolução da receita (6 meses)</h3>
        <svg role="img" aria-label="Receita prevista e recebida nos seis meses até a competência" viewBox={`0 0 ${largura} 190`} className="grafico">
          {d.meses.map((m, i) => {
            const x = 10 + i * grupo;
            const hP = m.previsto ? Math.round((m.previsto / maximo) * alturaMax) : 0;
            const hR = m.recebido ? Math.round((m.recebido / maximo) * alturaMax) : 0;
            return (
              <g key={m.competencia}>
                <rect x={x} y={alturaMax - hP + 10} width={larguraBarra} height={hP} fill="#DCE6F1" stroke="#8D99AE" />
                <rect x={x + larguraBarra + 4} y={alturaMax - hR + 10} width={larguraBarra} height={hR} fill="#002356" />
                <text x={x} y={alturaMax + 26} fontSize="9" fill="#475467">{competenciaTexto(m.competencia)}</text>
                <text x={x} y={alturaMax - hP + 6} fontSize="8" fill="#475467">{m.previsto === null ? "sem dados" : dinheiro(m.previsto)}</text>
              </g>
            );
          })}
        </svg>
        <p className="nota">Barra clara: previsto. Barra azul: recebido. Mês sem cobrança aparece como &quot;sem dados&quot;.</p>
      </div>

      <div className="coluna-largura">
        <h3 className="faixa-cinza">Ocupação das locações</h3>
        <div className="lista-campos">
          <Campo rotulo="Imóveis ocupados" valor={String(d.imoveisOcupados)} />
          <Campo rotulo="Imóveis vagos" valor={String(d.imoveisTotal - d.imoveisOcupados)} />
          <Campo rotulo="Taxa de ocupação" valor={percentual(d.ocupacaoBps)} />
        </div>
      </div>

      <div className="indicadores">
        <h3 className="faixa-cinza">Indicadores de desempenho</h3>
        <div className="lista-campos">
          <Campo rotulo="Receita atual (recebido no mês)" valor={dinheiro(d.meses[d.meses.length - 1].recebido ?? 0)} />
          <Campo rotulo="Variação em relação ao mês anterior" valor={d.variacaoMesAnteriorBps === null ? "Sem mês anterior para comparação" : percentual(d.variacaoMesAnteriorBps)} />
          <Campo rotulo="Locatários ativos" valor={String(d.locatariosAtivos)} />
          <Campo rotulo="Índice de recebimento" valor={percentual(d.indiceRecebimentoBps)} />
        </div>
      </div>
    </div>
  );
}

function Tabela({ titulo, colunas, larguras, linhas, rodape, vazio }: { titulo: string; colunas: string[]; larguras: string[]; linhas: (string | number)[][]; rodape?: string[][]; vazio?: string }) {
  return (
    <section className="tabela-bloco">
      <h3 className="faixa-cinza">{titulo}</h3>
      <table className="tabela">
        <colgroup>
          {larguras.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 && vazio ? (
            <tr><td colSpan={colunas.length} className="vazio">{vazio}</td></tr>
          ) : null}
          {linhas.map((linha, i) => (
            <tr key={i}>
              {linha.map((celula, j) => (
                <td key={j}>{celula}</td>
              ))}
            </tr>
          ))}
          {(rodape ?? []).map((linha, i) => (
            <tr key={`r${i}`} className="total">
              {linha.map((celula, j) => (
                <td key={j}>{celula}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="campo">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

const ESTILO_FOLHA = `
.area-impressao { display: flex; flex-direction: column; background: #fff; }
.pagina { width: 1123px; height: 794px; box-sizing: border-box; padding: 22px 26px; background: #fff; color: #101828;
  font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.3; display: flex; flex-direction: column; gap: 10px; overflow: hidden;
  page-break-after: always; break-after: page; }
.pagina:last-child { page-break-after: auto; break-after: auto; }
.cabecalho { display: flex; flex-direction: column; gap: 8px; }
.linha-cabecalho { display: flex; align-items: center; gap: 8px; height: 58px; }
.logo { width: 150px; height: 44px; object-fit: contain; flex: 0 0 auto; }
.barra-inclinada { width: 3px; height: 54px; background: #C9A227; transform: skewX(-20deg); flex: 0 0 auto; }
.faixa-titulo { flex: 1 1 auto; height: 54px; display: flex; align-items: center; justify-content: center; background: #1A365D; color: #fff; font: 700 15px Arial, Helvetica, sans-serif; clip-path: polygon(2% 0, 100% 0, 98% 100%, 0 100%); }
.mes-dourado { color: #C9A227; }
.identificacao { display: flex; align-items: stretch; gap: 14px; border: 1px solid #D9D2B5; padding: 5px 8px; }
.bloco-id { flex: 1 1 50%; }
.divisor-dourado { width: 1px; background: #C9A227; }
.rotulo-id { display: block; color: #4F5B72; font-size: 9px; }
.nome-id { font-size: 11px; }
.conferido { font-size: 9px; font-weight: 700; color: #17694A; }
.titulo-pagina { margin: 0; font: 700 14px Arial, Helvetica, sans-serif; color: #002356; }
.faixa-cinza { margin: 0; padding: 4px; background: #DCE6F1; color: #1A365D; font: 700 11px Arial, Helvetica, sans-serif; text-align: center; }
.faixa-cinza.verde { background: #92D050; }
.tabela-bloco { display: flex; flex-direction: column; }
.tabela { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
.tabela th, .tabela td { border: 1px solid #8D99AE; padding: 2px 3px; text-align: left; vertical-align: top; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.tabela th { background: #F6F8FC; color: #1A365D; font-weight: 700; }
.tabela td.vazio { color: #4F5B72; text-align: center; }
.tabela tr.total td { font-weight: 700; background: #D9D9D9; }
.campos-linha { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.campo { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid #E8ECF3; padding: 2px 0; }
.campo span { color: #4F5B72; }
.campo strong { font-variant-numeric: tabular-nums; }
.lista-campos { display: flex; flex-direction: column; }
.nota { margin: 0; color: #4F5B72; font-size: 9px; }
.duas-colunas { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.coluna-largura { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.desempenho { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.grafico { width: 100%; height: 190px; }
.indicadores { grid-column: span 2; display: flex; flex-direction: column; gap: 8px; }
@page { size: A4 landscape; margin: 0; }
@media print { body * { visibility: hidden; } .area-impressao, .area-impressao * { visibility: visible; } .area-impressao { position: absolute; left: 0; top: 0; width: 297mm; } .no-print { display: none !important; } }
`;

function dinheiro(centavos: number): string {
  return formatarReais(centavos).replace("R$ ", "");
}

function percentual(bps: number | null): string {
  if (bps === null) return "—";
  return `${(bps / 100).toFixed(1).replace(".", ",")}%`;
}

function data(iso: string | null): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function competenciaTexto(competencia: string): string {
  const [a, m] = competencia.split("-");
  return `${m}/${a}`;
}

const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

function mesExtenso(competencia: string): string {
  const [a, m] = competencia.split("-");
  return `${MESES[Number(m) - 1]} DE ${a}`;
}
