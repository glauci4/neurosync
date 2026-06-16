// app/configuracoes/funcionamento/components/CalendarioMensal.tsx
// Calendário mensal com glassmorphism, dias uniformes e notificação lilás ao clicar em feriado.

"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { Excecao, Horario } from "../types";
import {
  eventosParaFullCalendar,
  montarEventosCalendario,
} from "../utils/calendario";

interface CalendarioMensalProps {
  horarios: Horario[];
  horariosPontuais?: Horario[];
  excecoes: Excecao[];
  isPsicologo: boolean;
  onDiaClicado?: (data: string) => void;
  onTitleChange?: (title: string) => void;
}

export interface CalendarioFuncionamentoApi {
  next: () => void;
  prev: () => void;
  today: () => void;
  gotoDate: (date: Date) => void;
  view?: {
    title?: string;
  };
}

export interface CalendarioFuncionamentoHandle {
  getApi: () => CalendarioFuncionamentoApi | undefined;
  next: () => void;
  prev: () => void;
  today: () => void;
  gotoDate: (date: Date) => void;
}

export type CalendarioMensalHandle = CalendarioFuncionamentoHandle;

const CalendarioMensal = forwardRef<
  CalendarioFuncionamentoHandle,
  CalendarioMensalProps
>(({ horarios = [], horariosPontuais = [], excecoes, isPsicologo, onDiaClicado, onTitleChange }, ref) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  useImperativeHandle(ref, () => ({
    getApi: () => {
      const api = calendarRef.current?.getApi();
      if (!api) return undefined;
      return {
        next: () => api.next(),
        prev: () => api.prev(),
        today: () => api.today(),
        gotoDate: (date: Date) => api.gotoDate(date),
        view: {
          title: api.view?.title,
        },
      };
    },
    next: () => calendarRef.current?.getApi()?.next(),
    prev: () => calendarRef.current?.getApi()?.prev(),
    today: () => calendarRef.current?.getApi()?.today(),
    gotoDate: (date: Date) => calendarRef.current?.getApi()?.gotoDate(date),
  }));

  const eventos = useMemo(
    () =>
      eventosParaFullCalendar(
        montarEventosCalendario([...horarios, ...horariosPontuais], excecoes),
      ),
    [horarios, horariosPontuais, excecoes],
  );

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-3 sm:p-5">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        events={eventos}
        eventDidMount={(arg) => {
          arg.el.title = arg.event.title || "";
        }}
        datesSet={(arg) => {
          // Atualiza título no parent quando a vista muda
          try {
            onTitleChange?.(arg.view.title || "");
          } catch (e) {
            // ignore
          }
        }}
        height="auto"
        firstDay={0}
        locale="pt-br"
        dayMaxEvents={3}
        eventDisplay="auto"
        displayEventTime={false}
        stickyHeaderDates={false} // não fixa cabeçalho ao rolar
        dateClick={(info) => {
          if (isPsicologo && onDiaClicado) onDiaClicado(info.dateStr);
        }}
        eventClick={(info) => {
          const props = info.event.extendedProps;
          if (props.tipo === "feriado") {
            toast.info(`${info.event.title}`, {
              description: isPsicologo
                ? "Considere bloquear a agenda neste dia."
                : "Este dia pode impactar a disponibilidade da clínica.",
              className: "border-[#9F64AF]/30 bg-[#F3EAF8] text-[#9F64AF]",
            });
          }
        }}
      />
      <style jsx global>{`
          /* Reset do container do calendário para herdar o glassmorphism */
          .fc {
            background: transparent !important;
            font-family: inherit;
          }
          .fc table,
          .fc .fc-scrollgrid,
          .fc .fc-scrollgrid-section,
          .fc td,
          .fc th,
          .fc .fc-daygrid-day,
          .fc .fc-daygrid-day-frame,
          .fc .fc-col-header-cell {
            border: none !important;
            background: transparent !important;
          }

          /* Cards dos dias */
          .fc .fc-daygrid-day-frame {
            background: white;
            border: 1px solid rgba(159, 100, 175, 0.1);
            border-radius: 16px;
            margin: 5px;
            box-shadow: 0 4px 14px rgba(44, 31, 51, 0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            overflow: hidden;
            height: 112px;
            min-height: 112px;
            display: flex;
            flex-direction: column;
          }
          .fc .fc-daygrid-day-frame:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(159, 100, 175, 0.12);
          }

          /* Número do dia – centralizado */
          .fc .fc-daygrid-day-number {
            float: none !important;
            text-align: center;
            font-size: 0.92rem;
            font-weight: 700;
            padding: 0.65rem 0 0.25rem 0;
            color: #374151;
            background: transparent;
            width: 100%;
            flex-shrink: 0;
          }

          /* Dias de outros meses */
          .fc .fc-day-other .fc-daygrid-day-number {
            color: #7C7284;
          }
          .fc .fc-day-other .fc-daygrid-day-frame {
            opacity: 0.72;
            background: rgba(249, 250, 251, 0.88);
          }

          /* Dia atual */
          .fc .fc-day-today .fc-daygrid-day-frame {
            background: #fbf7ff;
            border: 1px solid #d9bce8 !important;
            box-shadow: inset 0 0 0 1px rgba(159, 100, 175, 0.12), 0 6px 16px rgba(159, 100, 175, 0.12);
          }
          .fc .fc-day-today .fc-daygrid-day-number {
            color: #9F64AF;
            font-weight: 700;
          }

          /* Cabeçalho dos dias */
          .fc .fc-col-header-cell {
            padding: 0 0 1rem 0;
          }
          .fc .fc-col-header-cell-cushion {
            font-weight: 600;
            font-size: 0.78rem;
            letter-spacing: 0;
            color: #4B3F52;
            text-transform: none;
          }

          /* Eventos */
          .fc .fc-daygrid-day-events {
            padding: 0 6px 6px 6px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            flex: 1;
            justify-content: flex-start;
            min-height: 0;
          }
          .fc .fc-daygrid-event {
            border-radius: 999px;
            padding: 2px 8px;
            overflow: hidden;
            border: none;
            margin: 0;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.48);
          }
          .fc .fc-event-main {
            overflow: hidden;
            min-width: 0;
          }
          .fc .fc-event-title {
            font-size: 0.7rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
            display: block;
          }
          /* Eventos com horário: permitir até 2 linhas para exibir horário completo */
          .fc .evento-excecao .fc-event-title,
          .fc .evento-funcionamento .fc-event-title {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: clip;
          }
          .fc .evento-funcionamento {
            background: #F3EAF8 !important;
            color: #5F2D6D !important;
          }
          .fc .evento-feriado {
            background: #EFE3F6 !important;
            color: #6F3A82 !important;
          }
          .fc .evento-ferias {
            background: #ECE9FF !important;
            color: #433082 !important;
          }
          .fc .evento-bloqueio {
            background: #F4EAF2 !important;
            color: #74375F !important;
          }
          .fc .evento-excecao:not(.evento-feriado):not(.evento-ferias):not(.evento-bloqueio) {
            background: #F8E9F3 !important;
            color: #8A3363 !important;
          }
          .fc .fc-daygrid-event:hover {
            transform: scale(0.98);
            filter: brightness(0.97);
          }

          @media (max-width: 768px) {
            .fc .fc-daygrid-day-frame {
              margin: 3px;
              border-radius: 14px;
              height: 86px;
              min-height: 86px;
            }
            .fc .fc-daygrid-day-number {
              padding: 0.42rem 0 0.05rem 0;
              font-size: 0.78rem;
            }
            .fc .fc-daygrid-event {
              padding: 1px 4px;
            }
            .fc .fc-event-title {
              font-size: 0.6rem;
            }
          }
        `}</style>
    </div>
  );
});

CalendarioMensal.displayName = "CalendarioMensal";
export default CalendarioMensal;
