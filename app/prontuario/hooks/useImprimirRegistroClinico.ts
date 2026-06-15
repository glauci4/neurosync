"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import type { RegistroClinico } from "./useProntuario";

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

export function useImprimirRegistroClinico() {
  const printRef = useRef<HTMLDivElement>(null);
  const [registro, setRegistro] = useState<RegistroClinico | null>(null);
  const [deveImprimir, setDeveImprimir] = useState(false);

  const imprimir = useReactToPrint({
    contentRef: printRef,
    documentTitle: () =>
      `registro-clinico-neurosync-${new Date().toISOString().slice(0, 10)}`,
    pageStyle,
  });

  useEffect(() => {
    if (!deveImprimir || !registro) return;

    const timeout = window.setTimeout(async () => {
      const imagens = Array.from(printRef.current?.querySelectorAll("img") || []);
      await Promise.all(
        imagens.map(
          (imagem) =>
            new Promise<void>((resolve) => {
              if (imagem.complete) {
                resolve();
                return;
              }
              imagem.onload = () => resolve();
              imagem.onerror = () => resolve();
            }),
        ),
      );

      imprimir();
      setDeveImprimir(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [deveImprimir, imprimir, registro]);

  function imprimirRegistro(config: RegistroClinico) {
    setRegistro(config);
    setDeveImprimir(true);
  }

  return {
    printRef,
    registro,
    imprimirRegistro,
  };
}
