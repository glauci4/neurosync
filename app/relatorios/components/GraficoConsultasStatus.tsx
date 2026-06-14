"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ConsultaStatus } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import RelatorioChartTooltip from "./RelatorioChartTooltip";
import RelatorioEmptyState from "./RelatorioEmptyState";

interface GraficoConsultasStatusProps {
  data?: ConsultaStatus[];
  isLoading?: boolean;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  mostrarAcoes?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

const cores: Record<string, string> = {
  agendado: "#9F64AF",
  remarcado: "#B77AC7",
  cancelado: "#C084D2",
  falta: "#A96BBA",
  concluido: "#E1D4F0",
};

const labels: Record<string, string> = {
  agendado: "Agendado",
  remarcado: "Remarcado",
  cancelado: "Cancelado",
  falta: "Falta",
  concluido: "Concluído",
};

export default function GraficoConsultasStatus({
  data = [],
  isLoading = false,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  mostrarAcoes = true,
  contextoExportacao,
  periodoValido = true,
}: GraficoConsultasStatusProps) {
  const dados = data.map((item) => ({
    ...item,
    label: labels[item.status] || item.status,
  }));

  return (
    <section className="min-w-0 rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Consultas por status
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Distribuição operacional da agenda.
          </p>
        </div>
        <MenuAcoesRelatorioPadrao
          mostrarAcoes={mostrarAcoes}
          acaoPdf={acaoHeaderExtra}
          onImprimir={onImprimir}
          imprimirDesabilitado={isLoading || acoesBloqueadas}
          acaoExcel={
            <ExportarExcelButton
              disabled={isLoading || acoesBloqueadas}
              modo="menu"
              contexto={contextoExportacao}
              periodoValido={periodoValido}
              planilhas={[
                {
                  nome: "Consultas por status",
                  dados: dados.map((item) => ({
                    Status: item.label,
                    Total: item.total,
                  })),
                },
              ]}
            />
          }
        />
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
      ) : dados.length === 0 ? (
        <RelatorioEmptyState
          titulo="Nenhuma consulta encontrada."
          mensagem="As consultas aparecerão aqui conforme o período e filtros selecionados."
          altura="media"
        />
      ) : (
        <div className="grid min-h-64 gap-3 lg:grid-cols-[minmax(0,1fr)_140px]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {dados.map((item) => (
                    <Cell
                      key={item.status}
                      fill={cores[item.status] || "#9F64AF"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<RelatorioChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 self-center rounded-xl border border-[#E8DBF2] bg-[#FAF7FC] p-3 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)]">
            {dados.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2 text-gray-600 dark:text-[var(--ns-text-secondary)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cores[item.status] }}
                  />
                  {item.label}
                </span>
                <strong className="text-gray-800 dark:text-[var(--ns-text-primary)]">
                  {item.total}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
