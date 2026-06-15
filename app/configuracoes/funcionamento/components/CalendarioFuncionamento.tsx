// app/configuracoes/funcionamento/components/CalendarioFuncionamento.tsx
// Orquestrador do calendário de funcionamento - alterna entre views mensal e semanal.
// Exibe uma toolbar personalizada e integra os calendários com FullCalendar.

"use client";

import { CalendarDays } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { Excecao, Horario } from "../types";
import CalendarioMensal, {
  type CalendarioFuncionamentoHandle,
} from "./CalendarioMensal"; // componente para visão mensal
import CalendarioSemanal from "./CalendarioSemanal"; // componente para visão semanal (nome corrigido)
import ToolbarFuncionamento from "./ToolbarFuncionamento";

interface CalendarioFuncionamentoProps {
  horarios: Horario[];
  horariosPontuais?: Horario[];
  excecoes: Excecao[];
  isPsicologo: boolean;
  compacto?: boolean;
  esconderCabecalho?: boolean;
  onCalendarTitleChange?: (title: string) => void;
}

export default function CalendarioFuncionamento({
  horarios,
  horariosPontuais = [],
  excecoes,
  isPsicologo,
  compacto = false,
  esconderCabecalho = false,
  onCalendarTitleChange,
}: CalendarioFuncionamentoProps) {
  // Estado para controlar a visão atual do calendário (mês ou semana)
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">(
    "dayGridMonth",
  );
  // Referência para o calendário ativo (será passada para os filhos via ref)
  const calendarRef = useRef<CalendarioFuncionamentoHandle | null>(null);

  // Handlers para navegação (prev/next/today) – delegam para a API do FullCalendar
  const handlePrev = () => calendarRef.current?.getApi()?.prev();
  const handleNext = () => calendarRef.current?.getApi()?.next();
  const handleToday = () => calendarRef.current?.getApi()?.today();
  // Título dinâmico (mês/ano ou semana) obtido do calendário
  const [title, setTitle] = useState<string>(
    calendarRef.current?.getApi()?.view?.title || "",
  );

  // Sincroniza título inicial e ao trocar de view
  useEffect(() => {
    try {
      const current = calendarRef.current?.getApi()?.view?.title;
      if (current) setTitle(current);
    } catch (e) {
      // ignore
    }
  }, [view]);

  // Notifica o componente pai quando o título do calendário muda
  useEffect(() => {
    if (onCalendarTitleChange) {
      onCalendarTitleChange(title);
    }
  }, [title, onCalendarTitleChange]);

  return (
    <section
      className={
        compacto
          ? "space-y-4"
          : "bg-white rounded-xl border border-[#9F64AF]/20 shadow-sm p-5 mt-8"
      }
    >
      {!esconderCabecalho && (
        <div className={`flex items-center gap-2 ${compacto ? "" : "mb-2"}`}>
          <CalendarDays size={16} className="text-[#9F64AF]" />
          <h4 className="text-sm font-semibold text-gray-800">
            Calendário de funcionamento
          </h4>
        </div>
      )}

      {/* Barra de ferramentas (alternância de visão e navegação) */}
      <div
        className={
          compacto
            ? "rounded-2xl border border-[#9F64AF]/15 bg-white/70 p-4 shadow-sm"
            : ""
        }
      >
        <ToolbarFuncionamento
          view={view}
          onViewChange={setView}
          title={title}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        {/* Renderização condicional conforme a visão selecionada */}
        {view === "dayGridMonth" ? (
          <CalendarioMensal
            ref={calendarRef}
            horarios={horarios}
            horariosPontuais={horariosPontuais}
            excecoes={excecoes}
            isPsicologo={isPsicologo}
          onTitleChange={setTitle}
        />
        ) : (
        <CalendarioSemanal
          ref={calendarRef}
          horarios={horarios}
          horariosPontuais={horariosPontuais}
          excecoes={excecoes}
          isPsicologo={isPsicologo}
          onTitleChange={setTitle}
        />
        )}
      </div>

      {/* Estilos globais para personalização visual dos calendários */}
      <style jsx global>{`
        /* ========== MODO MENSAL ========== */
        .calendar-mensal-neurosync .fc {
          background: transparent;
          border: none;
        }
        .calendar-mensal-neurosync .fc-header-toolbar {
          display: none !important;
        }
        .calendar-mensal-neurosync .fc-theme-standard td,
        .calendar-mensal-neurosync .fc-theme-standard th {
          border: none !important;
          background: transparent;
        }
        .calendar-mensal-neurosync .fc-daygrid-day-frame {
          background: white;
          border-radius: 12px;
          padding: 6px;
          margin: 3px;
          min-height: 80px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .calendar-mensal-neurosync .fc-daygrid-day-frame:hover {
          background: #FAF5FF;
          box-shadow: 0 2px 8px rgba(159,100,175,0.12);
        }
        .calendar-mensal-neurosync .fc-day-today .fc-daygrid-day-frame {
          background: #F9F5FF;
          box-shadow: 0 0 0 2px #9F64AF30;
        }
        .calendar-mensal-neurosync .fc-daygrid-day-number {
          font-size: 0.85rem;
          font-weight: 600;
          color: #4B5563;
          padding: 2px 8px;
        }
        .calendar-mensal-neurosync .fc-day-today .fc-daygrid-day-number {
          color: #9F64AF;
          background: #F3EAF8;
          border-radius: 20px;
        }
        .calendar-mensal-neurosync .fc-day-other .fc-daygrid-day-frame {
          opacity: 0.4;
        }
        .calendar-mensal-neurosync .fc-daygrid-day-events {
          margin-top: 4px;
        }
        .calendar-mensal-neurosync .fc-event {
          border-radius: 6px !important;
          padding: 2px 6px !important;
          font-size: 0.7rem !important;
          border: none !important;
          margin-bottom: 2px !important;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .calendar-mensal-neurosync .fc-event:hover {
          transform: scale(1.02);
        }
        .calendar-mensal-neurosync .fc-daygrid-more-link {
          font-size: 0.7rem;
          color: #9F64AF !important;
          font-weight: 500;
        }
        .calendar-mensal-neurosync .fc-scrollgrid,
        .calendar-mensal-neurosync .fc-scrollgrid-section table,
        .calendar-mensal-neurosync .fc-scrollgrid-section td {
          border: none !important;
        }
        .calendar-mensal-neurosync .fc-col-header-cell {
          border: none !important;
          padding: 8px 0;
          font-weight: 600;
          color: #6B7280;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ========== MODO SEMANAL ========== */
        .calendar-semanal-neurosync .fc {
          background: transparent;
          border: none;
        }
        .calendar-semanal-neurosync .fc-header-toolbar {
          display: none !important;
        }
        .calendar-semanal-neurosync .fc-theme-standard td,
        .calendar-semanal-neurosync .fc-theme-standard th {
          border-color: #F3F4F6 !important;
        }
        .calendar-semanal-neurosync .fc-timegrid-slot {
          border-color: #F9FAFB !important;
        }
        .calendar-semanal-neurosync .fc-timegrid-axis {
          font-size: 0.7rem;
          color: #9CA3AF;
        }
        .calendar-semanal-neurosync .fc-timegrid-now-indicator-line {
          border-color: #9F64AF !important;
        }
        .calendar-semanal-neurosync .fc-timegrid-now-indicator-arrow {
          border-color: #9F64AF !important;
        }
        .calendar-semanal-neurosync .fc-event {
          border-radius: 8px !important;
          padding: 4px 8px !important;
          font-size: 0.8rem !important;
          border: none !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.15s;
        }
        .calendar-semanal-neurosync .fc-event:hover {
          transform: scale(1.01);
        }
      `}</style>
    </section>
  );
}
