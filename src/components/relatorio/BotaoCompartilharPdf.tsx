"use client";

import { useState } from "react";

// Compartilhar PDF (US-5.4): gera o PDF do relatório no próprio navegador e abre a
// janela de compartilhamento do aparelho com o arquivo anexado (WhatsApp, e-mail etc.).
// Se o aparelho não permitir anexar, baixa o PDF e oferece os links de e-mail e WhatsApp com a mensagem pronta.

type Props = {
  alvoId: string;
  nomeArquivo: string;
  assunto: string;
  texto: string;
};

// Tipo mínimo do encadeamento da html2pdf.js (ela não traz tipos próprios).
type Trabalho = {
  set: (opcoes: Record<string, unknown>) => Trabalho;
  from: (elemento: HTMLElement) => Trabalho;
  toPdf: () => Trabalho;
  output: (tipo: "blob") => Promise<Blob>;
};

async function gerarPdf(alvoId: string, nomeArquivo: string): Promise<Blob> {
  const elemento = document.getElementById(alvoId);
  if (!elemento) throw new Error("Relatório não encontrado na tela.");
  const modulo = await import("html2pdf.js");
  const trabalho: Trabalho = modulo.default();
  return trabalho
    .set({
      margin: 0,
      filename: `${nomeArquivo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "px", format: [1123, 794], orientation: "landscape" },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(elemento)
    .toPdf()
    .output("blob");
}

export function BotaoCompartilharPdf({ alvoId, nomeArquivo, assunto, texto }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [linksManuais, setLinksManuais] = useState(false);

  async function compartilhar() {
    setOcupado(true);
    setAviso(null);
    setLinksManuais(false);
    try {
      const blob = await gerarPdf(alvoId, nomeArquivo);
      const arquivo = new File([blob], `${nomeArquivo}.pdf`, { type: "application/pdf" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: assunto, text: texto });
        return;
      }

      // Plano B: baixa o PDF e deixa os links prontos para anexar manualmente.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nomeArquivo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setLinksManuais(true);
      setAviso("Este aparelho não anexa o PDF automaticamente. O arquivo foi baixado: abra o e-mail ou o WhatsApp e anexe-o.");
    } catch (erro) {
      // Quando a pessoa fecha a janela de compartilhamento, não é erro.
      if (erro instanceof DOMException && erro.name === "AbortError") return;
      setAviso("Não foi possível gerar o PDF agora. Tente de novo ou use o Baixar PDF.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="no-print flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={compartilhar}
        disabled={ocupado}
        className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-semibold text-navy disabled:opacity-60"
      >
        {ocupado ? "Gerando PDF..." : "Compartilhar PDF"}
      </button>
      {aviso ? <p role="status" className="max-w-[420px] text-right text-[13px] text-muted">{aviso}</p> : null}
      {linksManuais ? (
        <div className="flex gap-2">
          <a href={`mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-semibold text-navy">
            Abrir e-mail
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-semibold text-navy">
            Abrir WhatsApp
          </a>
        </div>
      ) : null}
    </div>
  );
}
