"use client";

import { motion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { BiTransfer } from "react-icons/bi";
import { MdErrorOutline } from "react-icons/md";
import type {
  PreviaInativacaoUsuario,
  PsicologoTransferenciaOpcao,
  UsuarioSistema,
} from "../types/usuariosSistema.types";

interface ModalTransferirEInativarUsuarioProps {
  aberto: boolean;
  usuario: UsuarioSistema | null;
  previa: PreviaInativacaoUsuario | null;
  confirmando?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    transferir_pacientes_para_id: number;
    motivo_transferencia_pacientes: string;
    observacoes_transferencia_pacientes?: string | null;
    transferir_admin_para_id?: number | null;
  }) => void;
}

interface DropdownPsicologoProps {
  id: string;
  label: string;
  placeholder: string;
  opcoes: PsicologoTransferenciaOpcao[];
  valor: number | null;
  erro?: string;
  obrigatorio?: boolean;
  onChange: (id: number) => void;
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

function normalizarTextoValidacao(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function textoComQualidade(valor: string, opcional = false) {
  const texto = valor.trim();
  if (!texto) return opcional;

  const normalizado = normalizarTextoValidacao(texto);
  const apenasLetrasNumeros = normalizado.replace(/[^a-z0-9\s]/g, " ");
  const palavras = apenasLetrasNumeros
    .split(/\s+/)
    .filter((palavra) => palavra.length > 0);
  const palavrasUnicas = new Set(palavras);
  const genericosInvalidos = [
    "teste",
    "testando",
    "asdasd",
    "asdf",
    "qwerty",
    "hjkhjk",
    "dsj",
  ];

  if (texto.length < 15) return false;
  if (/^\d+$/.test(normalizado.replace(/\s/g, ""))) return false;
  if (/(.)\1{3,}/.test(normalizado.replace(/\s/g, ""))) return false;
  if (palavras.length < 3) return false;
  if (palavrasUnicas.size <= 1) return false;
  if (genericosInvalidos.some((termo) => normalizado.includes(termo))) {
    return false;
  }
  if (/^[a-z0-9]+$/.test(normalizado) && !normalizado.includes(" ")) {
    return false;
  }

  return true;
}

function DropdownPsicologo({
  id,
  label,
  placeholder,
  opcoes,
  valor,
  erro,
  obrigatorio = false,
  onChange,
}: DropdownPsicologoProps) {
  const [aberto, setAberto] = useState(false);
  const selecionado = opcoes.find((opcao) => opcao.id === valor);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
        {obrigatorio ? <span className="ml-1 text-rose-500">*</span> : null}
      </p>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition ${
            erro
              ? "border-rose-200 text-rose-700"
              : "border-gray-200 text-gray-800 hover:border-[#9F64AF]/50 focus:border-[#9F64AF] focus:ring-2 focus:ring-[#9F64AF]/15"
          }`}
        >
          <span className={selecionado ? "truncate" : "truncate text-gray-400"}>
            {selecionado?.nome || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-[#9F64AF] transition ${
              aberto ? "rotate-180" : ""
            }`}
          />
        </button>

        {aberto ? (
          <div className="absolute left-0 right-0 z-[10000] mt-2 overflow-hidden rounded-xl border border-[#E8DDF0] bg-white shadow-xl">
            <div className="max-h-44 overflow-y-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-300/50">
              {opcoes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  Nenhum psicólogo ativo disponível.
                </p>
              ) : (
                opcoes.map((opcao) => {
                  const ativo = opcao.id === valor;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => {
                        onChange(opcao.id);
                        setAberto(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#F7F1FA] ${
                        ativo ? "bg-[#F3EAF8] text-[#7E4A8F]" : "text-gray-700"
                      }`}
                    >
                      <span className="truncate">{opcao.nome}</span>
                      {ativo ? (
                        <Check size={15} className="shrink-0 text-[#9F64AF]" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
      <ErroCampo mensagem={erro} />
    </div>
  );
}

export default function ModalTransferirEInativarUsuario({
  aberto,
  usuario,
  previa,
  confirmando = false,
  onClose,
  onConfirm,
}: ModalTransferirEInativarUsuarioProps) {
  const destinoId = useId();
  const adminId = useId();
  const motivoId = useId();
  const observacoesId = useId();
  const [psicologoResponsavelId, setPsicologoResponsavelId] = useState<
    number | null
  >(null);
  const [adminDestinoId, setAdminDestinoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<{
    destino?: string;
    admin?: string;
    motivo?: string;
    observacoes?: string;
  }>({});

  const precisaTransferenciaAdministrativa = Boolean(
    previa?.deve_transferir_administracao,
  );
  const psicologosDisponiveis = useMemo(
    () => previa?.psicologos_transferencia || [],
    [previa?.psicologos_transferencia],
  );

  useEffect(() => {
    if (!aberto) return;
    setPsicologoResponsavelId(null);
    setAdminDestinoId(null);
    setMotivo("");
    setObservacoes("");
    setErros({});
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  if (!aberto || !usuario || !previa) return null;

  function validar() {
    const novosErros: typeof erros = {};

    if (!psicologoResponsavelId) {
      novosErros.destino = "A transferência é obrigatória antes da inativação.";
    }

    if (!textoComQualidade(motivo)) {
      novosErros.motivo = "Informe um motivo válido para a transferência.";
    }

    if (!textoComQualidade(observacoes, true)) {
      novosErros.observacoes =
        "Informe uma observação válida ou deixe o campo vazio.";
    }

    if (precisaTransferenciaAdministrativa && !adminDestinoId) {
      novosErros.admin = "Selecione o novo responsável institucional.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleConfirm() {
    if (!validar()) return;

    onConfirm({
      transferir_pacientes_para_id: Number(psicologoResponsavelId),
      motivo_transferencia_pacientes: motivo.trim(),
      observacoes_transferencia_pacientes: observacoes.trim() || null,
      transferir_admin_para_id: adminDestinoId || undefined,
    });
  }

  const possuiVinculos =
    Number(previa.resumo.total_pacientes_vinculados) > 0 ||
    Number(previa.resumo.agendamentos_futuros) > 0;
  const semPsicologosDisponiveis =
    possuiVinculos && psicologosDisponiveis.length === 0;
  const erroPsicologoResponsavel =
    erros.destino ||
    (!psicologoResponsavelId
      ? "A transferência é obrigatória antes da inativação."
      : undefined);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-gray-400 transition hover:text-[#9F64AF]"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="shrink-0 px-5 pb-3 pt-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F3EAF8]">
            <BiTransfer size={23} className="text-[#9F64AF]" />
          </div>

          <h3 className="pr-8 text-lg font-semibold text-gray-800">
            Transferir e inativar psicólogo
          </h3>
          <p className="mt-1.5 text-sm text-gray-600">
            Selecione o profissional que assumirá os pacientes e consultas
            futuras.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-300/50">
          <div className="rounded-2xl border border-[#E8DDF0] bg-[#FAF7FC] px-4 py-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <MdErrorOutline
                size={16}
                className="mt-0.5 shrink-0 text-[#9F64AF]"
              />
              <div>
                <p className="font-semibold text-gray-800">
                  Transferência de acompanhamento
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Pacientes vinculados e consultas futuras serão transferidos
                  para o profissional selecionado. O histórico clínico
                  permanecerá preservado.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4 pb-2">
            <DropdownPsicologo
              id={destinoId}
              label="Novo psicólogo responsável"
              placeholder="Selecione um psicólogo"
              opcoes={psicologosDisponiveis}
              valor={psicologoResponsavelId}
              erro={erroPsicologoResponsavel}
              obrigatorio
              onChange={(id) => {
                setPsicologoResponsavelId(id);
                setErros((atual) => ({ ...atual, destino: undefined }));
              }}
            />

            {semPsicologosDisponiveis ? (
              <p className="flex items-center gap-1 text-xs text-amber-700">
                <MdErrorOutline size={14} />
                Não há psicólogo ativo disponível para receber a transferência.
              </p>
            ) : null}

            {precisaTransferenciaAdministrativa ? (
              <div className="space-y-3 rounded-2xl border border-[#F3EAF8] bg-[#FAF7FC] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Responsável institucional
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Este psicólogo também responde pela clínica. Defina quem
                    assumirá essa responsabilidade.
                  </p>
                </div>
                <DropdownPsicologo
                  id={adminId}
                  label="Novo responsável da clínica"
                  placeholder="Selecione um responsável"
                  opcoes={psicologosDisponiveis}
                  valor={adminDestinoId}
                  erro={erros.admin}
                  onChange={(id) => {
                    setAdminDestinoId(id);
                    setErros((atual) => ({ ...atual, admin: undefined }));
                  }}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor={motivoId}
                className="block text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Motivo
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <textarea
                id={motivoId}
                value={motivo}
                onChange={(event) => {
                  setMotivo(event.target.value);
                  setErros((atual) => ({ ...atual, motivo: undefined }));
                }}
                rows={2}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 ${
                  erros.motivo
                    ? "border-rose-200 focus:border-rose-300 focus:ring-rose-100"
                    : "border-gray-200 focus:border-[#9F64AF] focus:ring-[#9F64AF]/15"
                }`}
                placeholder="Informe o motivo da transferência"
              />
              <ErroCampo mensagem={erros.motivo} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor={observacoesId}
                className="block text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Observações
              </label>
              <textarea
                id={observacoesId}
                value={observacoes}
                onChange={(event) => {
                  setObservacoes(event.target.value);
                  setErros((atual) => ({
                    ...atual,
                    observacoes: undefined,
                  }));
                }}
                rows={2}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 ${
                  erros.observacoes
                    ? "border-rose-200 focus:border-rose-300 focus:ring-rose-100"
                    : "border-gray-200 focus:border-[#9F64AF] focus:ring-[#9F64AF]/15"
                }`}
                placeholder="Opcional"
              />
              <ErroCampo mensagem={erros.observacoes} />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={
                confirmando ||
                semPsicologosDisponiveis ||
                !psicologoResponsavelId
              }
              className="flex-1 rounded-lg bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:opacity-50"
            >
              {confirmando ? "Processando..." : "Transferir e inativar"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
