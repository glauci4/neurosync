"use client";

import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { ContextoExportacaoRelatorio } from "../utils/exportarExcel";
import { exportarExcel, type PlanilhaExcel } from "../utils/exportarExcel";

interface ExportarExcelButtonProps {
  planilhas: PlanilhaExcel[];
  disabled?: boolean;
  nomeArquivo?: string;
  modo?: "padrao" | "menu";
  contexto?: ContextoExportacaoRelatorio;
  periodoValido?: boolean;
  mensagemPeriodoInvalido?: string;
}

export default function ExportarExcelButton({
  planilhas,
  disabled = false,
  nomeArquivo,
  modo = "padrao",
  contexto,
  periodoValido = true,
  mensagemPeriodoInvalido = "Informe um período válido para exportar o relatório.",
}: ExportarExcelButtonProps) {
  async function handleExportar() {
    if (!periodoValido) {
      toast.error(mensagemPeriodoInvalido, {
        className: "border-red-300 bg-red-50 text-red-600",
      });
      return;
    }

    try {
      await exportarExcel(planilhas, nomeArquivo, contexto);
      toast.success("Excel exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error(
        "Exportação em Excel ainda não disponível para este relatório.",
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleExportar}
      disabled={disabled}
      className={
        modo === "menu"
          ? "inline-flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#9F64AF]/30 bg-[#F3E8F7] px-3 text-xs font-medium text-[#9F64AF] shadow-sm transition hover:bg-[#E1D4F0] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:hover:bg-[#F3E8F7]"
      }
    >
      <FileSpreadsheet size={15} />
      Exportar Excel
    </button>
  );
}
