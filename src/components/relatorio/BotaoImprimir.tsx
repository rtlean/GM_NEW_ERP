"use client";

// Baixar PDF: abre a impressão do navegador, já em A4 paisagem (US-5.3).
export function BotaoImprimir({ nomeArquivo }: { nomeArquivo: string }) {
  return (
    <button
      type="button"
      data-nome-arquivo={nomeArquivo}
      onClick={() => {
        const anterior = document.title;
        document.title = nomeArquivo;
        window.print();
        document.title = anterior;
      }}
      className="min-h-11 rounded-[10px] bg-navy px-4 text-[14px] font-bold text-white"
    >
      Baixar PDF
    </button>
  );
}
