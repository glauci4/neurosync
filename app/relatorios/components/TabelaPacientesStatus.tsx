"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { PacienteDetalhado } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { formatarDataExcel } from "../utils/exportarExcel";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import TabelaRelatoriosBase from "./TabelaRelatoriosBase";
import { Badge, formatarData } from "./tabelaUtils";

interface TabelaPacientesStatusProps {
  data?: PacienteDetalhado[];
  isLoading?: boolean;
  error?: Error | null;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    fila_espera: "Em espera",
    em_atendimento: "Em atendimento",
    encerrado: "Encerrado",
  };
  return labels[status] || status;
}

const columns: ColumnDef<PacienteDetalhado>[] = [
  {
    accessorKey: "nome",
    header: "Paciente",
    meta: {
      headerClassName: "w-[35%] pr-3",
      cellClassName: "pr-3",
    },
    cell: ({ row }) => (
      <span
        className="line-clamp-2 block whitespace-normal break-words font-medium leading-snug text-slate-800"
        title={row.original.nome}
      >
        {row.original.nome}
      </span>
    ),
  },
  {
    accessorKey: "status_atendimento",
    header: "Status",
    meta: {
      headerClassName: "w-[22%] px-3 text-center",
      cellClassName: "px-3 text-center",
    },
    cell: ({ row }) => {
      const status = row.original.status_atendimento;
      return (
        <Badge
          variant={
            status === "encerrado"
              ? "cinza"
              : status === "fila_espera"
                ? "amarelo"
                : "verde"
          }
        >
          <span className="block min-w-[96px]">{labelStatus(status)}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "psicologo_responsavel_nome",
    header: "Responsável",
    meta: {
      headerClassName: "w-[28%] px-3",
      cellClassName: "px-3",
    },
    cell: ({ row }) => (
      <span className="line-clamp-2 block whitespace-normal break-words text-sm leading-snug">
        {row.original.psicologo_responsavel_nome || "—"}
      </span>
    ),
  },
  {
    accessorKey: "criado_em",
    header: "Cadastro",
    meta: {
      headerClassName: "w-[15%] pl-3 text-center text-xs",
      cellClassName: "px-3 text-center text-xs text-slate-500",
    },
    cell: ({ row }) => formatarData(row.original.criado_em),
  },
];

export default function TabelaPacientesStatus({
  data = [],
  isLoading = false,
  error = null,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  contextoExportacao,
  periodoValido = true,
}: TabelaPacientesStatusProps) {
  return (
    <TabelaRelatoriosBase
      titulo="Tabela de pacientes por status"
      descricao="Base detalhada de pacientes ativos, inativos e encerrados com responsável clínico."
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyText="Nenhum paciente encontrado"
      emptyDescription="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
      searchPlaceholder="Buscar paciente"
      evitarScrollHorizontal
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
                  nome: "Pacientes status",
                  dados: data.map((item) => ({
                    Nome: item.nome,
                    Status: labelStatus(item.status_atendimento),
                    Responsável: item.psicologo_responsavel_nome || "",
                    Cadastro: Number(item.ativo) === 1 ? "Ativo" : "Inativo",
                    "Data de cadastro": formatarDataExcel(item.criado_em),
                    "Data de encerramento": formatarDataExcel(
                      item.encerrado_em,
                    ),
                    "Tempo de acompanhamento (dias)":
                      item.tempo_acompanhamento_dias ?? "",
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

