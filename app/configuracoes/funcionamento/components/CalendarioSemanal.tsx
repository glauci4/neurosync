// app/configuracoes/funcionamento/components/CalendarioSemanal.tsx
// Visualização semanal com cards flutuantes, eventos e clique nos dias.
// Agora com efeito glassmorphism e callback para selecionar data.

"use client";

import type { KeyboardEvent } from "react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Excecao, Horario } from "../types";
import {
  eventosDoDia,
  montarEventosCalendario,
  obterDataLocalISO,
} from "../utils/calendario";
import type { CalendarioFuncionamentoHandle } from "./CalendarioMensal";

interface CalendarioSemanalProps {
  horarios: Horario[];
  horariosPontuais?: Horario[];
  excecoes: Excecao[];
  isPsicologo: boolean;
  onDiaClicado?: (data: string) => void;
}

function obterSemana(dataRef: Date) {
  const data = new Date(dataRef);
  const dia = data.getDay(); // 0 = domingo
  const domingo = new Date(data);
  domingo.setDate(data.getDate() - dia);
  const semana = [];
  for (let i = 0; i < 7; i++) {
    const diaSemana = new Date(domingo);
    diaSemana.setDate(domingo.getDate() + i);
    semana.push(diaSemana);
  }
  return semana;
}

function formatarCabecalho(data: Date): string {
  const dias = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const diaNome = dias[data.getDay()];
  const diaNum = data.getDate().toString().padStart(2, "0");
  const mes = (data.getMonth() + 1).toString().padStart(2, "0");
  return `${diaNome} ${diaNum}/${mes}`;
}

export type CalendarioSemanalHandle = CalendarioFuncionamentoHandle;

const CalendarioSemanal = forwardRef<
  CalendarioFuncionamentoHandle,
  CalendarioSemanalProps
