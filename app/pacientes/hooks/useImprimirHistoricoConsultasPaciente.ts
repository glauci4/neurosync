"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import type { HistoricoConsultasPacientePrintConfig } from "../types/historicoConsultas";

const pageStyle = `
  @page {
    size: A4;
    margin: 14mm;
  }

  @media print {
    body {
      background: #ffffff !important;
      color: #1f2937 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

export function useImprimirHistoricoConsultasPaciente() {
  const printRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<HistoricoConsultasPacientePrintConfig | null>(
    null,
  );
  const [deveImprimir, setDeveImprimir] = useState(false);

  const imprimir = useReactToPrint({
    contentRef: printRef,
    documentTitle: () =>
      `historico-consultas-${new Date().toISOString().slice(0, 10)}`,
    pageStyle,
  });

  useEffect(() => {
    if (!deveImprimir || !config) return;

    const timeout = window.setTimeout(async () => {
      imprimir();
      setDeveImprimir(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [config, deveImprimir, imprimir]);

  function imprimirHistorico(novoConfig: HistoricoConsultasPacientePrintConfig) {
    setConfig(novoConfig);
    setDeveImprimir(true);
  }

  return {
    printRef,
    config,
    imprimirHistorico,
  };
}
