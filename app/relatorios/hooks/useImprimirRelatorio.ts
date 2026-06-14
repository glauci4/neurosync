"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import type { RelatorioPrintConfig } from "../types/relatorios.types";

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

export function useImprimirRelatorio() {
  const printRef = useRef<HTMLDivElement>(null);
  const [relatorio, setRelatorio] = useState<RelatorioPrintConfig | null>(null);
  const [deveImprimir, setDeveImprimir] = useState(false);

  const imprimir = useReactToPrint({
    contentRef: printRef,
    documentTitle: () =>
      `relatorio-neurosync-${new Date().toISOString().slice(0, 10)}`,
    pageStyle,
  });

  useEffect(() => {
    if (!deveImprimir || !relatorio) return;

    const timeout = window.setTimeout(() => {
      imprimir();
      setDeveImprimir(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [deveImprimir, imprimir, relatorio]);

  function imprimirRelatorio(config: RelatorioPrintConfig) {
    setRelatorio(config);
    setDeveImprimir(true);
  }

  return {
    printRef,
    relatorio,
    imprimirRelatorio,
  };
}
