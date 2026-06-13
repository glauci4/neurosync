"use client";

import { CalendarClock } from "lucide-react";
import type { AgendamentoFuturo } from "../types/relatorios.types";
import RelatorioEmptyState from "./RelatorioEmptyState";

const skeletonItens = [
  "agendamento-1",
  "agendamento-2",
  "agendamento-3",
  "agendamento-4",
];

interface ListaAgendamentosFuturosProps {
  data?: AgendamentoFuturo[];
  isLoading?: boolean;
}

function formatarData(data: string) {
  const parsed = new Date(`${data}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return data;
  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function horaCurta(hora: string) {
  return String(hora || "").slice(0, 5);
}

export default function ListaAgendamentosFuturos({
  data = [],
  isLoading = false,
}: ListaAgendamentosFuturosProps) {
  return (
    <section className="rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-5 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock size={17} className="text-[#9F64AF]" />
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Próximos agendamentos
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Consultas futuras agendadas ou remarcadas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {skeletonItens.map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <RelatorioEmptyState
          titulo="Nenhum agendamento encontrado"
          mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
          altura="compacta"
        />
      ) : (
        <div className="space-y-3">
          {data.slice(0, 8).map((consulta) => (
            <article
              key={consulta.id}
              className="rounded-xl border border-gray-100 bg-white/70 px-4 py-3 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800 dark:text-[var(--ns-text-primary)]">
                    {consulta.paciente_nome}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
                    {consulta.psicologo_nome} · {consulta.sala_nome}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
                  <p className="font-semibold text-[#9F64AF]">
                    {formatarData(consulta.data_consulta)}
                  </p>
                  <p>
                    {horaCurta(consulta.horario_inicio)} -{" "}
                    {horaCurta(consulta.horario_fim)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

