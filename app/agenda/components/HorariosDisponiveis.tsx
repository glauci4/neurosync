"use client";

import { AlertCircle, Clock3, Loader2 } from "lucide-react";
import { useEffect } from "react";
import {
  dataDisponivelParaAgenda,
  useDisponibilidadeAgenda,
} from "../hooks/useDisponibilidadeAgenda";
import type { HorarioDisponivelAgenda } from "../services/agendaDisponibilidadeService";

interface HorariosDisponiveisProps {
  psicologoId?: string | number | null;
  salaId?: string | number | null;
  data?: string | null;
  consultaId?: string | number | null;
  valorSelecionado?: string | null;
  onSelecionar: (horario: HorarioDisponivelAgenda) => void;
  onLimparHorario?: () => void;
  erro?: string | null;
  dataValidaParaConsulta?: boolean;
}

function formatarHorario(horario: HorarioDisponivelAgenda) {
  return horario.label || `${horario.inicio} às ${horario.fim}`;
}

export function HorariosDisponiveis({
  psicologoId,
  salaId,
  data,
  consultaId,
  valorSelecionado,
  onSelecionar,
  onLimparHorario,
  erro,
  dataValidaParaConsulta,
}: HorariosDisponiveisProps) {
  const dataValida =
    dataValidaParaConsulta ?? dataDisponivelParaAgenda(data ?? null);
  const disponibilidade = useDisponibilidadeAgenda({
    psicologoId,
    salaId,
    data,
    consultaId,
  });

  const faltaPsicologo = !psicologoId;
  const faltaSala = Boolean(psicologoId) && !salaId;
  const faltaData = Boolean(psicologoId) && Boolean(salaId) && !data;
  const dataPassadaOuInvalida =
    Boolean(psicologoId && salaId && data) && !dataValida;
  const podeConsultar = Boolean(psicologoId && salaId && dataValida);
  const mensagemErro = dataValida
    ? erro ||
      (disponibilidade.error instanceof Error
        ? disponibilidade.error.message
        : null)
    : null;

  useEffect(() => {
    if (
      !onLimparHorario ||
      !valorSelecionado ||
      !disponibilidade.data?.horarios
    ) {
      return;
    }

    const valorAindaValido = disponibilidade.data.horarios.some(
      (horario) => horario.inicio === valorSelecionado,
    );
    if (!valorAindaValido) {
      onLimparHorario();
    }
  }, [disponibilidade.data?.horarios, onLimparHorario, valorSelecionado]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-[#9F64AF]" />
        <div>
          <p className="text-sm font-medium text-slate-900">
            Horário do atendimento <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-slate-500">
            {faltaPsicologo
              ? "Selecione um psicólogo para visualizar os horários disponíveis."
              : faltaSala
                ? "Selecione uma sala para visualizar os horários disponíveis."
                : faltaData
                  ? "Selecione uma data para visualizar os horários disponíveis."
                  : dataPassadaOuInvalida
                    ? "Selecione uma data válida para visualizar horários disponíveis."
                    : "Cada atendimento ocupa 1 hora na agenda: 50 minutos de sessão e 10 minutos para organização da sala e preparação do próximo paciente."}
          </p>
        </div>
      </div>

      {!podeConsultar ? (
        <div className="rounded-xl border border-dashed border-[#D9C6E8] bg-[#F7F1FB] px-4 py-5 text-center">
          <p className="text-sm font-medium text-slate-900">
            {faltaPsicologo
              ? "Selecione um psicólogo para visualizar os horários disponíveis."
              : faltaSala
                ? "Selecione uma sala para visualizar os horários disponíveis."
                : dataPassadaOuInvalida
                  ? "Selecione uma data válida para visualizar horários disponíveis."
                  : "Selecione uma data para visualizar os horários disponíveis."}
          </p>
        </div>
      ) : disponibilidade.isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-[#D9C6E8] bg-[#F7F1FB] px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-[#9F64AF]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando horários disponíveis...
          </div>
        </div>
      ) : disponibilidade.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {disponibilidade.error instanceof Error
            ? disponibilidade.error.message
            : "Não foi possível carregar os horários disponíveis."}
        </div>
      ) : disponibilidade.data?.motivo ? (
        <div className="rounded-xl border border-dashed border-[#D9C6E8] bg-[#F7F1FB] px-4 py-5 text-center">
          <p className="text-sm font-medium text-slate-900">
            {disponibilidade.data.motivo}
          </p>
        </div>
      ) : disponibilidade.data?.horarios?.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {disponibilidade.data.horarios.map((horario) => {
            const selecionado = valorSelecionado === horario.inicio;

            return (
              <button
                key={`${horario.inicio}-${horario.fim}`}
                type="button"
                onClick={() => onSelecionar(horario)}
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  "whitespace-nowrap",
                  selecionado
                    ? "border-[#9F64AF] bg-[#E1D4F0] text-[#7F4C8F] shadow-sm"
                    : "border-[#E5D9F3] bg-white text-[#9F64AF] hover:border-[#C8A6D9] hover:bg-[#F7F1FB]",
                ].join(" ")}
              >
                {formatarHorario(horario)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#D9C6E8] bg-[#F7F1FB] px-4 py-5 text-center">
          <p className="text-sm font-medium text-slate-900">
            Nenhum horário disponível para esta data.
          </p>
        </div>
      )}

      {mensagemErro ? (
        <p className="flex items-start gap-1.5 text-sm font-medium text-red-500">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="leading-5">{mensagemErro}</span>
        </p>
      ) : null}
    </div>
  );
}
