"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { PacienteEspera } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { formatarDataExcel } from "../utils/exportarExcel";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import TabelaRelatoriosBase from "./TabelaRelatoriosBase";
import { Badge, formatarData, formatarTelefone } from "./tabelaUtils";

interface TabelaPacientesEsperaProps {
  data?: PacienteEspera[];
  isLoading?: boolean;
  error?: Error | null;
  onImprimir?: () => void;
  acaoHeaderExtra?: ReactNode;
  acoesBloqueadas?: boolean;
  contextoExportacao?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
}

const columns: ColumnDef<PacienteEspera>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <span className="block max-w-[240px] truncate" title={row.original.nome}>
        {row.original.nome}
      </span>
    ),
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => formatarTelefone(row.original.telefone),
  },
  {
    accessorKey: "criado_em",
    header: "Cadastro",
    cell: ({ row }) => formatarData(row.original.criado_em),
  },
  {
    accessorKey: "responsavel_nome",
    header: "Responsável",
    cell: ({ row }) =>
      row.original.tipo === "menor" ? (
        <span
          className="block max-w-[200px] truncate"
          title={row.original.responsavel_nome || "-"}
        >
          {row.original.responsavel_nome || "-"}
        </span>
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "psicologo_responsavel_nome",
    header: "Psicólogo responsável",
    cell: ({ row }) =>
      row.original.psicologo_responsavel_nome ? (
        <span
          className="block max-w-[200px] truncate"
          title={row.original.psicologo_responsavel_nome}
        >
          {row.original.psicologo_responsavel_nome}
        </span>
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "status_atendimento",
    header: "Status",
    cell: () => <Badge variant="amarelo">Em espera</Badge>,
  },
];

export default function TabelaPacientesEspera({
  data = [],
  isLoading = false,
  error = null,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  contextoExportacao,
  periodoValido = true,
}: TabelaPacientesEsperaProps) {
  return (
    <TabelaRelatoriosBase
      titulo="Tabela de pacientes em espera"
      descricao="Pacientes que ainda aguardam início de acompanhamento com vínculo clínico visível."
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyText="Nenhum paciente em espera encontrado"
      emptyDescription="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
      searchPlaceholder="Buscar paciente..."
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
                  nome: "Pacientes em espera",
                  dados: data.map((item) => ({
                    Nome: item.nome,
                    Telefone: formatarTelefone(item.telefone),
                    "Data de cadastro": formatarDataExcel(item.criado_em),
                    Responsável:
                      item.tipo === "menor" ? item.responsavel_nome || "" : "",
                    "Psicólogo responsável":
                      item.psicologo_responsavel_nome || "",
                    Status: "Em espera",
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
