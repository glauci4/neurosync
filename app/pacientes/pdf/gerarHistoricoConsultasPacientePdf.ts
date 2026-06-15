import { pdf } from "@react-pdf/renderer";
import React from "react";
import HistoricoConsultasPacientePDFDocument from "./HistoricoConsultasPacientePDFDocument";
import type { HistoricoConsultasPacientePrintConfig } from "../types/historicoConsultas";

function nomeArquivo(pacienteNome: string) {
  const slug = pacienteNome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `historico-consultas-${slug || "paciente"}.pdf`;
}

export async function gerarHistoricoConsultasPacientePdf(
  config: HistoricoConsultasPacientePrintConfig,
) {
  const documento = React.createElement(
    HistoricoConsultasPacientePDFDocument,
    config,
  );
  const gerarPdf = pdf as unknown as (doc: React.ReactElement) => {
    toBlob: () => Promise<Blob>;
  };
  const blob = await gerarPdf(documento).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo(config.pacienteNome);
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
