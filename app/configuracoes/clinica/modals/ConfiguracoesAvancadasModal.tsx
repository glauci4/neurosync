"use client";

import { Check, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAtualizarClinica } from "../hooks/useClinica";
import type { ClinicaData, ConfiguracoesInternasFormState } from "../types";
import ModalBase from "./ModalBase";

interface ConfiguracoesAvancadasModalProps {
  aberto: boolean;
  clinica: ClinicaData;
  podeEditar: boolean;
  onClose: () => void;
}

function criarEstado(clinica: ClinicaData): ConfiguracoesInternasFormState {
  return {
    permitir_multiplos_psicologos: Boolean(
      clinica.permitir_multiplos_psicologos,
    ),
    permitir_compartilhamento_prontuario: Boolean(
      clinica.permitir_compartilhamento_prontuario,
    ),
    exigir_assinatura_evolucoes: Boolean(clinica.exigir_assinatura_evolucoes),
    bloquear_edicao_apos_assinatura: Boolean(
      clinica.bloquear_edicao_apos_assinatura,
    ),
    tempo_maximo_edicao_evolucao: clinica.tempo_maximo_edicao_evolucao ?? 30,
    habilitar_auditoria_clinica: Boolean(clinica.habilitar_auditoria_clinica),
  };
}

export default function ConfiguracoesAvancadasModal({
  aberto,
  clinica,
  podeEditar,
  onClose,
}: ConfiguracoesAvancadasModalProps) {
  const mutation = useAtualizarClinica();
  const [form, setForm] = useState<ConfiguracoesInternasFormState>(() =>
    criarEstado(clinica),
  );
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (aberto) {
      setForm(criarEstado(clinica));
      setErro("");
    }
  }, [aberto, clinica]);

  function alternar(
    campo: keyof ConfiguracoesInternasFormState,
    valor?: boolean | number | null,
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: typeof valor === "boolean" ? valor : !atual[campo],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!podeEditar) {
      toast.error(
        "Apenas o responsável pela clínica pode editar estas informações.",
      );
      return;
    }

    const tempo = Number(form.tempo_maximo_edicao_evolucao);
    if (Number.isNaN(tempo) || tempo < 1) {
      setErro("Informe um tempo válido em minutos.");
      return;
    }

    mutation.mutate(
      {
        permitir_multiplos_psicologos: form.permitir_multiplos_psicologos,
        permitir_compartilhamento_prontuario:
          form.permitir_compartilhamento_prontuario,
        exigir_assinatura_evolucoes: form.exigir_assinatura_evolucoes,
        bloquear_edicao_apos_assinatura: form.bloquear_edicao_apos_assinatura,
        tempo_maximo_edicao_evolucao: tempo,
        habilitar_auditoria_clinica: form.habilitar_auditoria_clinica,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          setErro(error instanceof Error ? error.message : "Erro ao salvar");
        },
      },
    );
  }

  const itens = [
    {
      chave: "permitir_multiplos_psicologos",
      titulo: "Permitir múltiplos psicólogos",
      descricao: "Libera mais de um psicólogo associado à mesma clínica.",
    },
    {
      chave: "permitir_compartilhamento_prontuario",
      titulo: "Compartilhar prontuário",
      descricao: "Permite compartilhamento de prontuários entre psicólogos.",
    },
    {
      chave: "exigir_assinatura_evolucoes",
      titulo: "Exigir assinatura nas evoluções",
      descricao: "Obrigatória para finalizar o registro clínico.",
    },
    {
      chave: "bloquear_edicao_apos_assinatura",
      titulo: "Bloquear edição após assinatura",
      descricao: "Impede alterações depois da assinatura clínica.",
    },
    {
      chave: "habilitar_auditoria_clinica",
      titulo: "Habilitar auditoria clínica",
      descricao: "Mantém trilha de auditoria para operações sensíveis.",
    },
  ] as const;

  return (
    <ModalBase
      aberto={aberto}
      titulo="Configurações internas"
      descricao="Ajuste regras operacionais e parâmetros de edição da clínica."
      onClose={onClose}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Settings2 size={16} className="text-[#9F64AF]" />
            <h3 className="text-sm font-semibold text-gray-800">
              Regras internas
            </h3>
          </div>

          <div className="space-y-3">
            {itens.map((item) => {
              const ativo = Boolean(form[item.chave]);
              return (
                <button
                  key={item.chave}
                  type="button"
                  onClick={() => alternar(item.chave)}
                  disabled={!podeEditar}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    ativo
                      ? "border-[#9F64AF]/30 bg-[#F3EAF8]/70"
                      : "border-gray-100 bg-white hover:bg-gray-50"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                      ativo
                        ? "border-[#9F64AF] bg-[#9F64AF] text-white"
                        : "border-gray-300 text-transparent"
                    }`}
                  >
                    <Check size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {item.titulo}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.descricao}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block rounded-2xl border border-gray-100 bg-white p-4">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Nome exibido no sidebar
            </span>
            <input
              type="text"
              value={clinica.nome_sidebar || clinica.nome_fantasia}
              disabled
              className="input-padrao cursor-not-allowed bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              O nome é editado no modal principal da clínica.
            </p>
          </label>

          <label className="block rounded-2xl border border-gray-100 bg-white p-4">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Tempo máximo para edição
            </span>
            <input
              type="number"
              min={1}
              max={480}
              value={form.tempo_maximo_edicao_evolucao ?? 30}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  tempo_maximo_edicao_evolucao: Number(event.target.value),
                }))
              }
              className="input-padrao"
              disabled={!podeEditar}
            />
            <p className="mt-1 text-xs text-gray-500">
              Defina o tempo máximo, em minutos, para edição de evoluções.
            </p>
          </label>
        </div>

        {erro ? <p className="text-sm text-rose-600">{erro}</p> : null}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !podeEditar}
            className="inline-flex items-center justify-center rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
