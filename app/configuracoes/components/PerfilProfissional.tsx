// app/configuracoes/components/PerfilProfissional.tsx
// Área de perfil do usuário logado. Segurança e senha ficam exclusivamente na aba Segurança.

"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Mail,
  PencilLine,
  Signature,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaUserShield } from "react-icons/fa";
import { HiOutlineIdentification } from "react-icons/hi";
import { MdErrorOutline } from "react-icons/md";
import { toast } from "sonner";
import { formatarCPF, formatarTelefone } from "@/lib/utils";
import AvatarPerfilProfissional from "../perfil-profissional/components/AvatarPerfilProfissional";
import {
  useAtualizarAssinaturaProfissional,
  useAtualizarFotoPerfil,
  useAtualizarPerfil,
  usePerfilUsuario,
  useRemoverAssinaturaProfissional,
  useRemoverFotoPerfil,
} from "../perfil-profissional/hooks/usePerfilUsuario";
import type { PerfilData } from "../types";

interface PerfilProfissionalProps {
  isPsicologo: boolean;
}

interface ErrosFormulario {
  nome?: string;
  telefone?: string;
  foto?: string;
  geral?: string;
}

interface ErrosAssinatura {
  arquivo?: string;
  geral?: string;
}

const TIPOS_IMAGEM_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function limparTelefone(telefone: string) {
  return telefone.replace(/\D/g, "");
}

function aplicarMascaraTelefone(valor: string) {
  return formatarTelefone(limparTelefone(valor).slice(0, 11));
}

function perfilLabel(perfil: PerfilData, isPsicologo: boolean) {
  if (isPsicologo || perfil.perfil_id === 2) return "Psicólogo(a)";
  return "Secretária";
}

