"use client";

import { BarChart3, type LucideIcon } from "lucide-react";

interface HeaderRelatorioAtualProps {
  titulo: string;
  descricao: string;
  icone?: LucideIcon;
}

export default function HeaderRelatorioAtual({
  titulo,
  descricao,
  icone: Icone = BarChart3,
}: HeaderRelatorioAtualProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3E8F7] text-[#9F64AF] dark:bg-[var(--ns-surface-soft)]">
            <Icone size={18} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-[var(--ns-text-primary)]">
              {titulo}
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-slate-600 dark:text-[var(--ns-text-secondary)]">
              {descricao}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
