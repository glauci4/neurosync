"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { AgendamentoFuturo } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { formatarDataExcel, horaExcel } from "../utils/exportarExcel";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import TabelaRelatoriosBase from "./TabelaRelatoriosBase";
import {
  Badge,
  formatarData,
  horaCurta,
  labelStatusConsulta,
  varianteStatusConsulta,
} from "./tabelaUtils";

interface TabelaAgendamentosFuturosProps {
  data?: AgendamentoFuturo[];
  isLoading?: boolean;
  error?: Error | null;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

const columns: ColumnDef<AgendamentoFuturo>[] = [
  {
    accessorKey: "data_consulta",
    header: "Data",
    cell: ({ row }) => formatarData(row.original.data_consulta),
  },
  {
    id: "horario",
    header: "Horário",
    cell: ({ row }) =>
      `${horaCurta(row.original.horario_inicio)} - ${horaCurta(row.original.horario_fim)}`,
  },
  {
    accessorKey: "paciente_nome",
    header: "Paciente",
    cell: ({ row }) => (
      <span
        className="block max-w-[220px] truncate"
        title={row.original.paciente_nome}
      >
        {row.original.paciente_nome}
      </span>
    ),
  },
  {
    accessorKey: "psicologo_nome",
    header: "Psicólogo",
    cell: ({ row }) => (
      <span
        className="block max-w-[220px] truncate"
        title={row.original.psicologo_nome}
      >
        {row.original.psicologo_nome}
      </span>
    ),
  },
  {
    accessorKey: "sala_nome",
    header: "Sala",
    cell: ({ row }) => (
      <span
        className="block max-w-[180px] truncate"
        title={row.original.sala_nome}
      >
        {row.original.sala_nome}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={varianteStatusConsulta(row.original.status)}>
        {labelStatusConsulta(row.original.status)}
      </Badge>
    ),
  },
];

export default function TabelaAgendamentosFuturos({
  data = [],
  isLoading = false,
  error = null,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  contextoExportacao,
  periodoValido = true,
}: TabelaAgendamentosFuturosProps) {
  return (
    <TabelaRelatoriosBase
      titulo="Próximas consultas agendadas"
      descricao="Detalhamento das consultas futuras encontradas para o período selecionado."
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyText="Nenhum agendamento encontrado"
      emptyDescription="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
      mostrarTabelaVazia
      searchPlaceholder="Buscar agendamento..."
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
                  nome: "Agendamentos futuros",
                  dados: data.map((item) => ({
                    Data: formatarDataExcel(item.data_consulta),
                    Horário: `${horaExcel(item.horario_inicio)} - ${horaExcel(item.horario_fim)}`,
                    Paciente: item.paciente_nome,
                    Psicólogo: item.psicologo_nome,
                    Sala: item.sala_nome,
                    Status: item.status,
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
