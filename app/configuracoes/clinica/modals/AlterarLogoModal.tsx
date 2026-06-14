"use client";

import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAtualizarIdentidadeClinica,
  useRemoverIdentidadeClinica,
} from "../hooks/useClinica";
import type { ClinicaData, TipoIdentidadeVisualClinica } from "../types";
import { cortarImagemEmQuadrado, validarImagemArquivo } from "../utils";
import ModalBase from "./ModalBase";

interface AlterarLogoModalProps {
  aberto: boolean;
  clinica: ClinicaData;
  onClose: () => void;
}

export default function AlterarLogoModal({
  aberto,
  clinica,
  onClose,
}: AlterarLogoModalProps) {
  const mutation = useAtualizarIdentidadeClinica();
  const removerMutation = useRemoverIdentidadeClinica();
  const [logoArquivo, setLogoArquivo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const previewLogoAtual = useMemo(
    () => logoPreview || clinica.logo_url || null,
    [clinica.logo_url, logoPreview],
  );
  useEffect(() => {
    if (!aberto) {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoArquivo(null);
      setLogoPreview(null);
      return;
    }

    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoArquivo(null);
    setLogoPreview(null);
    setErro("");
  }, [aberto, logoPreview]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  async function prepararArquivo(
    arquivo: File,
    tipo: TipoIdentidadeVisualClinica,
  ) {
    const erroArquivo = validarImagemArquivo(arquivo);
    if (erroArquivo) {
      setErro(erroArquivo);
      return null;
    }

    const arquivoCortado = await cortarImagemEmQuadrado(arquivo);
    const preview = URL.createObjectURL(arquivoCortado);

    if (tipo === "logo") {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoArquivo(arquivoCortado);
      setLogoPreview(preview);
    }
    return arquivoCortado;
  }

  async function handleArquivo(
    event: React.ChangeEvent<HTMLInputElement>,
    tipo: TipoIdentidadeVisualClinica,
  ) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    setErro("");
    await prepararArquivo(arquivo, tipo);
    event.target.value = "";
  }

  async function salvar() {
    try {
      if (logoArquivo) {
        await mutation.mutateAsync({ tipo: "logo", arquivo: logoArquivo });
      }
      if (!logoArquivo) {
        toast.info("Nenhum arquivo novo foi selecionado.");
      } else {
        onClose();
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao enviar imagem");
    }
  }

  async function remover(tipo: TipoIdentidadeVisualClinica) {
    try {
      await removerMutation.mutateAsync(tipo);
      if (tipo === "logo") {
        setLogoPreview(null);
        setLogoArquivo(null);
      }
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao remover arquivo",
      );
    }
  }

  return (
    <ModalBase
      aberto={aberto}
      titulo="Identidade visual"
      descricao="Faça upload da logo da clínica com pré-visualização e remoção."
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon size={16} className="text-[#9F64AF]" />
            <h3 className="text-sm font-semibold text-gray-800">
              Logo principal
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-[160px_1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#F3EAF8]/40 p-4">
              {previewLogoAtual ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl">
                  <Image
                    src={previewLogoAtual}
                    alt="Logo da clínica"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Upload className="mx-auto mb-2 text-[#9F64AF]" size={22} />
                  <p className="text-xs">Sem logo cadastrada</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleArquivo(event, "logo")}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#F3EAF8] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#9F64AF] hover:file:bg-[#E8D9F4]"
              />
              <p className="text-xs text-gray-500">
                A imagem passa por um recorte central quadrado antes do envio.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => remover("logo")}
                  disabled={!clinica.logo_url}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Remover logo
                </button>
              </div>
            </div>
          </div>
        </section>

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
            type="button"
            onClick={salvar}
            className="inline-flex items-center justify-center rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar identidade
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
