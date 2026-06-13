"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OcupacaoSala } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { CORES_RELATORIOS } from "../utils/graficos";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import RelatorioChartTooltip from "./RelatorioChartTooltip";
import RelatorioEmptyState from "./RelatorioEmptyState";

interface GraficoOcupacaoSalasProps {
  data?: OcupacaoSala[];
  isLoading?: boolean;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  mostrarAcoes?: boolean;
  capacidadePeriodoHoras?: number | null;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

export default function GraficoOcupacaoSalas({
  data = [],
  isLoading = false,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  mostrarAcoes = true,
  capacidadePeriodoHoras = null,
  contextoExportacao,
  periodoValido = true,
}: GraficoOcupacaoSalasProps) {
  const baseCapacidade =
    capacidadePeriodoHoras && capacidadePeriodoHoras > 0
      ? capacidadePeriodoHoras
      : Math.max(1, ...data.map((item) => Number(item.horas_ocupadas || 0)));

  const dados = data.map((item) => {
    const horas = Number(item.horas_ocupadas || 0);
    const percentual =
      baseCapacidade > 0 ? Math.min(100, (horas / baseCapacidade) * 100) : 0;

    return {
      ...item,
      horas_ocupadas_num: horas,
      capacidade_periodo_horas: capacidadePeriodoHoras || baseCapacidade,
      percentual_ocupacao: percentual,
    };
  });

  return (
    <section className="min-w-0 rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Ocupação das salas
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Percentual de ocupação por sala no período selecionado.
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
                  nome: "Ocupacao de salas",
                  dados: data.map((item) => ({
                    Sala: item.sala_nome,
                    Tipo: item.sala_tipo,
                    Consultas: item.total_consultas,
                    Concluídas: item.concluidas,
                    Pendentes: item.futuras_ou_pendentes,
                    Faltas: item.faltas,
                    Canceladas: item.canceladas,
                    "Horas ocupadas": Number(item.horas_ocupadas || 0),
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
          titulo="Nenhuma sala encontrada."
          mensagem="A ocupação será exibida quando houver consultas vinculadas às salas."
          altura="media"
        />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CORES_RELATORIOS.roxoClaro}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                tickFormatter={(valor) => `${valor}%`}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
              />
              <YAxis
                type="category"
                dataKey="sala_nome"
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
                width={110}
              />
              <Tooltip content={<RelatorioChartTooltip />} />
              <Bar
                dataKey="percentual_ocupacao"
                name="Ocupação"
                fill={CORES_RELATORIOS.roxo}
                radius={[0, 8, 8, 0]}
              >
                <LabelList
                  dataKey="percentual_ocupacao"
                  position="right"
                  formatter={(valor) => `${Math.round(Number(valor || 0))}%`}
                  fill={CORES_RELATORIOS.texto}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

