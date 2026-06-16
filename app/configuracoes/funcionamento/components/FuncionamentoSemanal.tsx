// app/configuracoes/funcionamento/components/FuncionamentoSemanal.tsx
// Card semanal com ações rápidas, modal com validação em tempo real e backdrop completo.
// Agora com prop 'bloqueado' para desabilitar edição após aplicações em massa.

"use client";

import { Calendar, CalendarDays, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AplicacaoMensalFuncionamento, Excecao, Horario } from "../types";
import CardHorarioDia from "./CardHorarioDia";
import ModalFuncionamentoMensal from "./ModalFuncionamentoMensal";

// ----------------------------------------------------------------------
// INTERFACES
// ----------------------------------------------------------------------
interface FuncionamentoSemanalProps {
  horarios: Horario[];
  excecoes: Excecao[];
  disabled: boolean; // desabilitado por permissão (ex: não é psicólogo)
  bloqueado?: boolean; // desabilitado após aplicação em massa
  compacto?: boolean;
  esconderTextoCabecalho?: boolean;
  modoConsultaOperacional?: boolean; // secretária visualiza disponibilidade sem alterar regras
  mensalAplicado?: boolean; // indica que há aplicação mensal cobrindo a semana atual
  // dias do mês exibido com aplicação mensal (0=domingo..6=sábado)
  diasMensalAplicado?: number[];
  // dias da semana que possuem qualquer aplicação mensal — usado apenas para
  // trocar o texto do dia fechado, sem bloquear a edição (0=domingo..6=sábado)
  diasComMensal?: number[];
  onChange: (index: number, field: keyof Horario, value: unknown) => void;
  onCopiar: (origemIdx: number, destinos: number[]) => void;
  onAplicarMensal: (
    params: AplicacaoMensalFuncionamento,
  ) => void | Promise<void>;
  onAplicarDiasUteis: () => void;
  onFecharFinsDeSemana: () => void;
  onLimparHorarios: () => void;
}

// ----------------------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------------------
const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
export default function FuncionamentoSemanal({
  horarios,
  excecoes,
  disabled,
  bloqueado = false,
  compacto = false,
  esconderTextoCabecalho = false,
  modoConsultaOperacional = false,
  diasMensalAplicado = [],
  diasComMensal = [],
  onChange,
  onCopiar,
  onAplicarMensal,
  onAplicarDiasUteis,
  onFecharFinsDeSemana,
  onLimparHorarios,
}: FuncionamentoSemanalProps) {
  const [modalAberto, setModalAberto] = useState(false);

  // Combina permissão e bloqueio para desabilitar os cards.
  // Secretárias recebem modo de consulta operacional: campos somente leitura e ações administrativas ocultas.
  const isDisabled = disabled || bloqueado;
  // Exibir ações administrativas (como o link para aplicar mensal) para quem tem permissão,
  // mesmo quando a edição estiver temporariamente bloqueada pelo funcionamento mensal.
  const podeExibirAcoesAdministrativas = !disabled;

  return (
    <>
      <section
        className={
          compacto
            ? "space-y-4"
            : "bg-white/70 backdrop-blur-sm rounded-2xl border border-[#9F64AF]/20 shadow-sm p-5"
        }
      >
        <div
          className={`flex items-center justify-between ${compacto ? "" : "mb-1"}`}
        >
          {!esconderTextoCabecalho ? (
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[#9F64AF]" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Horários de funcionamento
                </h4>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                {modoConsultaOperacional
                  ? "Consulte os horários ativos e indisponíveis da clínica para apoio operacional."
                  : "Configure o funcionamento da clínica e acompanhe os períodos disponíveis para atendimento."}
              </p>
            </div>
          ) : (
            <span />
          )}

          {podeExibirAcoesAdministrativas && (
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              className="text-xs font-medium text-[#9F64AF] hover:text-[#8B509B] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Deseja aplicar um funcionamento padrão de forma mensal?
            </button>
          )}
        </div>

        {/* Lista de dias */}
        <div
          className={`rounded-xl border border-[#9F64AF]/20 bg-[#F9F5FF] divide-y divide-gray-100 overflow-hidden ${
            compacto ? "mb-4 mt-3" : "mb-4 mt-4"
          }`}
        >
          {horarios.map((horario, idx) => (
            <CardHorarioDia
              key={horario.dia_semana}
              dia={DIAS_SEMANA[horario.dia_semana]}
              curto={DIAS_CURTOS[horario.dia_semana]}
              diaIdx={horario.dia_semana}
              horario={horario}
              disabled={isDisabled}
              mensalAplicado={Array.isArray(diasMensalAplicado) && diasMensalAplicado.includes(horario.dia_semana)}
              temMensalNoDia={Array.isArray(diasComMensal) && diasComMensal.includes(horario.dia_semana)}
              isFirst={idx === 0}
              isLast={idx === horarios.length - 1}
              onChange={(field, value) => onChange(idx, field, value)}
              onCopiarPara={(destinos) => onCopiar(idx, destinos)}
              diasSemana={DIAS_SEMANA}
            />
          ))}
        </div>

        {/* Ações rápidas */}
        {podeExibirAcoesAdministrativas && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200/50">
            <span className="text-xs font-medium text-gray-500 mr-1">
              Ações rápidas:
            </span>
            <button
              type="button"
              onClick={onAplicarDiasUteis}
              disabled={bloqueado}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F3EAF8] hover:bg-[#E1D4F0] text-[#9F64AF] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar size={14} /> Aplicar dias úteis
            </button>
            <button
              type="button"
              onClick={onFecharFinsDeSemana}
              disabled={bloqueado}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F3EAF8] hover:bg-[#E1D4F0] text-[#9F64AF] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarDays size={14} /> Fechar fins de semana
            </button>
            <button
              type="button"
              onClick={onLimparHorarios}
              disabled={bloqueado}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F3EAF8] hover:bg-[#E1D4F0] text-[#9F64AF] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} /> Limpar horários
            </button>
          </div>
        )}
      </section>

      <ModalFuncionamentoMensal
        aberto={modalAberto}
        excecoes={excecoes}
        onClose={() => setModalAberto(false)}
        onAplicar={onAplicarMensal}
      />
    </>
  );
}