function statusLabel(perfil: PerfilData) {
  if (perfil.status === "Inativa") return "Inativo";
  if (perfil.status === "Ativa") return "Ativo";
  if (perfil.status) return perfil.status;
  return perfil.ativo === false || perfil.ativo === 0 ? "Inativo" : "Ativo";
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

function statusAssinaturaLabel(perfil: PerfilData, removendo: boolean) {
  return perfil.assinatura_profissional_url && !removendo
    ? "Cadastrada"
    : "Não cadastrada";
}

export default function PerfilProfissional({
  isPsicologo,
}: PerfilProfissionalProps) {
  const { data: perfil, isLoading, error, refetch } = usePerfilUsuario();
  const [modalAberto, setModalAberto] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#9F64AF] border-t-transparent" />
          <p className="text-sm text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h3 className="mb-2 text-lg font-medium text-gray-800">
          Erro ao carregar perfil
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Não foi possível carregar os dados do usuário.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[#9F64AF] px-4 py-2 text-sm text-white transition hover:bg-[#8B509B]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const documentoLabel = isPsicologo ? "CRP" : "CPF";
  const documentoValor = isPsicologo
    ? perfil.crp || "Não informado"
    : perfil.cpf
      ? formatarCPF(perfil.cpf)
      : "Não informado";
  const telefoneFormatado = perfil.telefone
    ? formatarTelefone(perfil.telefone)
    : "Não informado";

  return (
    <div className="mx-auto max-w-5xl space-y-8 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
      >
        <div className="grid gap-6 md:grid-cols-[auto,minmax(0,1fr),auto] md:items-start">
          <div className="shrink-0">
            <AvatarPerfilProfissional
              fotoUrl={perfil.avatar_url}
              nomeUsuario={perfil.nome}
              tipoUsuario={perfilLabel(perfil, isPsicologo)}
              onClickEditar={() => setModalAberto(true)}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {perfil.nome}
                  </h3>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {statusLabel(perfil)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[#9F64AF]">
                  {perfilLabel(perfil, isPsicologo)}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {perfil.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone size={14} /> {telefoneFormatado}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiOutlineIdentification size={14} /> {documentoLabel}:{" "}
                    {documentoValor}
                  </span>
                </div>

                {isPsicologo && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">
                      Assinatura profissional:
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        perfil.assinatura_profissional_url
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {perfil.assinatura_profissional_url
                        ? "Cadastrada"
                        : "Não cadastrada"}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(true)}
                className="inline-flex min-w-36 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#9F64AF] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#8B509B] md:self-start"
              >
                <PencilLine size={16} />
                Editar perfil
              </button>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <div className="mb-4 flex items-center gap-2">
                <FaUserShield size={16} className="text-[#9F64AF]" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Informações administrativas
                </h4>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Data de criação
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatarData(perfil.criado_em)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Último acesso
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatarData(perfil.ultimo_acesso)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Status da conta
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {statusLabel(perfil)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {modalAberto && (
        <ModalEditarPerfil
          perfil={perfil}
          isPsicologo={isPsicologo}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}

function ModalEditarPerfil({
  perfil,
  isPsicologo,
  onClose,
}: {
  perfil: PerfilData;
  isPsicologo: boolean;
  onClose: () => void;
}) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const inputAssinaturaRef = useRef<HTMLInputElement>(null);
  const atualizarPerfil = useAtualizarPerfil();
  const atualizarFoto = useAtualizarFotoPerfil();
  const removerFoto = useRemoverFotoPerfil();
  const atualizarAssinatura = useAtualizarAssinaturaProfissional();
  const removerAssinatura = useRemoverAssinaturaProfissional();

  const [nome, setNome] = useState(perfil.nome || "");
  const [telefone, setTelefone] = useState(
    perfil.telefone ? formatarTelefone(perfil.telefone) : "",
  );
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState(perfil.avatar_url || "");
  const [removerFotoAtual, setRemoverFotoAtual] = useState(false);
  const [arquivoAssinatura, setArquivoAssinatura] = useState<File | null>(null);
  const [previewAssinatura, setPreviewAssinatura] = useState(
    perfil.assinatura_profissional_url || "",
  );
  const [removerAssinaturaAtual, setRemoverAssinaturaAtual] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [errosAssinatura, setErrosAssinatura] = useState<ErrosAssinatura>({});

  const documentoLabel = isPsicologo ? "CRP" : "CPF";
  const documentoValor = isPsicologo
    ? perfil.crp || "Não informado"
    : perfil.cpf
      ? formatarCPF(perfil.cpf)
      : "Não informado";
  const inicialPerfil = perfil.nome
    ?.trim()
    ?.charAt(0)
    .toLocaleUpperCase("pt-BR");
  const salvando =
    atualizarPerfil.isPending ||
    atualizarFoto.isPending ||
    removerFoto.isPending ||
    atualizarAssinatura.isPending ||
    removerAssinatura.isPending;

  const validarNomeCampo = (valor: string) => {
    const trimmed = valor.trim();
    if (!trimmed) return "Nome completo é obrigatório";
    if (trimmed.length < 3) return "Nome completo deve ter pelo menos 3 caracteres";
    // Permitir apenas letras (incluindo acentos) e espaços
    // 
    // Uso de Unicode property \p{L} para todas as letras
    const regex = /^[\p{L} ]+$/u;
    if (!regex.test(trimmed))
      return "Nome só pode conter letras e espaços (sem números ou caracteres especiais).";
    return undefined;
  };

  const validarFormulario = () => {
    const novosErros: ErrosFormulario = {};
    const nomeTrim = nome.trim();
    const telefoneNumeros = limparTelefone(telefone);

    const erroNome = validarNomeCampo(nomeTrim);
    if (erroNome) novosErros.nome = erroNome;

    if (
      isPsicologo &&
      telefoneNumeros &&
      ![10, 11].includes(telefoneNumeros.length)
    ) {
      novosErros.telefone = "Informe um telefone válido.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const selecionarFoto = (file: File) => {
    const novosErros: ErrosFormulario = {};

    if (!TIPOS_IMAGEM_PERMITIDOS.includes(file.type)) {
      novosErros.foto = "Arquivo inválido. Use JPG, JPEG, PNG ou WEBP.";
    }

    if (file.size > TAMANHO_MAXIMO_FOTO) {
      novosErros.foto = "A imagem deve ter no máximo 5MB.";
    }

    if (novosErros.foto) {
      setErros((prev) => ({ ...prev, ...novosErros }));
      return;
    }

    setArquivoFoto(file);
    setRemoverFotoAtual(false);
    setErros((prev) => ({ ...prev, foto: undefined }));

    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleRemoverFoto = () => {
    setArquivoFoto(null);
    setFotoPreview("");
    setRemoverFotoAtual(Boolean(perfil.avatar_url));
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  };

  const selecionarAssinatura = (file: File) => {
    const novosErros: ErrosAssinatura = {};

    if (!TIPOS_IMAGEM_PERMITIDOS.includes(file.type)) {
      novosErros.arquivo = "Arquivo inválido. Use JPG, JPEG, PNG ou WEBP.";
    }

    if (file.size > TAMANHO_MAXIMO_FOTO) {
      novosErros.arquivo = "A assinatura deve ter no máximo 5MB.";
    }

    if (novosErros.arquivo) {
      setErrosAssinatura(novosErros);
      return;
    }

    setArquivoAssinatura(file);
    setRemoverAssinaturaAtual(false);
    setErrosAssinatura({});

    const reader = new FileReader();
    reader.onloadend = () => setPreviewAssinatura(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleRemoverAssinatura = () => {
    setArquivoAssinatura(null);
    setPreviewAssinatura("");
    setRemoverAssinaturaAtual(Boolean(perfil.assinatura_profissional_url));
    if (inputAssinaturaRef.current) inputAssinaturaRef.current.value = "";
  };

  const handleSalvar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErros({});

    if (!validarFormulario()) return;

    try {
      await atualizarPerfil.mutateAsync({
        nome: nome.trim(),
        ...(isPsicologo ? { telefone: limparTelefone(telefone) } : {}),
      });

      if (arquivoFoto) {
        await atualizarFoto.mutateAsync(arquivoFoto);
      } else if (removerFotoAtual) {
        await removerFoto.mutateAsync();
      }

      if (arquivoAssinatura) {
        await atualizarAssinatura.mutateAsync(arquivoAssinatura);
      } else if (removerAssinaturaAtual) {
        await removerAssinatura.mutateAsync();
      }

      toast.success("Perfil atualizado com sucesso!");
      onClose();
    } catch (error) {
      setErros({
        geral:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o perfil.",
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !salvando) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, salvando]);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex min-h-screen w-screen items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!salvando) onClose();
      }}
      onKeyDown={(evento) => {
        if (evento.key === "Escape" && !salvando) onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Editar dados pessoais
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Nome, foto e dados profissionais do usuário logado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!salvando) onClose();
            }}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form noValidate onSubmit={handleSalvar} className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-[#F8F3FB] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full border border-[#9F64AF]/25 bg-[#F3EAF8] text-[#9F64AF] shadow-md outline-none transition hover:shadow-lg focus:ring-2 focus:ring-[#9F64AF]/35"
                aria-label="Alterar foto do perfil"
              >
                {fotoPreview ? (
                  <Image
                    src={fotoPreview}
                    alt="Prévia da foto"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <span className="text-3xl font-semibold leading-none text-[#9F64AF]">
                      {inicialPerfil || "?"}
                    </span>
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
                  <PencilLine
                    size={22}
                    className="text-white"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Foto do perfil
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, JPEG, PNG ou WEBP até 5MB. A imagem será salva somente ao
                  confirmar.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#9F64AF] px-3 py-2 text-sm text-white transition hover:bg-[#8B509B]"
                  >
                    <Camera size={15} />
                    Alterar foto
                  </button>
                  {(fotoPreview || perfil.avatar_url) && (
                    <button
                      type="button"
                      onClick={handleRemoverFoto}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      <Trash2 size={15} />
                      Remover
                    </button>
                  )}
                </div>
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(evento) => {
                    const file = evento.target.files?.[0];
                    if (file) selecionarFoto(file);
                  }}
                />
                <ErroCampo mensagem={erros.foto} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="nome-perfil"
                className="mb-1 block text-xs font-medium text-gray-800"
              >
                Nome completo <span className="text-rose-500">*</span>
              </label>
              <input
                id="nome-perfil"
                value={nome}
                onChange={(evento) => {
                  const v = evento.target.value;
                  setNome(v);
                  // validação em tempo real para feedback imediato se já houver erro
                  if (erros.nome) {
                    const campoErro = validarNomeCampo(v);
                    setErros((prev) => ({ ...prev, nome: campoErro }));
                  }
                }}
                onBlur={() => {
                  const campoErro = validarNomeCampo(nome);
                  setErros((prev) => ({ ...prev, nome: campoErro }));
                }}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
                  erros.nome ? "border-rose-300" : "border-gray-300"
                }`}
              />
              <ErroCampo mensagem={erros.nome} />
            </div>

            {isPsicologo ? (
              <div>
                <label
                  htmlFor="telefone-perfil"
                  className="mb-1 block text-xs font-medium text-gray-800"
                >
                  Telefone
                </label>
                <input
                  id="telefone-perfil"
                  inputMode="numeric"
                  value={telefone}
                  onChange={(evento) =>
                    setTelefone(aplicarMascaraTelefone(evento.target.value))
                  }
                  placeholder="(00) 00000-0000"
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#9F64AF] ${
                    erros.telefone ? "border-rose-300" : "border-gray-300"
                  }`}
                />
                <ErroCampo mensagem={erros.telefone} />
              </div>
            ) : null}

            <div>
              <label
                htmlFor="perfil-cargo"
                className="mb-1 block text-xs font-medium text-gray-800"
              >
                Perfil/Cargo
              </label>
              <input
                id="perfil-cargo"
                value={perfilLabel(perfil, isPsicologo)}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="documento-perfil"
                className="mb-1 block text-xs font-medium text-gray-800"
              >
                {documentoLabel}
              </label>
              <input
                id="documento-perfil"
                value={documentoValor}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Campo somente leitura neste módulo.
              </p>
            </div>
          </div>

          {isPsicologo && (
            <div className="rounded-2xl border border-gray-100 bg-[#F8F3FB]/70 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#9F64AF]/10 p-2 text-[#9F64AF]">
                  <Signature size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Assinatura profissional
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        perfil.assinatura_profissional_url &&
                        !removerAssinaturaAtual
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {statusAssinaturaLabel(perfil, removerAssinaturaAtual)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Assinatura usada para prontuários e relatórios.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-[#9F64AF]/20 bg-white px-4 py-3">
                      {previewAssinatura ||
                      perfil.assinatura_profissional_url ? (
                        <Image
                          src={
                            previewAssinatura ||
                            perfil.assinatura_profissional_url ||
                            ""
                          }
                          alt="Assinatura profissional"
                          width={280}
                          height={90}
                          className="h-auto max-h-20 w-auto max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">
                          Nenhuma assinatura cadastrada
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => inputAssinaturaRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#9F64AF] px-3 py-2 text-sm text-white transition hover:bg-[#8B509B]"
                      >
                        <Camera size={15} />
                        {perfil.assinatura_profissional_url &&
                        !removerAssinaturaAtual
                          ? "Alterar assinatura"
                          : "Enviar assinatura"}
                      </button>
                      {(previewAssinatura ||
                        perfil.assinatura_profissional_url) && (
                        <button
                          type="button"
                          onClick={handleRemoverAssinatura}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                        >
                          <Trash2 size={15} />
                          Remover assinatura
                        </button>
                      )}
                    </div>

                    <input
                      ref={inputAssinaturaRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(evento) => {
                        const file = evento.target.files?.[0];
                        if (file) selecionarAssinatura(file);
                      }}
                    />
                    <ErroCampo mensagem={errosAssinatura.arquivo} />
                    <ErroCampo mensagem={errosAssinatura.geral} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {erros.geral && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {erros.geral}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => {
                if (!salvando) onClose();
              }}
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
