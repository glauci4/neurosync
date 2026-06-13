"use client";

import type { LucideIcon } from "lucide-react";
import { ActivitySquare } from "lucide-react";

export interface ResumoOperacionalMetricaRelatorio {
  label: string;
  valor: string | number;
  icon: LucideIcon;
  detalhe?: string;
}

interface ResumoOperacionalRelatorioProps {
  metricas: ResumoOperacionalMetricaRelatorio[];
  isLoading?: boolean;
  vazioMensagem?: string;
}

export default function ResumoOperacionalRelatorio({
  metricas,
  isLoading = false,
  vazioMensagem,
}: ResumoOperacionalRelatorioProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3E8F7] text-[#9F64AF] dark:bg-[var(--ns-surface-soft)]">
          <ActivitySquare size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[var(--ns-text-primary)]">
            Resumo operacional
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Síntese operacional dos principais números conforme os filtros
            aplicados.
          </p>
        </div>
      </div>

      {vazioMensagem ? (
        <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-[#E8DBF2] bg-[#FAF7FC] px-4 py-6 text-center text-sm text-gray-500 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)]">
          <div className="max-w-2xl">
            <p className="font-medium text-gray-700 dark:text-[var(--ns-text-primary)]">
              Selecione um período e aplique filtros para gerar o relatório.
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
              {vazioMensagem}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {metricas.map((metrica) => {
            return (
              <div key={metrica.label} className="flex min-w-0 flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
                  {metrica.label}
                </span>
                {isLoading ? (
                  <div className="h-6 w-20 animate-pulse rounded bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
                ) : (
                  <span className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
                    {metrica.valor}
                  </span>
                )}
                {metrica.detalhe ? (
                  <span className="text-[11px] text-gray-400 dark:text-[var(--ns-text-secondary)]">
                    {metrica.detalhe}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

