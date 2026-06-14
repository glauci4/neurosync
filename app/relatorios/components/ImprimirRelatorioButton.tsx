"use client";

import { Printer } from "lucide-react";

interface ImprimirRelatorioButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  modo?: "padrao" | "menu";
}

export default function ImprimirRelatorioButton({
  onClick,
  disabled = false,
  label = "Imprimir",
  modo = "padrao",
}: ImprimirRelatorioButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        modo === "menu"
          ? "inline-flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#9F64AF]/30 bg-[#F3E8F7] px-3 text-xs font-medium text-[#9F64AF] shadow-sm transition hover:bg-[#E1D4F0] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:hover:bg-[#F3E8F7]"
      }
    >
      <Printer size={15} />
      {label}
    </button>
  );
}
