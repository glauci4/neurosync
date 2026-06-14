"use client";

import type { LucideIcon } from "lucide-react";

interface SecaoClinicaProps {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  children: React.ReactNode;
  acaoLabel?: string;
  onAcao?: () => void;
  disabled?: boolean;
}

export default function SecaoClinica({
  titulo,
  descricao,
  icone: Icone,
  children,
  acaoLabel,
  onAcao,
  disabled = false,
}: SecaoClinicaProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
            <Icone size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">{descricao}</p>
          </div>
        </div>

        {acaoLabel && onAcao ? (
          <button
            type="button"
            onClick={onAcao}
            disabled={disabled}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {acaoLabel}
          </button>
        ) : null}
      </div>

      {children}
    </section>
  );
}
