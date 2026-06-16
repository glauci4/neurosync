"use client";

import type { ResumoImportacaoPacientes as ResumoImportacaoPacientesDados } from "../types/importacaoPacientes.types";

interface ResumoImportacaoPacientesProps {
  resumo: ResumoImportacaoPacientesDados;
}

export default function ResumoImportacaoPacientes({
  resumo,
}: ResumoImportacaoPacientesProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-600 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)]">
      Resultado da validação: {resumo.total} linha
      {resumo.total === 1 ? "" : "s"} analisada
      {resumo.total === 1 ? "" : "s"}, {resumo.importados} importada
      {resumo.importados === 1 ? "" : "s"}, {resumo.invalidos} inválida
      {resumo.invalidos === 1 ? "" : "s"} e {resumo.ignorados} ignorada
      {resumo.ignorados === 1 ? "" : "s"}.
    </div>
  );
}
