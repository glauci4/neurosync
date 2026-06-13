"use client";

import { motion } from "framer-motion";
import { AlertCircle, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import PreviewImportacaoPacientes from "../components/PreviewImportacaoPacientes";
import ResumoImportacaoPacientes from "../components/ResumoImportacaoPacientes";
import { useImportarPacientes } from "../hooks/useImportarPacientes";
import type {
  ImportarPacientesResponse,
  LinhaImportacaoPaciente,
  ResumoImportacaoPacientes as ResumoImportacaoPacientesType,
} from "../types/importacaoPacientes.types";
import { lerArquivoPacientes } from "../utils/normalizarImportacao";
import { validarLinhasImportacao } from "../utils/validarImportacaoPacientes";

interface ImportarPacientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const resumoVazio: ResumoImportacaoPacientesType = {
  total: 0,
  importados: 0,
  ignorados: 0,
  invalidos: 0,
};

export default function ImportarPacientesModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportarPacientesModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [arquivoNome, setArquivoNome] = useState("");
  const [linhas, setLinhas] = useState<LinhaImportacaoPaciente[]>([]);
  const [erroArquivo, setErroArquivo] = useState("");
  const [resultado, setResultado] = useState<ImportarPacientesResponse | null>(
    null,
  );
  const importarMutation = useImportarPacientes();

  const resumoPreview = useMemo(() => {
    return linhas.reduce(
      (acc, linha) => {
        acc.total += 1;
        if (linha.status === "valido") acc.importados += 1;
        if (linha.status === "duplicado") acc.ignorados += 1;
        if (linha.status === "invalido") acc.invalidos += 1;
        return acc;
      },
      { ...resumoVazio },
    );
  }, [linhas]);

  const possuiValidos = linhas.some((linha) => linha.status === "valido");

  const resetar = useCallback(() => {
    setArquivoNome("");
    setLinhas([]);
    setErroArquivo("");
    setResultado(null);
    importarMutation.reset();
    if (inputRef.current) inputRef.current.value = "";
  }, [importarMutation.reset]);

  const handleClose = useCallback(() => {
    resetar();
    onClose();
  }, [onClose, resetar]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleArquivoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setErroArquivo("");
    setResultado(null);
    setLinhas([]);

    const extensao = arquivo.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "csv"].includes(extensao || "")) {
      setErroArquivo("Formato inválido. Envie um arquivo .xlsx ou .csv.");
      return;
    }

    try {
      setArquivoNome(arquivo.name);
      const linhasNormalizadas = await lerArquivoPacientes(arquivo);
      if (linhasNormalizadas.length === 0) {
        setErroArquivo(
          "Arquivo vazio. Verifique se a planilha possui dados de pacientes.",
        );
        return;
      }
      setLinhas(validarLinhasImportacao(linhasNormalizadas));
    } catch (error) {
      setErroArquivo(
        error instanceof Error ? error.message : "Erro ao ler o arquivo.",
      );
    }
  };

  const handleConfirmar = async () => {
    const resposta = await importarMutation.mutateAsync({ pacientes: linhas });
    setResultado(resposta);
    onSuccess?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[92vh] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[var(--ns-surface)]"
      >
        <div className="relative flex flex-col items-center border-b border-gray-100 bg-white px-6 py-5 text-center dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF] dark:hover:bg-[rgba(159,100,175,0.18)]"
            aria-label="Fechar importação"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF] dark:bg-[rgba(159,100,175,0.18)]">
              <FileSpreadsheet size={22} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-[var(--ns-text-primary)]">
              Importar Dados
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-[var(--ns-text-secondary)]">
              Importe pacientes a partir de arquivos Excel (.xlsx) ou CSV
              (.csv).
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-white px-6 py-4 dark:bg-[var(--ns-surface)]">
          <div className="mx-auto w-full rounded-2xl border border-dashed border-[#D8C3E2] bg-white px-4 py-3.5 text-center shadow-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
            <div className="flex flex-col items-center gap-2.5">
              <div className="max-w-md">
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--ns-text-primary)]">
                  Selecione um arquivo .xlsx ou .csv
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-[var(--ns-text-secondary)]">
                  Colunas esperadas: nome, cpf, telefone, e-mail, nascimento,
                  tipo e responsável.
                </p>
                {arquivoNome && (
                  <p className="mt-2 text-xs font-medium text-[#9F64AF]">
                    {arquivoNome}
                  </p>
                )}
              </div>
              <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#9F64AF] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B]">
                <Upload size={16} />
                Selecionar arquivo
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleArquivoChange}
                  className="hidden"
                />
              </label>
            </div>
            {erroArquivo && (
              <p className="mt-3 flex items-center gap-1 text-xs text-red-500">
                <MdErrorOutline size={14} />
                {erroArquivo}
              </p>
            )}
          </div>

          {linhas.length > 0 && !resultado && (
            <>
              <ResumoImportacaoPacientes resumo={resumoPreview} />
              <PreviewImportacaoPacientes linhas={linhas} />
              {!possuiValidos && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertCircle size={16} />
                  Nenhuma linha válida encontrada para importação.
                </div>
              )}
            </>
          )}

          {resultado && (
            <>
              <ResumoImportacaoPacientes resumo={resultado.resumo} />
              <PreviewImportacaoPacientes linhas={resultado.resultados} />
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-3 sm:flex-row sm:justify-center dark:border-[var(--ns-border)]">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[var(--ns-border)] dark:text-[var(--ns-text-primary)] dark:hover:bg-[var(--ns-surface-soft)]"
          >
            {resultado ? "Fechar" : "Cancelar"}
          </button>
          {!resultado && (
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={!possuiValidos || importarMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importarMutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Confirmar importação
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
