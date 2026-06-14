// app/configuracoes/funcionamento/components/ToolbarFuncionamento.tsx
// Toolbar personalizada para o calendário de funcionamento.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { LiaCalendarSolid } from "react-icons/lia";
import { PiCalendarDots } from "react-icons/pi";

interface ToolbarFuncionamentoProps {
  view: "dayGridMonth" | "timeGridWeek";
  onViewChange: (view: "dayGridMonth" | "timeGridWeek") => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function ToolbarFuncionamento({
  view,
  onViewChange,
  title,
  onPrev,
  onNext,
  onToday,
}: ToolbarFuncionamentoProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-[#F3EAF8] text-gray-600 hover:text-[#9F64AF] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-[#F3EAF8] text-gray-600 hover:text-[#9F64AF] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="px-3 py-1 text-xs font-medium text-[#9F64AF] bg-[#F3EAF8] hover:bg-[#E1D4F0] rounded-lg transition-colors"
        >
          Hoje
        </button>
        <h3 className="text-base font-semibold text-gray-800 ml-2">{title}</h3>
      </div>

      <div className="flex bg-[#F3EAF8] rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onViewChange("dayGridMonth")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            view === "dayGridMonth"
              ? "bg-white text-[#9F64AF] shadow-sm"
              : "text-gray-600 hover:text-[#9F64AF]"
          }`}
        >
          <LiaCalendarSolid size={15} />
          Mês
        </button>
        <button
          type="button"
          onClick={() => onViewChange("timeGridWeek")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            view === "timeGridWeek"
              ? "bg-white text-[#9F64AF] shadow-sm"
              : "text-gray-600 hover:text-[#9F64AF]"
          }`}
        >
          <PiCalendarDots size={15} />
          Semana
        </button>
      </div>
    </div>
  );
}
