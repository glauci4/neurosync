"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { useFiltrosAgenda } from "@/app/agenda/hooks/useAgenda";
import { useTransferirAcompanhamento } from "@/hooks/useTransferirAcompanhamento";
import PsicologoCombobox from "./PsicologoCombobox";

interface TransferirAcompanhamentoModalProps {
  aberto: boolean;
  pacienteId: number;
  pacienteNome: string;
  psicologoResponsavelId: number;
  psicologoResponsavelNome?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ErrosFormulario {
  psicologo_destino_id?: string;
  motivo?: string;
  geral?: string;
}

function MensagemErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-500">
      <MdErrorOutline size={14} className="mt-0.5 shrink-0" />
      <span>{mensagem}</span>
    </p>
  );
}

export default function TransferirAcompanhamentoModal({
  aberto,
  pacienteId,
  pacienteNome,
  psicologoResponsavelId,
  psicologoResponsavelNome,
  onClose,
  onSuccess,
}: TransferirAcompanhamentoModalProps) {
  const [montado, setMontado] = useState(false);
  const [psicologoDestinoId, setPsicologoDestinoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<ErrosFormulario>({});

  const transferir = useTransferirAcompanhamento();
  const { data: filtrosAgenda } = useFiltrosAgenda();

  const psicologosDisponiveis = useMemo(() => {
    const psicologos =
      filtrosAgenda?.data.psicologos?.map((psicologo) => ({
        valor: String(psicologo.id),
        label: psicologo.nome,
      })) || [];

    return psicologos.filter(
      (psicologo) => Number(psicologo.valor) !== psicologoResponsavelId,
    );
  }, [filtrosAgenda?.data.psicologos, psicologoResponsavelId]);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    setPsicologoDestinoId("");
    setMotivo("");
    setObservacoes("");
    setErros({});
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  if (!aberto || !montado) return null;

  const validar = () => {
    const novosErros: ErrosFormulario = {};

    if (!psicologoDestinoId) {
      novosErros.psicologo_destino_id = "Selecione o novo responsável";
    } else if (Number(psicologoDestinoId) === psicologoResponsavelId) {
      novosErros.psicologo_destino_id =
        "Selecione um psicólogo diferente do responsável atual";
    }

    if (!motivo.trim() || motivo.trim().length < 5) {
      novosErros.motivo = "Informe um motivo válido para a transferência";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!validar()) return;

    try {
      await transferir.mutateAsync({
        pacienteId,
        psicologo_destino_id: Number(psicologoDestinoId),
        motivo: motivo.trim(),
        observacoes: observacoes.trim() || null,
      });

      toast.success("Acompanhamento transferido com sucesso");
      onSuccess?.();
      onClose();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao transferir acompanhamento";
      setErros((atuais) => ({ ...atuais, geral: mensagem }));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.2 }}
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#9F64AF]/15 bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
            <ArrowLeftRight size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Transferir acompanhamento
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Alterne o psicólogo responsável do paciente com histórico e motivo
              obrigatório.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[#9F64AF]/15 bg-[#F8F4FB] p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Paciente
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {pacienteNome}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Responsável atual: {psicologoResponsavelNome || "Não informado"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <PsicologoCombobox
              label="Novo psicólogo responsável"
              obrigatorio
              value={psicologoDestinoId}
              placeholder="Selecione um psicólogo"
              erro={erros.psicologo_destino_id}
              opcoes={psicologosDisponiveis}
              onChange={(valor) => {
                setPsicologoDestinoId(valor);
                setErros((atuais) => ({
                  ...atuais,
                  psicologo_destino_id: undefined,
                  geral: undefined,
                }));
              }}
            />
            {psicologosDisponiveis.length === 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Não há outros psicólogos ativos disponíveis para transferência.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="transferir-motivo"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              id="transferir-motivo"
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setErros((atuais) => ({
                  ...atuais,
                  motivo: undefined,
                  geral: undefined,
                }));
              }}
              rows={3}
              placeholder="Informe o motivo da transferência"
              className={`w-full resize-none rounded-xl border bg-white/90 px-3 py-2 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#9F64AF]/70 ${
                erros.motivo ? "border-red-300" : "border-gray-200"
              }`}
            />
            <MensagemErro mensagem={erros.motivo} />
          </div>

          <div>
            <label
              htmlFor="transferir-observacoes"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Observações
            </label>
            <textarea
              id="transferir-observacoes"
              value={observacoes}
              onChange={(evento) => {
                setObservacoes(evento.target.value);
                setErros((atuais) => ({ ...atuais, geral: undefined }));
              }}
              rows={3}
              placeholder="Observações complementares, se necessário"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#9F64AF]/70"
            />
          </div>

          <MensagemErro mensagem={erros.geral} />

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={transferir.isPending}
              className="rounded-xl bg-[#9F64AF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {transferir.isPending
                ? "Transferindo..."
                : "Transferir acompanhamento"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
