"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CalendarPlus,
  Clock,
  FileText,
  MapPin,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendarRange } from "react-icons/lu";
import {
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "../constants/agendaStatusConfig";
import type { ConsultaAgenda } from "./CalendarioAgenda";

interface ModalConsultasDiaProps {
  aberto: boolean;
  data: string;
  consultas: ConsultaAgenda[];
  onClose: () => void;
  atalhosBloqueados?: boolean;
  onSelecionarConsulta: (consulta: ConsultaAgenda) => void;
  onNovaConsulta: (data: string) => void;
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

function horaCurta(hora: string) {
  return hora?.slice(0, 5) || "";
}

function formatarData(data: string) {
  const date = new Date(`${data}T00:00:00`);
  if (Number.isNaN(date.getTime())) return data;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatarTipoAtendimento(consulta: ConsultaAgenda) {
  if (consulta.tipo_atendimento === "outro" && consulta.tipo_outro) {
    return consulta.tipo_outro;
  }
  return tipoAtendimentoLabel[consulta.tipo_atendimento];
}

export default function ModalConsultasDia({
  aberto,
  data,
  consultas,
  onClose,
  atalhosBloqueados = false,
  onSelecionarConsulta,
  onNovaConsulta,
}: ModalConsultasDiaProps) {
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto || atalhosBloqueados) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, atalhosBloqueados, onClose]);

  const consultasOrdenadas = useMemo(
    () =>
      [...consultas].sort((a, b) =>
        `${a.horario_inicio}${a.paciente_nome}`.localeCompare(
          `${b.horario_inicio}${b.paciente_nome}`,
        ),
      ),
    [consultas],
  );

  if (!aberto || !montado) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.section
        initial={{ y: 18, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/20 bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar consultas do dia"
        >
          <X size={20} />
        </button>

        <div className="border-[#9F64AF]/10 border-b px-6 pt-6 pb-5 pr-14">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
              <LuCalendarRange size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-800">
                Consultas do dia
              </h2>
              <p className="mt-1 text-sm text-gray-500 capitalize">
                {formatarData(data)}
              </p>
            </div>
          </div>

        </div>

        <div className="agenda-consultas-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {consultasOrdenadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9BCE8] bg-[#FBF7FF] px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#9F64AF]">
                <CalendarClock size={22} />
              </span>
              <p className="mt-4 text-sm font-medium text-gray-700">
                Nenhuma consulta agendada para esta data.
              </p>
              <button
                type="button"
                onClick={() => onNovaConsulta(data)}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F64AF] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B]"
              >
                <CalendarPlus size={16} />
                Nova consulta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {consultasOrdenadas.map((consulta) => {
                const config = obterAgendaStatusConfig(
                  obterStatusConsultaExibicao(consulta),
                );
                const IconeStatus = config.icone;
                return (
                  <button
                    type="button"
                    key={consulta.id}
                    onClick={() => onSelecionarConsulta(consulta)}
                    className="w-full rounded-2xl border border-[#9F64AF]/10 bg-white/80 p-4 text-left transition hover:border-[#9F64AF]/30 hover:bg-[#FBF7FF] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9BCE8] bg-[#F3EAF8] px-3 py-1 text-xs font-semibold text-[#5F2D6D]">
                            <Clock size={13} />
                            {horaCurta(consulta.horario_inicio)} às{" "}
                            {horaCurta(consulta.horario_fim)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.badge}`}
                            title={config.descricao}
                          >
                            <IconeStatus size={13} />
                            {config.texto}
                          </span>
                        </div>
                        <p className="mt-3 truncate text-sm font-semibold text-gray-800">
                          {consulta.paciente_nome}
                        </p>
                        <div className="mt-2 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <User
                              size={13}
                              className="shrink-0 text-[#9F64AF]"
                            />
                            <span className="truncate">
                              {consulta.psicologo_nome}
                            </span>
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin
                              size={13}
                              className="shrink-0 text-[#9F64AF]"
                            />
                            <span className="truncate">
                              {consulta.sala_nome}
                            </span>
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2">
                            <FileText
                              size={13}
                              className="shrink-0 text-[#9F64AF]"
                            />
                            <span className="truncate">
                              {formatarTipoAtendimento(consulta)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <style jsx global>{`
          .agenda-consultas-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(159, 100, 175, 0.45) transparent;
          }
          .agenda-consultas-scroll::-webkit-scrollbar {
            width: 7px;
          }
          .agenda-consultas-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .agenda-consultas-scroll::-webkit-scrollbar-thumb {
            background: rgba(159, 100, 175, 0.35);
            border-radius: 999px;
          }
          .agenda-consultas-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(159, 100, 175, 0.55);
          }
        `}</style>
      </motion.section>
    </div>,
    document.body,
  );
}
