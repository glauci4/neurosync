"use client";

import type { ReactNode } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TaxaFaltas } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { CORES_RELATORIOS, calcularMaximoEscala } from "../utils/graficos";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import RelatorioChartTooltip from "./RelatorioChartTooltip";
import RelatorioEmptyState from "./RelatorioEmptyState";

interface GraficoTaxaFaltasProps {
  data?: TaxaFaltas;
  isLoading?: boolean;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  mostrarAcoes?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

export default function GraficoTaxaFaltas({
  data,
  isLoading = false,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  mostrarAcoes = true,
  contextoExportacao,
  periodoValido = true,
}: GraficoTaxaFaltasProps) {
  const dados = data?.por_psicologo || [];
  const taxa = Number(data?.resumo?.taxa_faltas || 0);

  return (
    <section className="min-w-0 rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            Taxa de faltas
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            Proporção de faltas sobre consultas registradas.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col items-start gap-2 lg:w-auto lg:items-end">
          <span className="rounded-full border border-[#9F64AF]/25 bg-[#F3E8F7] px-3 py-1 text-sm font-semibold text-[#9F64AF]">
            {taxa.toFixed(1)}%
          </span>
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
                    nome: "Resumo faltas",
                    dados: [
                      {
                        "Total de consultas": Number(
                          data?.resumo?.total_consultas || 0,
                        ),
                        "Total de faltas": Number(
                          data?.resumo?.total_faltas || 0,
                        ),
                        "Taxa de faltas": `${taxa.toFixed(1)}%`,
                      },
                    ],
                  },
                  {
                    nome: "Faltas por psicologo",
                    dados: dados.map((item) => ({
                      Psicólogo: item.psicologo_nome,
                      "Total de consultas": item.total_consultas,
                      "Total de faltas": item.total_faltas,
                      "Taxa de faltas": `${Number(item.taxa_faltas || 0).toFixed(1)}%`,
                    })),
                  },
                ]}
              />
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]" />
      ) : dados.length === 0 ? (
        <RelatorioEmptyState
          titulo="Nenhuma falta encontrada."
          mensagem="A taxa de faltas será exibida quando houver dados no período."
          altura="media"
        />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dados}
              margin={{ top: 8, right: 12, bottom: 18, left: 0 }}
            >
              <XAxis
                dataKey="psicologo_nome"
                tickFormatter={(valor) =>
                  String(valor).length > 18
                    ? `${String(valor).slice(0, 18).trimEnd()}...`
                    : String(valor)
                }
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={48}
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: CORES_RELATORIOS.textoSecundario }}
                unit="%"
                tickLine={false}
                axisLine={{ stroke: CORES_RELATORIOS.borda }}
                domain={[
                  0,
                  calcularMaximoEscala(
                    dados.map((item) => Number(item.taxa_faltas || 0)),
                    0.2,
                    3,
                  ),
                ]}
              />
              <Tooltip content={<RelatorioChartTooltip />} />
              <Line
                type="monotone"
                dataKey="taxa_faltas"
                name="Taxa de faltas"
                stroke={CORES_RELATORIOS.roxo}
                strokeWidth={3}
                dot={{ r: 4, fill: CORES_RELATORIOS.roxo }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

