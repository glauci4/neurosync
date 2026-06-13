import { ChevronLeft, ChevronRight } from "lucide-react";
import { LiaCalendarSolid } from "react-icons/lia";
import { PiCalendarDot, PiCalendarDots } from "react-icons/pi";

export type VisualizacaoAgenda =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay";

interface ToolbarAgendaProps {
  titulo: string;
  hojeLabel: string;
  visualizacao: VisualizacaoAgenda;
  onVisualizacaoChange: (visualizacao: VisualizacaoAgenda) => void;
  onHoje: () => void;
  onAnterior: () => void;
  onProximo: () => void;
  anteriorDesabilitado?: boolean;
}

const visualizacoes = [
  { valor: "dayGridMonth" as const, label: "Mês", icone: LiaCalendarSolid },
  { valor: "timeGridWeek" as const, label: "Semana", icone: PiCalendarDots },
  { valor: "timeGridDay" as const, label: "Dia", icone: PiCalendarDot },
];

export default function ToolbarAgenda({
  titulo,
  hojeLabel,
  visualizacao,
  onVisualizacaoChange,
  onHoje,
  onAnterior,
  onProximo,
  anteriorDesabilitado = false,
}: ToolbarAgendaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onAnterior}
          disabled={anteriorDesabilitado}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#F3EAF8] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600"
          aria-label="Período anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={onProximo}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
          aria-label="Próximo período"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={onHoje}
          className="rounded-lg bg-[#F3EAF8] px-3 py-2 text-xs font-medium text-[#9F64AF] transition-colors hover:bg-[#E1D4F0]"
        >
          {hojeLabel}
        </button>
        <h3 className="ml-2 min-w-36 text-base font-semibold text-gray-800">
          {titulo}
        </h3>
      </div>

      <div className="flex rounded-xl bg-[#F3EAF8] p-1">
        {visualizacoes.map((item) => {
          const Icone = item.icone;
          const ativo = visualizacao === item.valor;

          return (
            <button
              key={item.valor}
              type="button"
              onClick={() => onVisualizacaoChange(item.valor)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                ativo
                  ? "bg-white text-[#9F64AF] shadow-sm"
                  : "text-gray-600 hover:text-[#9F64AF]"
              }`}
            >
              <Icone size={15} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

