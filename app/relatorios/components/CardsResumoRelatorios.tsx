"use client";

import {
  CalendarClock,
  ClipboardList,
  TrendingDown,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { RxGear } from "react-icons/rx";
import type { RelatoriosResumo } from "../types/relatorios.types";

interface CardsResumoRelatoriosProps {
  resumo?: RelatoriosResumo;
  isLoading?: boolean;
  psicologosAtivos?: number;
}

function valorNumerico(valor?: number | null) {
  return Number(valor || 0);
}

export default function CardsResumoRelatorios({
  resumo,
  isLoading = false,
  psicologosAtivos = 0,
}: CardsResumoRelatoriosProps) {
  const cards = [
    {
      label: "Atendimentos no período",
      valor: valorNumerico(resumo?.consultas?.total),
      icon: ClipboardList,
    },
    {
      label: "Faltas",
      valor: `${valorNumerico(resumo?.consultas?.taxa_faltas).toFixed(1)}%`,
      icon: TrendingDown,
    },
    {
      label: "Pacientes ativos",
      valor: valorNumerico(resumo?.pacientes?.ativos),
      icon: Users,
    },
    {
      label: "Pacientes em espera",
      valor: valorNumerico(resumo?.pacientes?.fila_espera),
      icon: UserRoundCheck,
    },
    {
      label: "Consultas futuras",
      valor: valorNumerico(resumo?.agendamentos_futuros),
      icon: CalendarClock,
    },
    {
      label: "Psicólogos ativos",
      valor: valorNumerico(psicologosAtivos),
      icon: Users,
    },
    {
      label: "Tempo médio de acompanhamento",
      valor:
        typeof resumo?.tempo_medio_acompanhamento_dias === "number"
          ? `${valorNumerico(resumo.tempo_medio_acompanhamento_dias)} dias`
          : "—",
      icon: CalendarClock,
    },
  ];

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

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-7">
        {cards.map((card) => {
          return (
            <div key={card.label} className="flex min-w-0 flex-col">
              <p className="text-xs leading-4 text-slate-500 dark:text-[var(--ns-text-secondary)]">
                {card.label}
              </p>
              {isLoading ? (
                <div className="mt-1 h-5 w-16 animate-pulse rounded bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
              ) : (
                <p className="mt-1 text-base font-semibold leading-tight text-slate-900 dark:text-[var(--ns-text-primary)]">
                  {card.valor}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
