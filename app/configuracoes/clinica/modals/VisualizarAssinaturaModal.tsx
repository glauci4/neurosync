"use client";

import { FileSignature, Trash2, WandSparkles } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { toast } from "sonner";
import { usePerfilUsuario } from "../../perfil-profissional/hooks/usePerfilUsuario";
import {
  useRemoverAssinaturaClinica,
  useUsarAssinaturaPerfilClinica,
} from "../hooks/useClinica";
import type { ClinicaData } from "../types";
import ModalBase from "./ModalBase";

interface VisualizarAssinaturaModalProps {
  aberto: boolean;
  clinica: ClinicaData;
  assinaturaPerfil: string | null;
  podeEditar: boolean;
  onClose: () => void;
}

export default function VisualizarAssinaturaModal({
  aberto,
  clinica,
  assinaturaPerfil,
  podeEditar,
  onClose,
}: VisualizarAssinaturaModalProps) {
  const { data: perfil } = usePerfilUsuario();
  const usarMutation = useUsarAssinaturaPerfilClinica();
  const removerMutation = useRemoverAssinaturaClinica();

  const assinaturaClinica = clinica.responsavel_tecnico_assinatura_url || null;
  const assinaturaPerfilAtual =
    assinaturaPerfil || perfil?.assinatura_profissional_url || null;

  const podeReutilizar = useMemo(
    () => Boolean(assinaturaPerfilAtual && podeEditar),
    [assinaturaPerfilAtual, podeEditar],
  );

  async function reutilizar() {
    if (!podeEditar) {
      toast.error(
        "Apenas o responsável pela clínica pode editar estas informações.",
      );
      return;
    }

    try {
      await usarMutation.mutateAsync();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao reutilizar assinatura",
      );
    }
  }

  async function remover() {
    if (!podeEditar) {
      toast.error(
        "Apenas o responsável pela clínica pode editar estas informações.",
      );
      return;
    }

    try {
      await removerMutation.mutateAsync();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover assinatura",
      );
    }
  }

  return (
    <ModalBase
      aberto={aberto}
      titulo="Assinatura digital"
      descricao="Visualize a assinatura vinculada à clínica e reutilize a assinatura do perfil profissional."
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileSignature size={16} className="text-[#9F64AF]" />
            <h3 className="text-sm font-semibold text-gray-800">
              Assinatura vinculada à clínica
            </h3>
          </div>
          {assinaturaClinica ? (
            <div className="rounded-2xl border border-gray-100 bg-[#F8F5FB] p-4">
              <div className="relative h-32 w-full overflow-hidden rounded-xl bg-white">
                <Image
                  src={assinaturaClinica}
                  alt="Assinatura da clínica"
                  fill
                  className="object-contain p-3"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Nenhuma assinatura vinculada no momento.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <WandSparkles size={16} className="text-[#9F64AF]" />
            <h3 className="text-sm font-semibold text-gray-800">
              Assinatura do perfil profissional
            </h3>
          </div>
          {assinaturaPerfilAtual ? (
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="relative h-32 overflow-hidden rounded-xl border border-gray-100 bg-[#F8F5FB]">
                <Image
                  src={assinaturaPerfilAtual}
                  alt="Assinatura do perfil"
                  fill
                  className="object-contain p-3"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {perfil?.assinatura_profissional_url
                    ? "A assinatura do seu perfil profissional pode ser reutilizada na clínica."
                    : "Seu perfil ainda não possui assinatura profissional."}
                </p>
                <button
                  type="button"
                  onClick={reutilizar}
                  disabled={!podeReutilizar}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reutilizar assinatura do perfil
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Nenhuma assinatura disponível no perfil.
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={remover}
            disabled={!podeEditar || !assinaturaClinica}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={15} />
            Remover assinatura
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

