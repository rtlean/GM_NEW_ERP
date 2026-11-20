import { formatarReais } from "@/lib/dinheiro";
import { rotuloStatus, type LinhaLocatario, type LinhaRateio } from "@/lib/relatorio-regras";
import type { RelatorioLocador } from "@/lib/relatorio";

// Folha do relatório, layout do design RelatorioPDF.dc.html (A4 paisagem). Só mostra; os números vêm de lib/relatorio.
// Desempenho das locações fica de fora desta versão (decisão do dono).
export function RelatorioFolha({ r }: { r: RelatorioLocador }) {
  const mes = competenciaTexto(r.competencia);
  const multas = r.linhas.reduce((s, l) => s + (l.boletoCentavos - l.aluguelCentavos), 0);
  const somaRateio = (k: keyof Pick<LinhaRateio, "aguaCentavos" | "luzCentavos" | "limpezaCentavos" | "outrasCentavos">) => r.rateio.reduce((s, x) => s + x[k], 0);
  const totalPintura = r.linhas.reduce((s, l) => s + l.pinturaCentavos, 0);
  const totalDespesas = r.despesasDoLocador.reduce((s, d) => s + d.valorCentavos, 0);
  const pendenciasAcumuladasMes = r.resumo.totalPendente;

  return (
    <div className="area-impressao flex flex-col gap-4 bg-white p-6 text-[11px] leading-tight text-[#0E1B33]">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[#002356] pb-2">
        <div>
          <h2 className="text-[16px] font-extrabold text-navy">RELATÓRIO MENSAL DE LOCAÇÃO – {mes}</h2>
          <div>PROPRIETÁRIO: <strong>{r.locador.nome}</strong></div>
          <div>CIDADE: {r.locador.cidade ?? "—"}{r.locador.documento ? ` · CPF/CNPJ: ${r.locador.documento}` : ""}</div>
        </div>
        <div className="text-right text-[#4F5B72]">Competência {r.competencia}</div>
      </header>

      <Tabela
        titulo="Locatários"
        colunas={["Nº", "Locatário", "Imóvel", "Valor locação", "Vencimento", "Status", "Seguro imóvel", "Seguro fiança", "Taxa de pintura", "Valor pendência", "Data pagamento", "Total taxas", "Pago aluguel", "Valor total", "Total", "Valor boleto"]}
        linhas={r.linhas.map((l) => [
          l.numero, l.locatario, l.imovel, dinheiro(l.aluguelCentavos), data(l.vencimento), rotuloStatus(l.status),
          dinheiro(l.seguroImovelCentavos), dinheiro(l.seguroFiancaCentavos), dinheiro(l.pinturaCentavos), dinheiro(l.pendenciaCentavos),
          data(l.dataPagamento), dinheiro(l.taxaCentavos), dinheiro(l.pagoAluguelCentavos), dinheiro(l.valorTotalCentavos), dinheiro(l.totalCentavos), dinheiro(l.boletoCentavos),
        ])}
        rodape={[
          ["TOTAL", "", "", dinheiro(r.resumo.totalPrevisto), "", "", "0,00", "0,00", dinheiro(totalPintura), dinheiro(r.resumo.totalPendente), "", dinheiro(r.resumo.totalTaxas), dinheiro(r.linhas.reduce((s, l) => s + l.pagoAluguelCentavos, 0)), dinheiro(r.resumo.totalRecebido), dinheiro(r.linhas.reduce((s, l) => s + l.totalCentavos, 0)), dinheiro(r.resumo.totalBoleto)],
        ]}
      />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-4">
        <Campo rotulo="TOTAL" valor={dinheiro(r.resumo.totalRecebido)} />
        <Campo rotulo="VALOR PENDENTE DO MÊS" valor={dinheiro(r.resumo.totalPendente)} />
        <Campo rotulo="VALOR LÍQUIDO RECEBIDO" valor={dinheiro(r.resumo.totalRecebido)} />
        <Campo rotulo="VALOR BOLETO" valor={dinheiro(r.resumo.totalBoleto)} />
      </div>

      <Tabela
        titulo="Relação de rateio de água, luz, taxa de limpeza"
        colunas={["Nº", "Inquilino", "Aluguel", "Água", "Luz", "Taxa de limpeza", "Outras", "Valor pago", "Total"]}
        linhas={r.rateio.map((x) => [x.numero, x.inquilino, dinheiro(x.aluguelCentavos), dinheiro(x.aguaCentavos), dinheiro(x.luzCentavos), dinheiro(x.limpezaCentavos), dinheiro(x.outrasCentavos), dinheiro(x.valorPagoCentavos), dinheiro(x.totalCentavos)])}
        rodape={[["TOTAL", "", dinheiro(r.rateio.reduce((s, x) => s + x.aluguelCentavos, 0)), dinheiro(somaRateio("aguaCentavos")), dinheiro(somaRateio("luzCentavos")), dinheiro(somaRateio("limpezaCentavos")), dinheiro(somaRateio("outrasCentavos")), dinheiro(r.rateio.reduce((s, x) => s + x.valorPagoCentavos, 0)), dinheiro(r.rateio.reduce((s, x) => s + x.totalCentavos, 0))]]}
      />
      <p className="text-[#4F5B72]">O rateio é cobrado do inquilino à parte do aluguel fixo e entra como arrecadado quando o lançamento do mês está pago.</p>

      <Tabela
        titulo="Pendências detalhadas"
        colunas={["Inquilino", "Imóvel", "Valor locação", "Vencimento", "Status", "Data pagamento", "Valor pago", "Valor pendente"]}
        linhas={r.pendencias.map((l: LinhaLocatario) => [l.locatario, l.imovel, dinheiro(l.aluguelCentavos), data(l.vencimento), rotuloStatus(l.status), data(l.dataPagamento), dinheiro(l.valorTotalCentavos), dinheiro(l.pendenciaCentavos)])}
        vazio="Nenhuma pendência neste mês."
      />

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
        <h3 className="col-span-full text-[13px] font-bold text-navy">Resumo final – {mes}</h3>
        <Campo rotulo="Total de inquilinos" valor={String(r.resumo.totalInquilinos)} />
        <Campo rotulo="Total adimplentes" valor={String(r.resumo.adimplentes)} />
        <Campo rotulo="Total com pendências" valor={String(r.resumo.comPendencias)} />
        <Campo rotulo="Total recebido pendências" valor={dinheiro(0)} />
        <Campo rotulo="Total geral de pendências no mês" valor={dinheiro(pendenciasAcumuladasMes)} />
        <Campo rotulo="Total arrecadado aluguel (pago)" valor={dinheiro(r.linhas.reduce((s, l) => s + l.pagoAluguelCentavos, 0))} />
        <Campo rotulo="Total arrecadado seguro imóvel" valor={dinheiro(0)} />
        <Campo rotulo="Total arrecadado seguro fiança" valor={dinheiro(0)} />
        <Campo rotulo="Total arrecadado taxa de pintura" valor={dinheiro(totalPintura)} />
        <Campo rotulo="Total arrecadado água" valor={dinheiro(somaRateio("aguaCentavos"))} />
        <Campo rotulo="Total arrecadado luz" valor={dinheiro(somaRateio("luzCentavos"))} />
        <Campo rotulo="Total arrecadado taxa de limpeza / condomínio" valor={dinheiro(somaRateio("limpezaCentavos"))} />
        <Campo rotulo="Acréscimos (multas) da competência" valor={dinheiro(multas)} />
        <Campo rotulo="Total de locação, água, luz, taxa de limpeza" valor={dinheiro(r.rateio.reduce((s, x) => s + x.aluguelCentavos, 0) + somaRateio("aguaCentavos") + somaRateio("luzCentavos") + somaRateio("limpezaCentavos"))} />
      </section>

      <Tabela
        titulo="Despesa do mês (cobrada do locador)"
        colunas={["Descrição", "Data", "Valor"]}
        linhas={r.despesasDoLocador.map((d) => [d.descricao, data(d.data), dinheiro(d.valorCentavos)])}
        rodape={[["TOTAL DESPESA DO MÊS", "", dinheiro(totalDespesas)]]}
        vazio="Nenhuma despesa cobrada do locador neste mês."
      />

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
        <Campo rotulo="Total de despesa do mês" valor={dinheiro(r.resumo.totalDespesasDoLocador)} />
        <Campo rotulo={`Taxa de administração (${(r.taxaBps / 100).toFixed(2).replace(".", ",")}%)`} valor={dinheiro(r.resumo.totalTaxas)} />
        <Campo rotulo="Valor líquido a repassar" valor={dinheiro(r.resumo.totalAPagar)} />
        <Campo rotulo="Data do repasse" valor={data(r.repasseLiberadoEm)} />
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
        <h3 className="col-span-full text-[13px] font-bold text-navy">Conta para repasse</h3>
        <Campo rotulo="Banco" valor={r.locador.banco ?? "—"} />
        <Campo rotulo="Agência" valor={r.locador.agencia ?? "—"} />
        <Campo rotulo="Conta" valor={r.locador.conta ?? "—"} />
        <Campo rotulo="Chave Pix" valor={r.locador.pix ?? "—"} />
      </section>
    </div>
  );
}

function Tabela({ titulo, colunas, linhas, rodape, vazio }: { titulo: string; colunas: string[]; linhas: (string | number)[][]; rodape?: string[][]; vazio?: string }) {
  return (
    <section className="flex flex-col gap-1 overflow-x-auto">
      <h3 className="text-[12px] font-bold text-navy">{titulo}</h3>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#D8DEE9] bg-[#F6F8FC]">
            {colunas.map((c) => (
              <th key={c} className="px-1.5 py-1 font-semibold text-[#4F5B72]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 && vazio ? (
            <tr><td colSpan={colunas.length} className="px-1.5 py-2 text-[#4F5B72]">{vazio}</td></tr>
          ) : null}
          {linhas.map((linha, i) => (
            <tr key={i} className="border-b border-[#E8ECF3]">
              {linha.map((celula, j) => (
                <td key={j} className="px-1.5 py-1 tabular-nums">{celula}</td>
              ))}
            </tr>
          ))}
          {(rodape ?? []).map((linha, i) => (
            <tr key={`r${i}`} className="font-bold">
              {linha.map((celula, j) => (
                <td key={j} className="px-1.5 py-1 tabular-nums">{celula}</td>
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
    <div className="flex justify-between gap-2 border-b border-[#E8ECF3] py-0.5">
      <span className="text-[#4F5B72]">{rotulo}</span>
      <strong className="tabular-nums">{valor}</strong>
    </div>
  );
}

function dinheiro(centavos: number): string {
  return formatarReais(centavos).replace("R$ ", "");
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
