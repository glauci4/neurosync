"use client";

import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  type AgendaStatus,
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "../constants/agendaStatusConfig";
import { dataLocalISO, dataLocalMeioDia } from "../utils/datas";
import AgendaEventoCard from "./AgendaEventoCard";
import type { VisualizacaoAgenda } from "./ToolbarAgenda";

export interface ConsultaAgenda {
  id: number;
  paciente_id: number;
  paciente_nome: string;
  psicologo_id: number;
  psicologo_nome: string;
  psicologo_avatar_url?: string | null;
  sala_id: number;
  sala_nome: string;
  status: AgendaStatus;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
  tipo_atendimento:
    | "triagem"
    | "psicoterapia"
    | "devolutiva"
    | "avaliacao"
    | "orientacao"
    | "retorno"
    | "alta"
    | "outro";
  tipo_outro?: string | null;
  observacoes?: string | null;
  fechado_dia?: boolean | number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface CalendarioAgendaHandle {
  next: () => void;
  prev: () => void;
  today: () => void;
  changeView: (view: VisualizacaoAgenda) => void;
  getTitle: () => string;
  getDate: () => Date | null;
}

interface CalendarioAgendaProps {
  consultas: ConsultaAgenda[];
  visualizacao: VisualizacaoAgenda;
  slotMinTime?: string;
  slotMaxTime?: string;
  businessHoursGrade?: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }>;
  bloqueiosGrade?: Array<{
    id: string;
    start: string;
    end: string;
  }>;
  datasSemExpediente?: string[];
  onPeriodoChange: (periodo: { titulo: string; dataReferencia: Date }) => void;
  onSelecionarHorario?: (valores: {
    data_consulta: string;
    horario_inicio?: string;
    horario_fim?: string;
  }) => void;
  onSelecionarConsulta?: (consulta: ConsultaAgenda) => void;
  onSelecionarDiaComConsultas?: (params: {
    data: string;
    consultas: ConsultaAgenda[];
  }) => void;
}

function horaCurta(hora: string) {
  return hora?.slice(0, 5) || "";
}

function dataISO(data?: string) {
  return data ? String(data).slice(0, 10) : "";
}

function horarioCompleto(hora?: string) {
  const valor = horaCurta(String(hora || ""));
  return valor ? `${valor}:00` : "";
}

function extrairDataHora(dataHora: string) {
  const [data, horaCompleta] = dataHora.split("T");
  return {
    data_consulta: data,
    horario_inicio: horaCompleta?.slice(0, 5) || "",
  };
}

function formatarCabecalhoSemana(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
}

function formatarCabecalhoMes(texto: string) {
  const valor = texto.trim().toLowerCase().replace(/\.$/, "");
  return valor ? `${valor}.` : "";
}

const tipoAtendimentoLabel: Record<ConsultaAgenda["tipo_atendimento"], string> =
  {
    triagem: "Triagem",
    psicoterapia: "Psicoterapia",
    devolutiva: "Devolutiva",
    avaliacao: "Avaliação",
    orientacao: "Orientação",
    retorno: "Retorno",
    alta: "Alta",
    outro: "Outro",
  };

function formatarTipoAtendimento(consulta: ConsultaAgenda) {
  if (consulta.tipo_atendimento === "outro" && consulta.tipo_outro) {
    return consulta.tipo_outro;
  }
  return tipoAtendimentoLabel[consulta.tipo_atendimento];
}

const CalendarioAgenda = forwardRef<
  CalendarioAgendaHandle,
  CalendarioAgendaProps
