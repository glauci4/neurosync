"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ClinicaData } from "@/app/configuracoes/clinica/types";
import { gerarRelatorioPdf } from "../pdf/gerarRelatorioPdf";
import type { RelatorioPdfUsuario } from "../pdf/RelatorioPDFDocument";
import type {
  FiltrosRelatorios,
  RelatorioPrintConfig,
} from "../types/relatorios.types";

interface GerarPDFButtonProps {
  relatorio: RelatorioPrintConfig;
  clinica?: ClinicaData | null;
  filtros: FiltrosRelatorios;
  usuario: RelatorioPdfUsuario;
  disabled?: boolean;
  label?: string;
  modo?: "padrao" | "menu";
  periodoValido?: boolean;
  mensagemPeriodoInvalido?: string;
}

export default function GerarPDFButton({
  relatorio,
  clinica,
  filtros,
  usuario,
  disabled = false,
  label = "Gerar PDF",
  modo = "padrao",
  periodoValido = true,
  mensagemPeriodoInvalido = "Informe um período válido para gerar o relatório em PDF.",
}: GerarPDFButtonProps) {
  const [gerando, setGerando] = useState(false);

  async function handleGerarPdf() {
    if (!periodoValido) {
      toast.error(mensagemPeriodoInvalido, {
        className: "border-red-300 bg-red-50 text-red-600",
      });
      return;
    }

    try {
      setGerando(true);
      await gerarRelatorioPdf({
        relatorio,
        clinica,
        filtros,
        usuario,
      });
      toast.success("PDF gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGerarPdf}
      disabled={disabled || gerando}
      className={
        modo === "menu"
          ? "inline-flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#9F64AF]/30 bg-[#F3E8F7] px-3 text-xs font-medium text-[#9F64AF] shadow-sm transition hover:bg-[#E1D4F0] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:hover:bg-[#F3E8F7]"
      }
    >
      <FileText size={15} />
      {gerando ? "Gerando..." : label}
    </button>
  );
}

