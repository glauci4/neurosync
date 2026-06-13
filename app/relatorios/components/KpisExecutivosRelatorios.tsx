"use client";

import type { LucideIcon } from "lucide-react";
import { RxGear } from "react-icons/rx";

export interface KpiExecutivoRelatorio {
  label: string;
  valor: string | number;
  icon: LucideIcon;
  detalhe?: string;
}

interface KpisExecutivosRelatoriosProps {
  metricas: KpiExecutivoRelatorio[];
  isLoading?: boolean;
}

export default function KpisExecutivosRelatorios({
  metricas,
  isLoading = false,
}: KpisExecutivosRelatoriosProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex items-center gap-2">
        <RxGear size={16} className="shrink-0 animate-spin text-[#9F64AF]" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Resumo operacional
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Indicadores principais do período selecionado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
        {metricas.map((metrica) => {
          return (
            <div key={metrica.label} className="flex min-w-0 flex-col">
              <p className="text-xs leading-4 text-slate-500 dark:text-[var(--ns-text-secondary)]">
                {metrica.label}
              </p>
              {isLoading ? (
                <div className="mt-1 h-5 w-16 animate-pulse rounded bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
              ) : (
                <p className="mt-1 text-base font-semibold leading-tight text-slate-900 dark:text-[var(--ns-text-primary)]">
                  {metrica.valor}
                </p>
              )}
              {metrica.detalhe ? (
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[var(--ns-text-secondary)]">
                  {metrica.detalhe}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

