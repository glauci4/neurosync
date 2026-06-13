"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { OcupacaoSala } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import TabelaRelatoriosBase from "./TabelaRelatoriosBase";
import { Badge } from "./tabelaUtils";

interface TabelaOcupacaoSalasProps {
  data?: OcupacaoSala[];
  isLoading?: boolean;
  error?: Error | null;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  capacidadePeriodoHoras?: number | null;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

export default function TabelaOcupacaoSalas({
  data = [],
  isLoading = false,
  error = null,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  capacidadePeriodoHoras = null,
  contextoExportacao,
  periodoValido = true,
}: TabelaOcupacaoSalasProps) {
  const capacidade =
    capacidadePeriodoHoras && capacidadePeriodoHoras > 0
      ? capacidadePeriodoHoras
      : null;

  const columns: ColumnDef<OcupacaoSala>[] = [
    {
      accessorKey: "sala_nome",
      header: "Sala",
      cell: ({ row }) => (
        <span
          className="block max-w-[220px] truncate"
          title={row.original.sala_nome}
        >
          {row.original.sala_nome}
        </span>
      ),
    },
    {
      accessorKey: "total_consultas",
      header: "Consultas",
      cell: ({ row }) => Number(row.original.total_consultas || 0),
    },
    {
      accessorKey: "horas_ocupadas",
      header: "Horas ocupadas",
      cell: ({ row }) =>
        `${Number(row.original.horas_ocupadas || 0).toFixed(1)}h`,
    },
    {
      accessorKey: "horarios_mais_utilizados",
      header: "Horários mais utilizados",
      cell: ({ row }) => row.original.horarios_mais_utilizados || "—",
    },
    {
      id: "percentual_ocupacao",
      header: "Ocupação",
      cell: ({ row }) => {
        if (!capacidade) {
          return <Badge variant="cinza">—</Badge>;
        }

        const percentual = Math.min(
          100,
          Math.round(
            (Number(row.original.horas_ocupadas || 0) / capacidade) * 100,
          ),
        );

        return (
          <div className="flex min-w-[130px] items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EDE3F4]">
              <div
                className="h-full rounded-full bg-[#9F64AF]"
                style={{ width: `${percentual}%` }}
              />
            </div>
            <span className="w-9 text-right text-xs font-semibold text-[#6F3A7C]">
              {percentual}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <TabelaRelatoriosBase
      titulo="Ocupação por sala"
      descricao="Distribuição de consultas, horários utilizados e taxa de ocupação no período selecionado."
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyText="Nenhuma ocupação de sala encontrada"
      emptyDescription="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
      searchPlaceholder="Buscar sala..."
      alturaAutomatica
      acaoHeader={
        <MenuAcoesRelatorioPadrao
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
                    "Quantidade de consultas": item.total_consultas,
                    "Horas ocupadas": Number(item.horas_ocupadas || 0),
                    "Horários mais utilizados":
                      item.horarios_mais_utilizados || "",
                    "Percentual de ocupação": capacidade
                      ? `${Math.round(
                          (Number(item.horas_ocupadas || 0) / capacidade) * 100,
                        )}%`
                      : "—",
                  })),
                },
              ]}
            />
          }
        />
      }
    />
  );
}

