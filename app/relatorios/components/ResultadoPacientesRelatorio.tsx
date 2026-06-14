"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  ListChecks,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { PacienteDetalhado } from "../types/relatorios.types";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { formatarDataExcel } from "../utils/exportarExcel";
import ExportarExcelButton from "./ExportarExcelButton";
import MenuAcoesRelatorioPadrao from "./MenuAcoesRelatorioPadrao";
import { Badge, formatarData } from "./tabelaUtils";

interface ResultadoPacientesRelatorioProps {
  pacientesDetalhados?: PacienteDetalhado[];
  isLoadingPacientesDetalhados?: boolean;
  errorPacientesDetalhados?: Error | null;
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

function varianteStatusPaciente(status: string) {
  if (status === "encerrado") return "cinza";
  if (status === "fila_espera") return "amarelo";
  return "verde";
}

function EmptyCompacto({
  titulo,
  mensagem,
}: {
  titulo: string;
  mensagem: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F8F3FB] px-4 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3E8F7] text-[#9F64AF]">
        <FileSearch size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{titulo}</p>
        <p className="mt-0.5 text-xs text-slate-500">{mensagem}</p>
      </div>
    </div>
  );
}

const columns: ColumnDef<PacienteDetalhado>[] = [
  {
    accessorKey: "nome",
    header: "Paciente",
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
    cell: ({ row }) => {
      const status = row.original.status_atendimento;
      return (
        <div className="flex justify-center">
          <Badge variant={varianteStatusPaciente(status)}>
            <span className="block min-w-[82px]">{labelStatus(status)}</span>
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "psicologo_responsavel_nome",
    header: "Responsável",
    cell: ({ row }) => (
      <span className="line-clamp-2 block whitespace-normal break-words text-sm leading-snug text-slate-600">
        {row.original.psicologo_responsavel_nome || "—"}
      </span>
    ),
  },
  {
    accessorKey: "criado_em",
    header: "Cadastro",
    cell: ({ row }) => (
      <span className="block text-center text-xs text-slate-500">
        {formatarData(row.original.criado_em)}
      </span>
    ),
  },
];

export default function ResultadoPacientesRelatorio({
  pacientesDetalhados = [],
  isLoadingPacientesDetalhados = false,
  errorPacientesDetalhados = null,
  onImprimir,
  acaoHeaderExtra,
  acoesBloqueadas = false,
  contextoExportacao,
  periodoValido = true,
}: ResultadoPacientesRelatorioProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: pacientesDetalhados,
    columns,
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 6 } },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRegistros = table.getFilteredRowModel().rows.length;

  return (
    <section className="rounded-2xl border border-[#9F64AF]/12 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)] sm:p-6">
      <div>
        <section>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-2">
              <ListChecks
                size={17}
                className="mt-0.5 shrink-0 text-[#9F64AF]"
              />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  Pacientes por status
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Base detalhada de pacientes ativos, inativos e encerrados com
                  responsável clínico.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
              <div className="relative w-full sm:min-w-[280px] sm:max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={globalFilter}
                  onChange={(evento) => setGlobalFilter(evento.target.value)}
                  placeholder="Buscar paciente"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#9F64AF]/70 focus:ring-2 focus:ring-[#9F64AF]"
                />
              </div>
              <MenuAcoesRelatorioPadrao
                acaoPdf={acaoHeaderExtra}
                onImprimir={onImprimir}
                imprimirDesabilitado={
                  isLoadingPacientesDetalhados || acoesBloqueadas
                }
                acaoExcel={
                  <ExportarExcelButton
                    disabled={isLoadingPacientesDetalhados || acoesBloqueadas}
                    modo="menu"
                    contexto={contextoExportacao}
                    periodoValido={periodoValido}
                    planilhas={[
                      {
                        nome: "Pacientes status",
                        dados: pacientesDetalhados.map((item) => ({
                          Nome: item.nome,
                          Status: labelStatus(item.status_atendimento),
                          Responsável: item.psicologo_responsavel_nome || "",
                          Cadastro:
                            Number(item.ativo) === 1 ? "Ativo" : "Inativo",
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
            </div>
          </div>

          {errorPacientesDetalhados ? (
            <EmptyCompacto
              titulo="Não foi possível carregar os pacientes"
              mensagem="Tente novamente em alguns instantes ou ajuste os filtros selecionados."
            />
          ) : isLoadingPacientesDetalhados ? (
            <div className="space-y-2">
              {["paciente-1", "paciente-2", "paciente-3", "paciente-4"].map(
                (item) => (
                  <div
                    key={item}
                    className="h-12 animate-pulse rounded-xl bg-[#F3EAF8]"
                  />
                ),
              )}
            </div>
          ) : rows.length === 0 ? (
            <EmptyCompacto
              titulo="Nenhum paciente encontrado"
              mensagem="Não existem registros para os filtros ou período selecionado. Ajuste os filtros ou selecione outro intervalo de datas."
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-100/80">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-[#FAF7FC] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const widths: Record<string, string> = {
                            nome: "w-[35%] pr-3",
                            status_atendimento: "w-[22%] px-3 text-center",
                            psicologo_responsavel_nome: "w-[28%] px-3",
                            criado_em: "w-[15%] pl-3 text-center",
                          };

                          return (
                            <th
                              key={header.id}
                              className={`px-4 py-2.5 ${widths[header.column.id] || ""}`}
                            >
                              {header.isPlaceholder ? null : (
                                <button
                                  type="button"
                                  onClick={header.column.getToggleSortingHandler()}
                                  className="inline-flex items-center gap-1 text-left transition hover:text-[#9F64AF]"
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                  {{
                                    asc: "↑",
                                    desc: "↓",
                                  }[header.column.getIsSorted() as string] ||
                                    ""}
                                </button>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-100/80 bg-white/80">
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition hover:bg-[#FBF7FF]"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const cellClasses: Record<string, string> = {
                            nome: "pr-3",
                            status_atendimento: "px-3 text-center",
                            psicologo_responsavel_nome: "px-3",
                            criado_em: "pl-3 text-center",
                          };

                          return (
                            <td
                              key={cell.id}
                              className={`px-4 py-2.5 align-middle text-slate-600 ${
                                cellClasses[cell.column.id] || ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-purple-100/70 border-t pt-3 text-sm text-slate-500">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Página {table.getState().pagination.pageIndex + 1} de{" "}
                    {table.getPageCount()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {totalRegistros}{" "}
                    {totalRegistros === 1
                      ? "registro encontrado"
                      : "registros encontrados"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
