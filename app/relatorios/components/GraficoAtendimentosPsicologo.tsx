"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AtendimentosPsicologo } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { CORES_RELATORIOS, calcularMaximoEscala } from "../utils/graficos";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import RelatorioChartTooltip from "./RelatorioChartTooltip";
import RelatorioEmptyState from "./RelatorioEmptyState";

interface GraficoAtendimentosPsicologoProps {
  data?: AtendimentosPsicologo[];
  isLoading?: boolean;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  mostrarAcoes?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

export default function GraficoAtendimentosPsicologo({
  data = [],
  isLoading = false,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  mostrarAcoes = true,
  contextoExportacao,
  periodoValido = true,
}: GraficoAtendimentosPsicologoProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Atendimentos por psicólogo
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Consultas registradas no período selecionado.
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
                  nome: "Atendimentos",
                  dados: data.map((item) => ({
                    Psicólogo: item.psicologo_nome,
                    Total: item.total,
                    Concluídos: item.concluidos,
                    Faltas: item.faltas,
                    Cancelados: item.cancelados,
                    Pendentes: item.pendentes,
                  })),
                },
              ]}
            />
          }
        />
      </div>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
      ) : data.length === 0 ? (
        <RelatorioEmptyState
          titulo="Nenhum atendimento encontrado."
          mensagem="Os atendimentos aparecerão aqui conforme o período e filtros selecionados."
          altura="media"
        />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CORES_RELATORIOS.roxoClaro}
              />
              <XAxis
                dataKey="psicologo_nome"
                tickFormatter={(valor) =>
                  String(valor).length > 16
                    ? `${String(valor).slice(0, 16).trimEnd()}...`
                    : String(valor)
                }
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                interval={0}
                angle={-16}
                textAnchor="end"
                height={54}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
                domain={[
                  0,
                  calcularMaximoEscala(
                    data.flatMap((item) => [item.total, item.concluidos]),
                  ),
                ]}
              />
              <Tooltip content={<RelatorioChartTooltip />} />
              <Bar
                dataKey="total"
                name="Total"
                fill={CORES_RELATORIOS.roxo}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="concluidos"
                name="Concluídos"
                fill={CORES_RELATORIOS.roxoSecundario}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

