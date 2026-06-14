"use client";

import type { ReactNode } from "react";
import ImprimirRelatorioButton from "./ImprimirRelatorioButton";
import MenuAcoesRelatorio from "./MenuAcoesRelatorio";

interface MenuAcoesRelatorioPadraoProps {
  mostrarAcoes?: boolean;
  acaoPdf?: ReactNode;
  onImprimir?: () => void;
  imprimirDesabilitado?: boolean;
  acaoExcel: ReactNode;
}

export default function MenuAcoesRelatorioPadrao({
  mostrarAcoes = true,
  acaoPdf,
  onImprimir,
  imprimirDesabilitado = false,
  acaoExcel,
}: MenuAcoesRelatorioPadraoProps) {
  if (!mostrarAcoes) return null;

  return (
    <MenuAcoesRelatorio>
      {acaoPdf}
      {onImprimir ? (
        <ImprimirRelatorioButton
          onClick={onImprimir}
          disabled={imprimirDesabilitado}
          modo="menu"
        />
      ) : null}
      {acaoExcel}
    </MenuAcoesRelatorio>
  );
}
