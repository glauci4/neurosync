"use client";

import { motion } from "framer-motion";
import { Camera, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CiHospital1 } from "react-icons/ci";
import { MdErrorOutline } from "react-icons/md";
import { useConsultaCep } from "@/hooks/useConsultaCep";
import {
  useAtualizarClinica,
  useAtualizarIdentidadeClinica,
  useRemoverIdentidadeClinica,
} from "../hooks/useClinica";
import type { ClinicaData, ClinicaUpdatePayload } from "../types";
import {
  aplicarMascaraTelefone,
  cortarImagemEmQuadrado,
  formatarCep,
  formatarCnpj,
  normalizarSomenteNumeros,
  validarCep,
  validarEmail,
  validarImagemArquivo,
  validarTelefone,
  validarUf,
} from "../utils";

interface EditarClinicaModalProps {
  aberto: boolean;
  clinica: ClinicaData;
  onClose: () => void;
}

interface FormularioClinica {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

type ErrosFormulario = Partial<Record<keyof FormularioClinica, string>> & {
  geral?: string;
};

function criarEstadoInicial(clinica: ClinicaData): FormularioClinica {
  return {
    razao_social: clinica.razao_social || "",
    nome_fantasia: clinica.nome_fantasia || "",
    cnpj: clinica.cnpj || "",
    email: clinica.email || "",
    telefone: aplicarMascaraTelefone(clinica.telefone || ""),
    cep: formatarCep(clinica.cep || ""),
    endereco: clinica.endereco || "",
    numero: clinica.numero || "",
    complemento: clinica.complemento || "",
    bairro: clinica.bairro || "",
    cidade: clinica.cidade || "",
    estado: clinica.estado || "",
  };
}

function ErroCampo({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;

  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
      <MdErrorOutline size={14} />
      {mensagem}
    </p>
  );
}

export default function EditarClinicaModal({
  aberto,
  clinica,
  onClose,
}: EditarClinicaModalProps) {
  const mutation = useAtualizarClinica();
  const atualizarLogoMutation = useAtualizarIdentidadeClinica();
  const removerLogoMutation = useRemoverIdentidadeClinica();
  const inputLogoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormularioClinica>(() =>
    criarEstadoInicial(clinica),
  );
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [logoArquivo, setLogoArquivo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removerLogoAtual, setRemoverLogoAtual] = useState(false);

  const cepLimpo = useMemo(
    () => normalizarSomenteNumeros(form.cep),
    [form.cep],
  );
  const previewLogoAtual = useMemo(
    () => logoPreview || (!removerLogoAtual ? clinica.logo_url : null),
    [clinica.logo_url, logoPreview, removerLogoAtual],
  );
  const {
    data: dadosCep,
    isFetching: buscandoCep,
    error: erroCep,
  } = useConsultaCep(cepLimpo);

  useEffect(() => {
    if (!aberto) return;
    setForm(criarEstadoInicial(clinica));
    setErros({});
    setLogoArquivo(null);
    setLogoPreview((atual) => {
      if (atual?.startsWith("blob:")) URL.revokeObjectURL(atual);
      return null;
    });
    setRemoverLogoAtual(false);
  }, [aberto, clinica]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!aberto) return undefined;

    const fecharComEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };

