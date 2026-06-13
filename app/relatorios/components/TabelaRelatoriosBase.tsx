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
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import RelatorioEmptyState from "./RelatorioEmptyState";

interface TabelaRelatoriosBaseProps<T> {
  titulo: string;
  descricao: string;
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: Error | null;
  emptyText: string;
  emptyDescription?: string;
  mostrarTabelaVazia?: boolean;
  evitarScrollHorizontal?: boolean;
  alturaAutomatica?: boolean;
  searchPlaceholder?: string;
  acaoHeader?: ReactNode;
}

export default function TabelaRelatoriosBase<T>({
  titulo,
  descricao,
  data,
  columns,
  isLoading = false,
  error = null,
  emptyText,
  emptyDescription = "Ajuste os filtros ou período para visualizar os registros.",
  mostrarTabelaVazia = false,
  evitarScrollHorizontal = false,
  alturaAutomatica = false,
  searchPlaceholder = "Buscar...",
  acaoHeader,
}: TabelaRelatoriosBaseProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
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
    <section
      className={`min-w-0 rounded-2xl border border-[#9F64AF]/15 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)] ${
        alturaAutomatica ? "" : "min-h-[420px]"
      }`}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
            {titulo}
          </h2>
          <p className="text-xs text-gray-500 dark:text-[var(--ns-text-secondary)]">
            {descricao}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
          <div className="relative w-full sm:min-w-[260px] sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={globalFilter}
              onChange={(evento) => setGlobalFilter(evento.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#9F64AF]/70 focus:ring-2 focus:ring-[#9F64AF] dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-primary)]"
            />
          </div>
          {acaoHeader ? (
            <div className="flex w-full justify-start lg:w-auto lg:justify-end">
              {acaoHeader}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-center rounded-2xl border border-[#9F64AF]/15 bg-white/80 px-4 py-8 text-center shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
          <div className="max-w-md space-y-2">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3E8F7] text-[#9F64AF]">
              <Search size={18} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-[var(--ns-text-primary)]">
              Não foi possível carregar o relatório
            </p>
            <p className="text-xs text-slate-600 dark:text-[var(--ns-text-secondary)]">
              Tente novamente em alguns instantes ou ajuste os filtros
              selecionados.
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {["linha-1", "linha-2", "linha-3", "linha-4"].map((item) => (
            <div
              key={item}
              className="h-12 animate-pulse rounded-xl bg-[#F3EAF8] dark:bg-[var(--ns-surface-soft)]"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        mostrarTabelaVazia ? (
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-[var(--ns-border)]">
            <div
              className={
                evitarScrollHorizontal ? "overflow-hidden" : "overflow-x-auto"
              }
            >
              <table
                className={
                  evitarScrollHorizontal
                    ? "w-full table-fixed text-sm"
                    : "min-w-full text-sm"
                }
              >
                <thead className="bg-[#F8F3FB] text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-4 py-3 ${
                            (
                              header.column.columnDef.meta as
                                | { headerClassName?: string }
                                | undefined
                            )?.headerClassName || ""
                          }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white/80 dark:bg-[var(--ns-surface)]">
                  <tr>
                    <td
                      colSpan={table.getAllLeafColumns().length}
                      className="px-4 py-6 text-center"
                    >
                      <div className="mx-auto flex max-w-md items-center justify-center gap-3 text-left">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8F7] text-[#9F64AF]">
                          <Search size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-[var(--ns-text-primary)]">
                            {emptyText}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-[var(--ns-text-secondary)]">
                            {emptyDescription}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <RelatorioEmptyState
            titulo={emptyText}
            mensagem={emptyDescription}
            altura="compacta"
          />
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-[var(--ns-border)]">
            <div
              className={
                evitarScrollHorizontal ? "overflow-hidden" : "overflow-x-auto"
              }
            >
              <table
                className={
                  evitarScrollHorizontal
                    ? "w-full table-fixed text-sm"
                    : "min-w-full text-sm"
                }
              >
                <thead className="bg-[#F8F3FB] text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-4 py-3 ${
                            (
                              header.column.columnDef.meta as
                                | { headerClassName?: string }
                                | undefined
                            )?.headerClassName || ""
                          }`}
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
                              }[header.column.getIsSorted() as string] || ""}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white/80 dark:divide-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-[#FAF7FC] dark:hover:bg-[var(--ns-surface-soft)]"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`px-4 py-3 align-middle text-gray-700 dark:text-[var(--ns-text-secondary)] ${
                            (
                              cell.column.columnDef.meta as
                                | { cellClassName?: string }
                                | undefined
                            )?.cellClassName || ""
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-[var(--ns-text-secondary)]">
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
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[var(--ns-border)]"
              >
                <ChevronLeft size={15} />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[var(--ns-border)]"
              >
                Próxima
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