>(({ horariosPontuais = [], excecoes, isPsicologo, onDiaClicado }, ref) => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const semana = useMemo(() => obterSemana(dataAtual), [dataAtual]);
  const eventosCalendario = useMemo(
    () => montarEventosCalendario(horariosPontuais, excecoes),
    [horariosPontuais, excecoes],
  );

  const semanaAnterior = () => {
    const nova = new Date(dataAtual);
    nova.setDate(dataAtual.getDate() - 7);
    setDataAtual(nova);
  };

  const proximaSemana = () => {
    const nova = new Date(dataAtual);
    nova.setDate(dataAtual.getDate() + 7);
    setDataAtual(nova);
  };

  const hoje = () => setDataAtual(new Date());

  useImperativeHandle(ref, () => ({
    getApi: () => ({
      next: proximaSemana,
      prev: semanaAnterior,
      today: hoje,
      gotoDate: (date: Date) => setDataAtual(date),
      view: {
        title:
          dataAtual.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          }) || "",
      },
    }),
    next: proximaSemana,
    prev: semanaAnterior,
    today: hoje,
    gotoDate: (date: Date) => setDataAtual(date),
  }));

  const getEventosDoDia = (data: Date) => {
    return eventosDoDia(eventosCalendario, data);
  };

  const handleDiaClick = (dia: Date) => {
    if (isPsicologo && onDiaClicado) {
      onDiaClicado(obterDataLocalISO(dia));
    }
  };

  const handleDiaKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    dia: Date,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleDiaClick(dia);
  };

  const handleEventoClick = (titulo: string) => {
    if (isPsicologo)
      toast.info(titulo, {
        className: "border-[#9F64AF]/30 bg-[#F3EAF8] text-[#9F64AF]",
      });
  };

  return (
    <div className="calendario-semanal-lista bg-white/60 backdrop-blur-sm rounded-3xl p-6">
      <div className="toolbar">
        <button type="button" onClick={semanaAnterior}>
          ‹
        </button>
        <button type="button" onClick={hoje}>
          Hoje
        </button>
        <button type="button" onClick={proximaSemana}>
          ›
        </button>
      </div>
      <div className="grade-dias">
        {semana.map((dia) => {
          const eventosDia = getEventosDoDia(dia);
          const dataISO = obterDataLocalISO(dia);
          const podeClicarDia = Boolean(isPsicologo && onDiaClicado);
          const hojeDate = new Date();
          const isHoje =
            dia.getDate() === hojeDate.getDate() &&
            dia.getMonth() === hojeDate.getMonth() &&
            dia.getFullYear() === hojeDate.getFullYear();
          return (
            <div
              key={dataISO}
              className={`coluna-dia ${isHoje ? "coluna-hoje" : ""} ${podeClicarDia ? "cursor-pointer" : ""}`}
              {...(podeClicarDia
                ? {
                    onClick: () => handleDiaClick(dia),
                    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) =>
                      handleDiaKeyDown(event, dia),
                    role: "button",
                    tabIndex: 0,
                  }
                : {})}
            >
              <div className="cabecalho-dia">{formatarCabecalho(dia)}</div>
              <div className="eventos-dia">
                {eventosDia.length === 0 ? (
                  <div className="sem-eventos">—</div>
                ) : (
                  eventosDia.map((ev) => (
                    <button
                      type="button"
                      key={ev.id}
                      title={ev.titulo}
                      className="evento-lista"
                      style={{
                        backgroundColor: ev.corBg,
                        color: ev.corTexto,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventoClick(ev.titulo);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        e.stopPropagation();
                        handleEventoClick(ev.titulo);
                      }}
                    >
                      {ev.titulo}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
          .calendario-semanal-lista {
            overflow-x: auto;
            font-family: inherit;
            scrollbar-width: thin;
            scrollbar-color: #d8bee5 transparent;
          }
          .toolbar {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          .toolbar button {
            background: white;
            border: 1px solid rgba(159, 100, 175, 0.18);
            border-radius: 999px;
            padding: 0.35rem 0.95rem;
            font-size: 0.8rem;
            font-weight: 700;
            color: #6f3a82;
            cursor: pointer;
            transition: all 0.2s;
          }
          .toolbar button:hover {
            background: #f3eaf8;
            border-color: #cbb2e3;
          }
          .grade-dias {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.85rem;
            min-width: 640px;
            align-items: stretch;
          }
          .coluna-dia {
            background: white;
            border: 1px solid rgba(159, 100, 175, 0.12);
            border-radius: 18px;
            box-shadow: 0 5px 16px rgba(44, 31, 51, 0.05);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 218px;
          }
          /* Adiciona cursor pointer quando o callback existe e é psicólogo */
          .coluna-dia.cursor-pointer {
            cursor: pointer;
          }
          .coluna-dia:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(159, 100, 175, 0.12);
          }
          .coluna-hoje {
            border: 1px solid #d9bce8;
            background: #fbf7ff;
          }
          .cabecalho-dia {
            background: rgba(243, 234, 248, 0.75);
            padding: 0.75rem 0.3rem;
            text-align: center;
            font-weight: 700;
            font-size: 0.78rem;
            color: #4a3a5e;
            border-bottom: 1px solid #ede5f8;
            pointer-events: none; /* Impede que o clique no cabeçalho tenha comportamento duplicado */
            flex-shrink: 0;
          }
          .coluna-hoje .cabecalho-dia {
            background: #f0e9fe;
            color: #9f64af;
          }
          .eventos-dia {
            padding: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
            min-height: 150px;
            flex: 1;
            justify-content: flex-start;
          }
          .evento-lista {
            border: 0;
            border-radius: 999px;
            padding: 6px 9px;
            font-size: 0.72rem;
            font-weight: 700;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.48);
            line-height: 1.15;
            width: 100%;
            min-height: 30px;
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .evento-lista:hover {
            transform: scale(0.98);
            box-shadow: 0 2px 8px rgba(159, 100, 175, 0.2);
          }
          .sem-eventos {
            text-align: center;
            color: #bbb0cc;
            font-size: 0.8rem;
            padding: 0.5rem 0;
          }
          @media (max-width: 768px) {
            .calendario-semanal-lista {
              padding: 0.9rem;
            }
            .grade-dias {
              min-width: 600px;
              gap: 0.65rem;
            }
            .coluna-dia {
              min-height: 188px;
              border-radius: 15px;
            }
            .cabecalho-dia {
              font-size: 0.7rem;
              padding: 0.5rem 0.2rem;
            }
            .evento-lista {
              font-size: 0.65rem;
              padding: 4px 6px;
            }
          }
        `}</style>
    </div>
  );
});

CalendarioSemanal.displayName = "CalendarioSemanal";
export default CalendarioSemanal;
