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
import type { PacientesStatus } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { CORES_RELATORIOS, calcularMaximoEscala } from "../utils/graficos";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import RelatorioChartTooltip from "./RelatorioChartTooltip";

interface GraficoPacientesStatusProps {
  data?: PacientesStatus;
  isLoading?: boolean;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  mostrarAcoes?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

export default function GraficoPacientesStatus({
  data,
  isLoading = false,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  mostrarAcoes = true,
  contextoExportacao,
  periodoValido = true,
}: GraficoPacientesStatusProps) {
  const dados = [
    { status: "Ativos", total: Number(data?.ativos || 0) },
    { status: "Inativos", total: Number(data?.inativos || 0) },
    { status: "Em espera", total: Number(data?.fila_espera || 0) },
    { status: "Em atendimento", total: Number(data?.em_atendimento || 0) },
    { status: "Encerrados", total: Number(data?.encerrados || 0) },
  ];

  return (
    <section className="min-w-0 rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Pacientes ativos e inativos
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Visão atual da base clínica.
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
                  nome: "Pacientes",
                  dados: dados.map((item) => ({
                    Status: item.status,
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
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 8, right: 16, bottom: 8, left: 24 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CORES_RELATORIOS.roxoClaro}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
                domain={[
                  0,
                  calcularMaximoEscala(dados.map((item) => item.total)),
                ]}
              />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
                width={104}
              />
              <Tooltip content={<RelatorioChartTooltip />} />
              <Bar
                dataKey="total"
                name="Pacientes"
                fill={CORES_RELATORIOS.roxo}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
