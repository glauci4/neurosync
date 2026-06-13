"use client";

import { FileSearch } from "lucide-react";

interface RelatorioEmptyStateProps {
  titulo: string;
  mensagem: string;
  altura?: "compacta" | "media" | "alta";
}

const alturas: Record<
  NonNullable<RelatorioEmptyStateProps["altura"]>,
  string
> = {
  compacta: "min-h-36",
  media: "min-h-52",
  alta: "min-h-64",
};

export default function RelatorioEmptyState({
  titulo,
  mensagem,
  altura = "alta",
}: RelatorioEmptyStateProps) {
  return (
    <div
      className={`flex ${alturas[altura]} items-center justify-center rounded-2xl border border-[#9F64AF]/15 bg-[#F8F3FB] px-4 py-6 text-center dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)]`}
    >
      <div className="max-w-md space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E8F7] text-[#9F64AF]">
          <FileSearch size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-[var(--ns-text-primary)]">
            {titulo}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            {mensagem}
          </p>
        </div>
      </div>
    </div>
  );
}

