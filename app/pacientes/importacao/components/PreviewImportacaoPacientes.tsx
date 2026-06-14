"use client";

import { AlertCircle, CheckCircle2, CircleSlash } from "lucide-react";
import type {
  LinhaImportacaoPaciente,
  ResultadoLinhaImportacao,
} from "../types/importacaoPacientes.types";

type LinhaPreview = LinhaImportacaoPaciente | ResultadoLinhaImportacao;

interface PreviewImportacaoPacientesProps {
  linhas: LinhaPreview[];
}

function badgeStatus(status: LinhaPreview["status"]) {
  const config = {
    valido: {
      label: "Válido",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    importado: {
      label: "Importado",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    invalido: {
      label: "Inválido",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertCircle,
    },
    duplicado: {
      label: "Duplicado",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: AlertCircle,
    },
    ignorado: {
      label: "Ignorado",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: CircleSlash,
    },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

export default function PreviewImportacaoPacientes({
  linhas,
}: PreviewImportacaoPacientesProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[var(--ns-border)]">
      <div className="max-h-[44vh] overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-[var(--ns-border)]">
          <thead className="sticky top-0 bg-[#F8F3FB] text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)]">
            <tr>
              <th className="px-4 py-3">Linha</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Erros</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
            {linhas.map((linha) => (
              <tr
                key={`${linha.linha}-${linha.nome}-${linha.cpf}`}
                className="align-top"
              >
                <td className="px-4 py-3 text-gray-500 dark:text-[var(--ns-text-secondary)]">
                  {linha.linha}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 dark:text-[var(--ns-text-primary)]">
                    {linha.nome || "Sem nome"}
                  </p>
                  {"email" in linha && linha.email && (
                    <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
                      {linha.email}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-[var(--ns-text-secondary)]">
                  {linha.cpf || "-"}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize dark:text-[var(--ns-text-secondary)]">
                  {"tipo" in linha ? linha.tipo || "-" : "-"}
                </td>
                <td className="px-4 py-3">{badgeStatus(linha.status)}</td>
                <td className="px-4 py-3">
                  {linha.erros.length > 0 ? (
                    <ul className="space-y-1 text-xs text-red-600">
                      {linha.erros.map((erro) => (
                        <li key={erro} className="flex items-start gap-1">
                          <AlertCircle size={13} className="mt-0.5 shrink-0" />
                          <span>{erro}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-400">Sem erros</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
