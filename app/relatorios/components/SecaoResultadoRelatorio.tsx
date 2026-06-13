"use client";

import type { ReactNode } from "react";

interface SecaoResultadoRelatorioProps {
  titulo: string;
  descricao: string;
  acoes?: ReactNode;
  children: ReactNode;
}

export default function SecaoResultadoRelatorio({
  titulo,
  descricao,
  acoes,
  children,
}: SecaoResultadoRelatorioProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-800 dark:text-[var(--ns-text-primary)]">
            {titulo}
          </h2>
          <p className="text-sm text-slate-600 dark:text-[var(--ns-text-secondary)]">
            {descricao}
          </p>
        </div>
        {acoes ? (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {acoes}
          </div>
        ) : null}
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

