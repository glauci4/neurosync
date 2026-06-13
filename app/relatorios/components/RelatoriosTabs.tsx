"use client";

import { BarChart3, CalendarClock, DoorOpen, Users } from "lucide-react";
import type { CategoriaRelatorio } from "../types/relatorios.types";

interface RelatoriosTabsProps {
  value: CategoriaRelatorio;
  onChange: (value: CategoriaRelatorio) => void;
}

const tabs: Array<{
  value: CategoriaRelatorio;
  label: string;
  icon: typeof BarChart3;
}> = [
  { value: "visao_geral", label: "Visão Geral", icon: BarChart3 },
  { value: "agenda", label: "Agenda", icon: CalendarClock },
  { value: "pacientes", label: "Pacientes", icon: Users },
  { value: "salas", label: "Salas", icon: DoorOpen },
];

export default function RelatoriosTabs({
  value,
  onChange,
}: RelatoriosTabsProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex bg-[#E1D4F0] rounded-xl p-1.5 w-fit gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const ativo = value === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                ativo
                  ? "bg-white text-[#9F64AF] shadow-md"
                  : "text-[#9F64AF] hover:bg-white/40"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

