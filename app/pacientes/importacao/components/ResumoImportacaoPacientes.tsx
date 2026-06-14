"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  FileSpreadsheet,
} from "lucide-react";
import type { ResumoImportacaoPacientes as ResumoImportacaoPacientesDados } from "../types/importacaoPacientes.types";

interface ResumoImportacaoPacientesProps {
  resumo: ResumoImportacaoPacientesDados;
}

export default function ResumoImportacaoPacientes({
  resumo,
}: ResumoImportacaoPacientesProps) {
  const itens = [
    {
      label: "Total",
      valor: resumo.total,
      icon: FileSpreadsheet,
      className: "text-[#9F64AF] bg-[#F3EAF8]",
    },
    {
      label: "Importados",
      valor: resumo.importados,
      icon: CheckCircle2,
      className: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Inválidos",
      valor: resumo.invalidos,
      icon: AlertTriangle,
      className: "text-amber-600 bg-amber-50",
    },
    {
      label: "Ignorados",
      valor: resumo.ignorados,
      icon: CircleSlash,
      className: "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {itens.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)]"
          >
            <div
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.className}`}
            >
              <Icon size={17} />
            </div>
            <p className="text-xl font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
              {item.valor}
            </p>
            <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