    document.addEventListener("keydown", fecharComEsc);
    return () => document.removeEventListener("keydown", fecharComEsc);
  }, [aberto, onClose]);

  useEffect(() => {
    if (!dadosCep) return;

    setForm((atual) => ({
      ...atual,
      endereco: dadosCep.logradouro || atual.endereco,
      bairro: dadosCep.bairro || atual.bairro,
      cidade: dadosCep.cidade || atual.cidade,
      estado: dadosCep.estado || atual.estado,
      cep: formatarCep(dadosCep.cep || atual.cep),
    }));
  }, [dadosCep]);

  useEffect(() => {
    if (!erroCep) return;
    setErros((atual) => ({
      ...atual,
      cep: erroCep instanceof Error ? erroCep.message : "CEP inválido.",
    }));
  }, [erroCep]);

  if (!aberto || typeof document === "undefined") return null;

  function definirCampo<C extends keyof FormularioClinica>(
    campo: C,
    valor: FormularioClinica[C],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined, geral: undefined }));
  }

  function validarFormulario() {
    const novosErros: ErrosFormulario = {};

    if (!form.razao_social.trim()) {
      novosErros.razao_social = "Razão social é obrigatória";
    }
    if (!form.nome_fantasia.trim()) {
      novosErros.nome_fantasia = "Nome fantasia é obrigatório";
    }
    if (!form.email.trim()) {
      novosErros.email = "E-mail é obrigatório";
    } else if (!validarEmail(form.email)) {
      novosErros.email = "E-mail inválido";
    }
    if (!form.telefone.trim()) {
      novosErros.telefone = "Telefone é obrigatório";
    } else if (!validarTelefone(form.telefone)) {
      novosErros.telefone = "Telefone inválido";
    }
    if (!validarCep(form.cep)) {
      novosErros.cep = "CEP inválido";
    }
    if (!form.endereco.trim()) {
      novosErros.endereco = "Rua é obrigatória";
    }
    if (!form.numero.trim()) {
      novosErros.numero = "Número é obrigatório";
    }
    if (!form.bairro.trim()) {
      novosErros.bairro = "Bairro é obrigatório";
    }
    if (!form.cidade.trim()) {
      novosErros.cidade = "Cidade é obrigatória";
    }
    if (!validarUf(form.estado)) {
      novosErros.estado = "UF inválida";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function selecionarLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    const erroArquivo = validarImagemArquivo(arquivo);
    if (erroArquivo) {
      setErros((atual) => ({ ...atual, geral: erroArquivo }));
      return;
    }

    try {
      const arquivoCortado = await cortarImagemEmQuadrado(arquivo);
      const preview = URL.createObjectURL(arquivoCortado);

      setLogoPreview((atual) => {
        if (atual?.startsWith("blob:")) URL.revokeObjectURL(atual);
        return preview;
      });
      setLogoArquivo(arquivoCortado);
      setRemoverLogoAtual(false);
      setErros((atual) => ({ ...atual, geral: undefined }));
    } catch (error) {
      setErros((atual) => ({
        ...atual,
        geral:
          error instanceof Error ? error.message : "Erro ao processar imagem.",
      }));
    }
  }

  function removerLogo() {
    setLogoPreview((atual) => {
      if (atual?.startsWith("blob:")) URL.revokeObjectURL(atual);
      return null;
    });
    setLogoArquivo(null);
    setRemoverLogoAtual(Boolean(clinica.logo_url));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});

    if (!validarFormulario()) return;

    const payload: ClinicaUpdatePayload = {
      razao_social: form.razao_social.trim(),
      nome_fantasia: form.nome_fantasia.trim(),
      email: form.email.trim().toLowerCase(),
      telefone: normalizarSomenteNumeros(form.telefone),
      cep: normalizarSomenteNumeros(form.cep),
      endereco: form.endereco.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
    };

    try {
      await mutation.mutateAsync(payload);

      if (logoArquivo) {
        await atualizarLogoMutation.mutateAsync({
          tipo: "logo",
          arquivo: logoArquivo,
        });
      } else if (removerLogoAtual) {
        await removerLogoMutation.mutateAsync("logo");
      }

      onClose();
    } catch (error) {
      setErros({
        geral:
          error instanceof Error ? error.message : "Erro ao salvar clínica.",
      });
    }
  }

  const salvando =
    mutation.isPending ||
    atualizarLogoMutation.isPending ||
    removerLogoMutation.isPending;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Editar clínica
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Dados institucionais, contato e endereço.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-[#9F64AF]"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-[#F8F3FB]/70 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[#9F64AF]/20 bg-[#F3EAF8] text-[#9F64AF] shadow-sm">
                {previewLogoAtual ? (
                  <Image
                    src={previewLogoAtual}
                    alt="Logo da clínica"
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <CiHospital1 size={38} color="#9F64AF" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Logo da clínica
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG ou WEBP até 5MB. A imagem será recortada ao centro.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    ref={inputLogoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selecionarLogo}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => inputLogoRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#9F64AF] shadow-sm ring-1 ring-[#9F64AF]/15 transition hover:bg-[#F3EAF8]"
                  >
                    <Camera size={14} />
                    Alterar logo
                  </button>
                  <button
                    type="button"
                    onClick={removerLogo}
                    disabled={!previewLogoAtual}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Campo
              label="Razão social"
              obrigatorio
              value={form.razao_social}
              erro={erros.razao_social}
              onChange={(valor) => definirCampo("razao_social", valor)}
            />
            <Campo
              label="Nome fantasia"
              obrigatorio
              value={form.nome_fantasia}
              erro={erros.nome_fantasia}
              onChange={(valor) => definirCampo("nome_fantasia", valor)}
            />
            <Campo
              label="CNPJ"
              value={formatarCnpj(form.cnpj)}
              onChange={() => undefined}
              readOnly
            />
            <Campo
              label="E-mail"
              obrigatorio
              value={form.email}
              erro={erros.email}
              onChange={(valor) => definirCampo("email", valor)}
            />
            <Campo
              label="Telefone"
              obrigatorio
              value={form.telefone}
              erro={erros.telefone}
              onChange={(valor) =>
                definirCampo("telefone", aplicarMascaraTelefone(valor))
              }
              placeholder="(00) 00000-0000"
            />
            <Campo
              label="CEP"
              obrigatorio
              value={form.cep}
              erro={erros.cep}
              onChange={(valor) =>
                definirCampo("cep", formatarCep(valor).slice(0, 9))
              }
              placeholder="00000-000"
            />
            <Campo
              label="Rua"
              obrigatorio
              value={form.endereco}
              erro={erros.endereco}
              onChange={(valor) => definirCampo("endereco", valor)}
            />
            <Campo
              label="Número"
              obrigatorio
              value={form.numero}
              erro={erros.numero}
              onChange={(valor) => definirCampo("numero", valor)}
            />
            <Campo
              label="Complemento"
              value={form.complemento}
              onChange={(valor) => definirCampo("complemento", valor)}
            />
            <Campo
              label="Bairro"
              obrigatorio
              value={form.bairro}
              erro={erros.bairro}
              onChange={(valor) => definirCampo("bairro", valor)}
            />
            <Campo
              label="Cidade"
              obrigatorio
              value={form.cidade}
              erro={erros.cidade}
              onChange={(valor) => definirCampo("cidade", valor)}
            />
            <Campo
              label="Estado"
              obrigatorio
              value={form.estado}
              erro={erros.estado}
              onChange={(valor) =>
                definirCampo("estado", valor.toUpperCase().slice(0, 2))
              }
              placeholder="UF"
            />
          </div>

          {buscandoCep ? (
            <p className="text-xs text-[#9F64AF]">
              Buscando endereço pelo CEP...
            </p>
          ) : null}

          {erros.geral ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {erros.geral}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
}

function Campo({
  label,
  value,
  onChange,
  erro,
  obrigatorio = false,
  readOnly = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  erro?: string;
  obrigatorio?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-gray-800"
      >
        {label}
        {obrigatorio ? <span className="text-rose-500"> *</span> : null}
      </label>
      <input
        id={id}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
          erro ? "border-rose-300" : "border-gray-300"
        } read-only:bg-gray-50 read-only:text-gray-500`}
      />
      <ErroCampo mensagem={erro} />
    </div>
  );
}