>(
  (
    {
      consultas,
      visualizacao,
      slotMinTime = "07:00:00",
      slotMaxTime = "21:00:00",
      businessHoursGrade = [],
      bloqueiosGrade = [],
      datasSemExpediente = [],
      onPeriodoChange,
      onSelecionarConsulta,
      onSelecionarDiaComConsultas,
    },
    ref,
  ) => {
    const calendarRef = useRef<FullCalendar | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const consultasPorData = useMemo(() => {
      const mapa = new Map<string, ConsultaAgenda[]>();
      for (const consulta of consultas) {
        const dataConsulta = dataISO(consulta.data_consulta);
        const lista = mapa.get(dataConsulta) || [];
        lista.push(consulta);
        mapa.set(dataConsulta, lista);
      }

      for (const lista of mapa.values()) {
        lista.sort((a, b) =>
          `${a.horario_inicio}${a.paciente_nome}`.localeCompare(
            `${b.horario_inicio}${b.paciente_nome}`,
          ),
        );
      }

      return mapa;
    }, [consultas]);

    const datasSemExpedienteSet = useMemo(
      () => new Set(datasSemExpediente),
      [datasSemExpediente],
    );

    useImperativeHandle(ref, () => ({
      next: () => calendarRef.current?.getApi()?.next(),
      prev: () => calendarRef.current?.getApi()?.prev(),
      today: () => calendarRef.current?.getApi()?.today(),
      changeView: (view) => calendarRef.current?.getApi()?.changeView(view),
      getTitle: () => calendarRef.current?.getApi()?.view.title || "",
      getDate: () => calendarRef.current?.getApi()?.getDate() || null,
    }));

    const eventos = useMemo(() => {
      if (visualizacao === "dayGridMonth") {
        return [];
      }

      const eventosConsultas = consultas.map((consulta) => {
        const statusVisual = obterStatusConsultaExibicao(consulta);
        const config = obterAgendaStatusConfig(statusVisual);
        const fechado = Boolean(consulta.fechado_dia);
        const dataConsulta = dataISO(consulta.data_consulta);
        const horarioInicio = horarioCompleto(consulta.horario_inicio);
        const horarioFim = horarioCompleto(consulta.horario_fim);

        return {
          id: String(consulta.id),
          title: `${horaCurta(consulta.horario_inicio)} ${consulta.paciente_nome}`,
          start: `${dataConsulta}T${horarioInicio}`,
          end: `${dataConsulta}T${horarioFim}`,
          backgroundColor: fechado ? "#E5E7EB" : config.corEvento,
          borderColor: "transparent",
          textColor: fechado ? "#6B7280" : "#FFFFFF",
          classNames: [
            "evento-agenda",
            `evento-agenda-${statusVisual}`,
            fechado ? "evento-agenda-fechado" : "",
          ],
          extendedProps: consulta,
        };
      });

      const eventosBloqueio = bloqueiosGrade.map((bloqueio) => {
        const semExpediente = bloqueio.id.startsWith("sem-funcionamento-");
        const classNames = ["evento-agenda-bloqueio-grade"];
        if (semExpediente) {
          classNames.push("evento-agenda-sem-expediente");
        }

        return {
          id: bloqueio.id,
          start: bloqueio.start,
          end: bloqueio.end,
          display: "background",
          backgroundColor: semExpediente
            ? "rgba(107, 114, 128, 0.18)"
            : "rgba(107, 114, 128, 0.12)",
          classNames,
          extendedProps: { tipoBloqueioGrade: true, semExpediente },
        };
      });

      return [...eventosConsultas, ...eventosBloqueio];
    }, [bloqueiosGrade, consultas, visualizacao]);

    const primeiroDiaCalendario = 0;

    const renderizarConsultasDiaMes = useCallback(
      (frame: HTMLElement, dataConsulta: string) => {
        frame.querySelector(".agenda-dia-mes-consultas")?.remove();

        const consultasDia = consultasPorData.get(dataConsulta) || [];
        const consultasVisiveis = consultasDia.slice(0, 2);
        const restantes = consultasDia.length - consultasVisiveis.length;

        if (consultasDia.length === 0) return;

        const lista = document.createElement("div");
        lista.className = "agenda-dia-mes-consultas";

        for (const consulta of consultasVisiveis) {
          const item = document.createElement("div");
          item.className = "agenda-dia-mes-consulta";
          item.title = `${horaCurta(consulta.horario_inicio)} - ${
            consulta.paciente_nome
          } - ${formatarTipoAtendimento(consulta)}`;

          const principal = document.createElement("div");
          principal.className = "agenda-dia-mes-consulta-principal";

          const hora = document.createElement("span");
          hora.className = "agenda-dia-mes-consulta-hora";
          hora.textContent = horaCurta(consulta.horario_inicio);

          const paciente = document.createElement("span");
          paciente.className = "agenda-dia-mes-consulta-paciente";
          paciente.textContent = consulta.paciente_nome;

          const tipo = document.createElement("div");
          tipo.className = "agenda-dia-mes-consulta-tipo";
          tipo.textContent = formatarTipoAtendimento(consulta);

          principal.append(hora, paciente);
          item.append(principal, tipo);
          lista.appendChild(item);
        }

        if (restantes > 0) {
          const mais = document.createElement("div");
          mais.className = "agenda-dia-mes-consulta-mais";
          mais.title = `${consultasDia.length} consultas neste dia`;
          mais.textContent = `+${restantes} consultas`;
          lista.appendChild(mais);
        }

        const eventosNativos = frame.querySelector(".fc-daygrid-day-events");
        frame.insertBefore(lista, eventosNativos);
      },
      [consultasPorData],
    );

    const atualizarConsultasMes = useCallback(() => {
      if (visualizacao !== "dayGridMonth") return;

      const container = containerRef.current;
      if (!container) return;

      container
        .querySelectorAll<HTMLElement>(".fc-daygrid-day[data-date]")
        .forEach((celula) => {
          const dataConsulta = celula.dataset.date;
          const frame = celula.querySelector(".fc-daygrid-day-frame");
          if (!dataConsulta || !(frame instanceof HTMLElement)) return;
          renderizarConsultasDiaMes(frame, dataConsulta);
        });
    }, [renderizarConsultasDiaMes, visualizacao]);

    useEffect(() => {
      const frameId = requestAnimationFrame(atualizarConsultasMes);
      return () => cancelAnimationFrame(frameId);
    }, [atualizarConsultasMes]);

    return (
      <div ref={containerRef} className="rounded-2xl bg-white/55 p-2 sm:p-3">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locales={[ptBrLocale]}
          initialView={visualizacao}
          initialDate={dataLocalMeioDia(new Date())}
          headerToolbar={false}
          events={eventos}
          height="auto"
          contentHeight="auto"
          expandRows
          locale={ptBrLocale}
          firstDay={primeiroDiaCalendario}
          nowIndicator
          dayMaxEvents={4}
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          businessHours={businessHoursGrade}
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          dayHeaderContent={(info) => {
            if (info.view.type === "dayGridMonth") {
              return <span>{formatarCabecalhoMes(info.text)}</span>;
            }

            if (info.view.type === "timeGridWeek") {
              return <span>{formatarCabecalhoSemana(info.date)}</span>;
            }

            return null;
          }}
          dayCellContent={
            visualizacao === "dayGridMonth"
              ? (info) => (
                  <span className="agenda-dia-mes-numero">
                    {info.dayNumberText}
                  </span>
                )
              : undefined
          }
          dayCellDidMount={(info) => {
            if (info.view.type !== "dayGridMonth") return;

            const frame = info.el.querySelector(".fc-daygrid-day-frame");
            if (!(frame instanceof HTMLElement)) return;

            const dataConsulta = dataLocalISO(info.date);
            renderizarConsultasDiaMes(frame, dataConsulta);
          }}
          allDaySlot={false}
          selectable
          selectMirror
          selectAllow={(info) => {
            if (visualizacao !== "timeGridWeek") return true;

            const dataSelecionada = extrairDataHora(
              info.startStr,
            ).data_consulta;
            return !datasSemExpedienteSet.has(dataSelecionada);
          }}
          stickyHeaderDates={false}
          datesSet={(info) =>
            onPeriodoChange({
              titulo: info.view.title,
              dataReferencia: dataLocalMeioDia(info.view.currentStart),
            })
          }
          dateClick={(info) => {
            const valores = extrairDataHora(info.dateStr);
            if (
              info.view.type === "timeGridWeek" &&
              datasSemExpedienteSet.has(valores.data_consulta)
            ) {
              return;
            }

            onSelecionarDiaComConsultas?.({
              data: valores.data_consulta,
              consultas:
                consultasPorData.get(valores.data_consulta)?.slice() || [],
            });
          }}
          select={(info) => {
            const inicio = extrairDataHora(info.startStr);
            if (
              info.view.type === "timeGridWeek" &&
              datasSemExpedienteSet.has(inicio.data_consulta)
            ) {
              return;
            }

            onSelecionarDiaComConsultas?.({
              data: inicio.data_consulta,
              consultas:
                consultasPorData.get(inicio.data_consulta)?.slice() || [],
            });
          }}
          eventContent={(info) => {
            const props = info.event.extendedProps as {
              tipoBloqueioGrade?: boolean;
              tipoResumoDia?: boolean;
            };
            if (props.tipoBloqueioGrade) return null;
            if (props.tipoResumoDia) {
              return (
                <div className="truncate text-left font-semibold">
                  {info.event.title}
                </div>
              );
            }

            const consulta = info.event.extendedProps as ConsultaAgenda;
            const statusVisual = obterStatusConsultaExibicao(consulta);
            const tipoVisualizacao =
              info.view.type === "dayGridMonth"
                ? "mes"
                : info.view.type === "timeGridWeek"
                  ? "semana"
                  : "dia";
            return (
              <AgendaEventoCard
                view={tipoVisualizacao}
                horario={horaCurta(consulta.horario_inicio)}
                paciente={consulta.paciente_nome}
                sala={consulta.sala_nome}
                status={statusVisual}
                tipoAtendimento={
                  tipoVisualizacao === "mes"
                    ? formatarTipoAtendimento(consulta)
                    : undefined
                }
              />
            );
          }}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            const props = info.event.extendedProps as {
              tipoBloqueioGrade?: boolean;
              tipoResumoDia?: boolean;
              data_consulta?: string;
              consultasDia?: ConsultaAgenda[];
            };
            if (props.tipoBloqueioGrade) return;
            if (info.view.type === "dayGridMonth" && props.data_consulta) {
              onSelecionarDiaComConsultas?.({
                data: props.data_consulta,
                consultas:
                  props.consultasDia ||
                  consultasPorData.get(props.data_consulta)?.slice() ||
                  [],
              });
              return;
            }
            onSelecionarConsulta?.(info.event.extendedProps as ConsultaAgenda);
          }}
          eventDidMount={(info) => {
            const props = info.event.extendedProps as {
              tipoBloqueioGrade?: boolean;
              tipoResumoDia?: boolean;
              consultasDia?: ConsultaAgenda[];
            };
            if (props.tipoBloqueioGrade) return;
            if (props.tipoResumoDia) {
              info.el.title = `${props.consultasDia?.length || 0} consultas neste dia`;
              return;
            }
            const consulta = info.event.extendedProps as ConsultaAgenda;
            const config = obterAgendaStatusConfig(
              obterStatusConsultaExibicao(consulta),
            );
            // Tooltip nativo simples para manter o padrão visual sem criar
            // dependência paralela para status da consulta.
            info.el.title = `${config.texto}: ${config.descricao}`;
          }}
        />

        <style jsx global>{`
          .fc {
            background: transparent !important;
            font-family: inherit;
          }
          .fc table {
            table-layout: fixed !important;
            border-collapse: separate !important;
            border-spacing: 6px !important;
            width: 100% !important;
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
          .fc .fc-daygrid-day {
            min-width: 0 !important;
            width: 14.2857% !important;
          }
          .fc .fc-daygrid-body,
          .fc .fc-daygrid-body table {
            width: 100% !important;
          }
          .fc .fc-daygrid-body table {
            height: 720px !important;
          }
          .fc .fc-daygrid-day-frame {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            background: white;
            border: 1px solid rgba(159, 100, 175, 0.1);
            border-radius: 14px;
            margin: 0;
            box-shadow: 0 4px 14px rgba(44, 31, 51, 0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            overflow: hidden;
            padding: 1.7rem 0.5rem 0.25rem;
            height: 116px !important;
            min-height: 116px !important;
            max-height: 116px !important;
            position: relative;
          }
          .fc .fc-daygrid-day-frame:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(159, 100, 175, 0.12);
          }
          .fc .fc-day-today .fc-daygrid-day-frame,
          .fc .fc-timegrid-col.fc-day-today {
            background: #fbf7ff !important;
            border: 1px solid #d9bce8 !important;
            box-shadow: inset 0 0 0 1px rgba(159, 100, 175, 0.12);
          }
          .fc .fc-daygrid-day-number {
            float: none !important;
            display: block;
            text-align: left;
            width: auto;
            padding: 0.58rem 0.62rem 0.25rem;
            color: #374151;
            font-size: 0.92rem;
            font-weight: 700;
          }
          .fc .fc-daygrid-day-top {
            display: flex;
            justify-content: flex-end;
            position: absolute;
            top: 0.58rem;
            right: 0.62rem;
            z-index: 1;
            width: auto;
          }
          .fc .agenda-dia-mes-numero {
            color: #374151;
            font-size: 0.92rem;
            font-weight: 700;
            line-height: 1;
          }
          .fc .agenda-dia-mes-consultas {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            max-height: 100%;
            overflow: hidden;
            margin-top: 0;
          }
          .fc .agenda-dia-mes-consulta {
            box-sizing: border-box;
            display: block;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            flex-shrink: 0;
            overflow: hidden;
            border: 1px solid rgba(159, 100, 175, 0.08);
            border-radius: 6px;
            background: rgba(243, 234, 248, 0.5);
            padding: 0 5px;
            color: #374151;
            font-size: 0.58rem;
            font-weight: 700;
            line-height: 1;
          }
          .fc .agenda-dia-mes-consulta-principal {
            display: flex;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            align-items: center;
            gap: 2px;
            overflow: hidden;
          }
          .fc .agenda-dia-mes-consulta-hora {
            flex-shrink: 0;
          }
          .fc .agenda-dia-mes-consulta-paciente {
            flex: 1 1 auto;
          }
          .fc .agenda-dia-mes-consulta-paciente,
          .fc .agenda-dia-mes-consulta-tipo {
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .fc .agenda-dia-mes-consulta-tipo {
            color: #6b7280;
            font-size: 0.5rem;
            font-weight: 600;
            line-height: 1;
          }
          .fc .agenda-dia-mes-consulta-mais {
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            overflow: hidden;
            padding-left: 1px;
            color: #9f64af;
            font-size: 0.56rem;
            font-weight: 700;
            line-height: 1;
            margin-top: 0;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .fc .fc-col-header-cell {
            padding: 0 0 1rem;
          }
          .fc .fc-col-header-cell-cushion {
            color: #4b3f52;
            font-size: 0.78rem;
            font-weight: 600;
          }
          .fc .fc-daygrid-day-events {
            display: none;
            flex-direction: column;
            gap: 3px;
            align-items: stretch;
            padding: 0;
            min-width: 0;
            overflow: hidden;
          }
          .fc .fc-daygrid-event-harness,
          .fc .fc-event-main {
            min-width: 0;
            max-width: 100%;
          }
          .fc .fc-daygrid-event-harness {
            margin-top: 0 !important;
          }
          .fc .fc-daygrid-event {
            margin: 0 !important;
            width: 100%;
          }
          .fc .fc-daygrid-more-link {
            display: block;
            margin-top: 1px;
            padding-left: 2px;
            color: #9f64af;
            font-size: 0.66rem;
            font-weight: 700;
            text-align: left;
          }
          .fc .evento-agenda {
            border: none !important;
            border-radius: 999px;
            padding: 3px 7px;
            font-size: 0.66rem;
            font-weight: 700;
            line-height: 1.3;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
            transition: transform 0.2s ease, filter 0.2s ease;
            overflow: hidden;
            max-width: 100%;
          }
          .fc .evento-agenda .fc-event-main {
            display: block;
            width: 100%;
          }
          .fc .evento-agenda:hover {
            transform: scale(0.98);
            filter: brightness(0.97);
          }
          .fc .evento-agenda-fechado {
            opacity: 0.72;
            filter: grayscale(0.25);
          }
          .fc .fc-timegrid {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 6px 18px rgba(44, 31, 51, 0.06);
            overflow: hidden;
          }
          .fc .fc-timegrid .fc-scrollgrid {
            border-radius: 16px;
          }
          .fc .fc-timegrid-slot {
            height: 2.75rem;
            border-color: rgba(159, 100, 175, 0.12) !important;
          }
          .fc .fc-timegrid-slot-minor {
            border-color: rgba(159, 100, 175, 0.06) !important;
          }
          .fc .fc-timegrid-axis,
          .fc .fc-timegrid-col {
            border-color: rgba(159, 100, 175, 0.12) !important;
          }
          .fc .fc-timegrid-axis-cushion,
          .fc .fc-timegrid-slot-label-cushion {
            color: #4b5563;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0 0.5rem;
          }
          .fc .fc-timegrid-col-frame {
            background:
              linear-gradient(180deg, rgba(251, 247, 255, 0.72), rgba(255, 255, 255, 0.95));
            min-height: 680px;
          }
          .fc .fc-timegrid-event {
            border-radius: 12px;
            padding: 5px 7px;
            overflow: hidden;
            box-shadow: 0 8px 18px rgba(44, 31, 51, 0.12);
          }
          .fc .fc-timegrid-event.evento-agenda {
            border-radius: 12px;
            padding: 7px 9px;
          }
          .fc .evento-agenda-sem-expediente {
            position: relative;
            pointer-events: none;
            background:
              repeating-linear-gradient(
                135deg,
                rgba(107, 114, 128, 0.14),
                rgba(107, 114, 128, 0.14) 8px,
                rgba(159, 100, 175, 0.08) 8px,
                rgba(159, 100, 175, 0.08) 16px
              ) !important;
            border-left: 1px solid rgba(107, 114, 128, 0.16);
            border-right: 1px solid rgba(107, 114, 128, 0.16);
          }
          .fc .evento-agenda-sem-expediente::after {
            position: absolute;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            border: 1px solid rgba(159, 100, 175, 0.18);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.82);
            color: #6b7280;
            content: "Sem expediente";
            font-size: 0.68rem;
            font-weight: 700;
            padding: 0.22rem 0.58rem;
            white-space: nowrap;
          }
          .fc .fc-timegrid-event .fc-event-main {
            min-width: 0;
            overflow: hidden;
          }
          .fc .fc-timegrid-event .fc-event-main-frame {
            min-height: 0;
          }
          .fc .fc-timegrid-event .fc-event-title,
          .fc .fc-timegrid-event .fc-event-time {
            overflow: hidden;
          }
          .fc .fc-timegrid-event .fc-event-main,
          .fc .fc-timegrid-event .fc-event-main > div {
            height: 100%;
          }
          .fc .fc-timegrid-now-indicator-line {
            border-color: #9f64af !important;
            border-width: 2px !important;
          }
          .fc .fc-timegrid-now-indicator-arrow {
            border-color: #9f64af !important;
          }
          @media (max-width: 768px) {
            .fc table {
              border-spacing: 4px !important;
            }
            .fc .fc-daygrid-day-frame {
              height: 88px !important;
              min-height: 88px !important;
              max-height: 88px !important;
              border-radius: 12px;
              padding: 1.48rem 0.35rem 0.25rem;
            }
            .fc .fc-daygrid-day-number {
              padding: 0.42rem 0.45rem 0.05rem;
              font-size: 0.78rem;
            }
            .fc .fc-daygrid-day-top {
              top: 0.42rem;
              right: 0.45rem;
            }
            .fc .agenda-dia-mes-numero {
              font-size: 0.78rem;
            }
            .fc .agenda-dia-mes-consultas {
              gap: 2px;
            }
            .fc .agenda-dia-mes-consulta {
              border-radius: 6px;
              padding: 1px 3px;
              font-size: 0.52rem;
            }
            .fc .agenda-dia-mes-consulta-tipo,
            .fc .agenda-dia-mes-consulta-mais {
              font-size: 0.5rem;
            }
            .fc .fc-daygrid-body table {
              height: 552px !important;
            }
            .fc .evento-agenda {
              padding: 1px 4px;
              font-size: 0.56rem;
            }
          }
        `}</style>
      </div>
    );
  },
);

CalendarioAgenda.displayName = "CalendarioAgenda";
export default CalendarioAgenda;
