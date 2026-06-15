"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  Clock,
  MapPin,
  User,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo } from "react";
import {
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "@/app/agenda/constants/agendaStatusConfig";
import MenuAcoesHistoricoConsultasPaciente from "./MenuAcoesHistoricoConsultasPaciente";
import HistoricoConsultasPacientePrintLayout from "../print/HistoricoConsultasPacientePrintLayout";
import { useImprimirHistoricoConsultasPaciente } from "../hooks/useImprimirHistoricoConsultasPaciente";
import { gerarHistoricoConsultasPacientePdf } from "../pdf/gerarHistoricoConsultasPacientePdf";
import type { ConsultaHistoricoPaciente } from "../types/historicoConsultas";

interface HistoricoConsultasPacienteModalProps {
  aberto: boolean;
  pacienteNome: string;
  consultas: ConsultaHistoricoPaciente[];
  onClose: () => void;
  onVerDetalhesConsulta?: (consulta: ConsultaHistoricoPaciente) => void;
}

function formatarData(data: string) {
  const valor = new Date(`${String(data).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(valor.getTime())) return String(data || "-");
  return new Intl.DateTimeFormat("pt-BR").format(valor);
}

function horaCurta(hora?: string | null) {
  return String(hora || "").slice(0, 5) || "-";
}

function tipoLabel(consulta: ConsultaHistoricoPaciente) {
  if (consulta.tipo_atendimento === "outro" && consulta.tipo_outro) {
    return consulta.tipo_outro;
  }

  const mapa: Record<string, string> = {
    triagem: "Triagem",
    psicoterapia: "Psicoterapia",
    devolutiva: "Devolutiva",
    avaliacao: "Avaliação",
    orientacao: "Orientação",
    retorno: "Retorno",
    alta: "Alta",
    outro: "Outro",
  };

  return mapa[consulta.tipo_atendimento] || consulta.tipo_atendimento || "-";
}

export default function HistoricoConsultasPacienteModal({
  aberto,
  pacienteNome,
  consultas,
  onClose,
  onVerDetalhesConsulta,
}: HistoricoConsultasPacienteModalProps) {
  const { printRef, config, imprimirHistorico } =
    useImprimirHistoricoConsultasPaciente();
  const configPdf = useMemo(
    () => ({
      pacienteNome,
      consultas,
    }),
    [pacienteNome, consultas],
  );

  if (!aberto) return null;

  const handleGerarPdf = async () => {
    await gerarHistoricoConsultasPacientePdf(configPdf);
  };

  const handleImprimir = () => {
    imprimirHistorico(configPdf);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Fechar histórico"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>

          <div className="border-b border-[#9F64AF]/10 px-6 pt-6 pb-5 pr-14">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
                <CalendarClock size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-gray-800">
                  Histórico de consultas
                </h2>
                <p className="mt-1 text-sm text-gray-500">{pacienteNome}</p>
              </div>
              <MenuAcoesHistoricoConsultasPaciente
                onGerarPdf={handleGerarPdf}
                onImprimir={handleImprimir}
              />
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
                  <User size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Linha do tempo
                  </h3>
                  <p className="text-xs text-gray-500">
                    Consultas operacionais registradas para este paciente.
                  </p>
                </div>
              </div>

              {consultas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D9BCE8] bg-[#FBF7FF] p-4 text-sm text-gray-500">
                  Nenhuma consulta registrada para este paciente.
                </div>
              ) : (
                <div className="space-y-2">
                  {consultas.map((consulta) => {
                    const statusVisual = obterStatusConsultaExibicao(consulta);
                    const configStatus = obterAgendaStatusConfig(statusVisual);
                    return (
                    <article
                      key={consulta.id}
                      className="rounded-2xl border border-[#9F64AF]/10 bg-white/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {formatarData(consulta.data_consulta)} ·{" "}
                            {horaCurta(consulta.horario_inicio)} às{" "}
                            {horaCurta(consulta.horario_fim)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {tipoLabel(consulta)} · {configStatus.texto}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {consulta.psicologo_nome || "Não informado"}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#9F64AF]" />
                          {consulta.sala_nome || "Sala não informada"}
                        </span>
                        {onVerDetalhesConsulta ? (
                          <button
                            type="button"
                            onClick={() => onVerDetalhesConsulta(consulta)}
                            className="rounded-lg border border-[#9F64AF]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#9F64AF] transition hover:border-[#9F64AF] hover:bg-[#F9F4FC]"
                          >
                            Ver detalhes da consulta
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
              )}
            </section>
          </div>
        </motion.div>
      </div>

      <div ref={printRef} className="hidden print:block">
        <HistoricoConsultasPacientePrintLayout
          pacienteNome={config?.pacienteNome || pacienteNome}
          consultas={config?.consultas || consultas}
        />
      </div>
    </>,
    document.body,
  );
}
