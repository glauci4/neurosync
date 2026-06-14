"use client";

import { BarChart3, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface HeaderExecutivoRelatoriosProps {
  titulo: string;
  descricao: string;
  icone?: LucideIcon;
  filtros: ReactNode;
  acoes: ReactNode;
}

export default function HeaderExecutivoRelatorios({
  titulo,
  descricao,
  icone: Icone = BarChart3,
  filtros,
  acoes,
}: HeaderExecutivoRelatoriosProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3E8F7] text-[#9F64AF] dark:bg-[var(--ns-surface-soft)]">
              <Icone size={18} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-[var(--ns-text-primary)]">
                {titulo}
              </h1>
              <p className="mt-0.5 max-w-2xl text-sm text-gray-500 dark:text-[var(--ns-text-secondary)]">
                {descricao}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          {acoes}
        </div>
      </div>

      <div>{filtros}</div>
    </div>
  );
}
