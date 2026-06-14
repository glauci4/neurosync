"use client";

import type { LucideIcon } from "lucide-react";
import { ActivitySquare } from "lucide-react";
import type { ReactNode } from "react";

export interface MetricaResumoRelatorio {
  label: string;
  valor: string | number;
  icon: LucideIcon;
  detalhe?: string;
}

interface ResumoOperacionalRelatoriosProps {
  descricao?: string;
  metricas: MetricaResumoRelatorio[];
  isLoading?: boolean;
  acoes?: ReactNode;
}

export default function ResumoOperacionalRelatorios({
  descricao = "Indicadores principais conforme os filtros selecionados.",
  metricas,
  isLoading = false,
  acoes,
}: ResumoOperacionalRelatoriosProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ActivitySquare size={16} className="shrink-0 text-[#9F64AF]" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
              Resumo operacional
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            {descricao}
          </p>
        </div>
        {acoes}
      </div>

      <div className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricas.map((metrica) => (
          <div key={metrica.label} className="flex min-w-0 flex-col">
            <span className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
              {metrica.label}
            </span>
            {isLoading ? (
              <span className="mt-1 h-5 w-14 animate-pulse rounded bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
            ) : (
              <span className="mt-1 truncate font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
                {metrica.valor}
              </span>
            )}
            {metrica.detalhe ? (
              <span className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-[var(--ns-text-secondary)]">
                {metrica.detalhe}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
