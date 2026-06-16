"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  CalendarOff,
  CalendarX2,
  Clock,
  ChevronLeft,
  FileText,
  MapPin,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { LuCalendarCheck, LuCalendarRange } from "react-icons/lu";
import { toast } from "sonner";
import {
  type AgendaStatus,
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "../constants/agendaStatusConfig";
import { CHAVE_AGENDA, useAtualizarConsulta } from "../hooks/useAgenda";
import type { ConsultaAgenda } from "./CalendarioAgenda";
import ModalConfirmacaoConsulta from "./ModalConfirmacaoConsulta";
import type { StatusProntuario } from "@/app/prontuario/hooks/useProntuario";
import { CHAVE_PRONTUARIOS } from "@/app/prontuario/hooks/useProntuario";

interface PainelDetalhesConsultaProps {
  consulta?: ConsultaAgenda | null;
  aberto: boolean;
  onClose: () => void;
  onVoltar?: () => void;
  onRegistrarProntuario: (consulta: ConsultaAgenda) => void;
  onAbrirProntuario: (consulta: ConsultaAgenda) => void;
  onRemarcar: (consulta: ConsultaAgenda) => void;
  prontuarioStatus?: StatusProntuario | null;
  mostrarVoltar?: boolean;
}

type AcaoConfirmacao = "cancelar" | "falta" | "concluir";
type StatusConsultaOperacional = Exclude<AgendaStatus, "pendente">;

const STATUS_CONSULTA_PRONTUARIO_INICIADO = [
  "em_andamento",
  "iniciado",
  "iniciada",
  "concluido",
  "concluida",
  "realizado",
  "realizada",
];

const STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL = [
  "agendado",
  "agendada",
  "remarcado",
  "remarcada",
  "pendente",
];

const STATUS_CONSULTA_PRONTUARIO_BLOQUEADO = [
  "cancelado",
  "cancelada",
  "falta",
  "excluido",
  "excluida",
];

const tipoAtendimentoLabel: Record<ConsultaAgenda["tipo_atendimento"], string> =
  {
    triagem: "Triagem",
    psicoterapia: "Psicoterapia",
    devolutiva: "Devolutiva",
    avaliacao: "Avaliação",
    orientacao: "Orientação",
    retorno: "Retorno",
    alta: "Alta",
    outro: "Outro",
  };

function formatarData(data: string) {
  const date = new Date(`${data}T00:00:00`);
  if (Number.isNaN(date.getTime())) return data;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function horaCurta(hora: string) {
  return hora?.slice(0, 5) || "";
}

function consultaJaPassou(consulta: {
  data_consulta: string;
  horario_fim: string;
}) {
  const data = String(consulta.data_consulta).slice(0, 10);
  const fim = new Date(`${data}T${horaCurta(consulta.horario_fim)}`);

  if (Number.isNaN(fim.getTime())) {
    return false;
  }

  return new Date() > fim;
}

function consultaEstaNoHorarioAtual(consulta: {
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
}) {
  const data = String(consulta.data_consulta).slice(0, 10);
  const inicio = new Date(`${data}T${horaCurta(consulta.horario_inicio)}`);
  const fim = new Date(`${data}T${horaCurta(consulta.horario_fim)}`);
  const agora = new Date();

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return false;
  }

  return agora >= inicio && agora <= fim;
}

function consultaPermiteRegistroProntuario(consulta: {
  status: string;
  data_consulta: string;
  horario_inicio: string;
  horario_fim: string;
}) {
  const status = consulta.status.trim().toLowerCase();
  if (STATUS_CONSULTA_PRONTUARIO_INICIADO.includes(status)) return true;

  return (
    STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status) &&
    consultaEstaNoHorarioAtual(consulta)
  );
}

function toastProntuarioInfo(mensagem: string) {
  toast.custom(
    (id) => (
      <div className="flex w-full max-w-sm items-start gap-2 rounded-2xl border border-[#E5D9F3] bg-[#F6F0FA] px-4 py-3 text-[#2F2436] shadow-lg shadow-[#9F64AF]/10">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#9F64AF]" />
        <p className="text-sm leading-5">{mensagem}</p>
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          className="ml-auto rounded-full p-1 text-[#9F64AF] transition hover:bg-[#EDE0F5]"
          aria-label="Fechar aviso"
        >
          <X size={14} />
        </button>
      </div>
    ),
    { duration: 5000 },
  );
}

function LinhaDetalhe({
  icone: Icone,
  label,
  valor,
}: {
  icone: typeof User;
  label: string;
  valor: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#9F64AF]/10 bg-white/70 p-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
        <Icone size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-gray-700">{valor}</p>
      </div>
    </div>
  );
}

function AvatarPsicologo({
  nome,
  avatarUrl,
}: {
  nome: string;
  avatarUrl?: string | null;
}) {
  const inicial = nome?.trim()?.charAt(0)?.toUpperCase() || "P";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F3EAF8]/60 p-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E1D4F0] text-sm font-semibold text-[#9F64AF]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={nome}
            width={36}
            height={36}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          inicial
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase">
          Psicólogo
        </p>
        <p className="truncate text-sm font-medium text-gray-700">{nome}</p>
      </div>
    </div>
  );
}

function LinhaProntuario({
  disponivel,
  statusProntuario,
  onRegistrarProntuario,
  onAbrirProntuario,
}: {
  disponivel: boolean;
  statusProntuario?: StatusProntuario | null;
  onRegistrarProntuario: () => void;
  onAbrirProntuario: () => void;
}) {
  const temProntuario = Boolean(statusProntuario);
  const assinado = statusProntuario === "assinado";
  const valorPrincipal = !temProntuario
    ? "Não registrado"
    : assinado
      ? "Assinado digitalmente"
      : statusProntuario === "rascunho"
        ? "Rascunho"
        : "Finalizado";
  const badge = !temProntuario
    ? { texto: "Pendente", classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]" }
    : assinado
      ? { texto: "Assinado", classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]" }
      : statusProntuario === "rascunho"
        ? { texto: "Rascunho", classe: "border-amber-100 bg-amber-50 text-amber-700" }
        : { texto: "Finalizado", classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]" };
  const acao = !temProntuario ? onRegistrarProntuario : onAbrirProntuario;
  const labelAcao = !temProntuario ? "Registrar prontuário" : "Abrir prontuário";

  return (
    <div className="flex gap-3 rounded-2xl border border-[#9F64AF]/10 bg-white/70 p-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
        <FileText size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase">
          Prontuário
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-700">
            {valorPrincipal}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.classe}`}
          >
            {badge.texto}
          </span>
        </div>
        <button
          type="button"
          onClick={acao}
          title={labelAcao}
          className={`mt-2 inline-flex items-center rounded-lg px-0 text-xs font-semibold transition ${
            disponivel
              ? "cursor-pointer text-[#9F64AF] hover:text-[#8B509B]"
              : "cursor-pointer text-[#9F64AF] opacity-70 hover:text-[#8B509B]"
          }`}
        >
          {labelAcao}
        </button>
      </div>
    </div>
  );
}

function dadosConfirmacao(acao?: AcaoConfirmacao) {
  if (acao === "cancelar") {
    return {
      titulo: "Cancelar consulta",
      descricao:
        "A consulta será mantida no histórico, mas deixará de ocupar sala e horário operacional. Após esta ação, você poderá reagendar a consulta se necessário.",
      textoConfirmar: "Cancelar consulta",
      status: "cancelado" as StatusConsultaOperacional,
      toast: "Consulta cancelada",
      variante: "perigo" as const,
    };
  }
  if (acao === "falta") {
    return {
      titulo: "Marcar falta",
      descricao:
        "O paciente será marcado como falta nesta consulta. A informação ficará disponível no histórico. Após esta ação, você poderá reagendar a consulta se necessário.",
      textoConfirmar: "Marcar falta",
      status: "falta" as StatusConsultaOperacional,
      toast: "Paciente marcado como falta",
      variante: "aviso" as const,
    };
  }
  return {
    titulo: "Concluir consulta",
    descricao:
      "A consulta será marcada como concluída e ficará preparada para integração futura com o prontuário.",
    textoConfirmar: "Concluir consulta",
    status: "concluido" as StatusConsultaOperacional,
    toast: "Consulta concluída",
    variante: "sucesso" as const,
  };
}

export default function PainelDetalhesConsulta({
  consulta,
  aberto,
  onClose,
  onVoltar,
  onRegistrarProntuario,
  onAbrirProntuario,
  mostrarVoltar = false,
  onRemarcar,
  prontuarioStatus,
}: PainelDetalhesConsultaProps) {
  const [montado, setMontado] = useState(false);
  const [consultaExibida, setConsultaExibida] = useState<ConsultaAgenda | null>(
    consulta || null,
  );
  const [acaoConfirmacao, setAcaoConfirmacao] =
    useState<AcaoConfirmacao | null>(null);
  const queryClient = useQueryClient();
  const atualizarConsulta = useAtualizarConsulta();

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    setConsultaExibida(consulta || null);
  }, [consulta]);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  if (!aberto || !consulta || !montado) return null;

  const consultaAtual = consultaExibida || consulta;
  const statusConsultaAtual = consultaAtual.status.trim().toLowerCase();

  const statusVisual = obterStatusConsultaExibicao(consultaAtual);
  const configVisual = obterAgendaStatusConfig(statusVisual);
  const configOperacional = obterAgendaStatusConfig(consultaAtual.status);
  const IconeStatus = configVisual.icone;
  const agendaFechada = Boolean(consultaAtual.fechado_dia);
  const podeOperar = !agendaFechada;
  const tipoAtendimento =
    consultaAtual.tipo_atendimento === "outro" && consultaAtual.tipo_outro
      ? consultaAtual.tipo_outro
      : tipoAtendimentoLabel[consultaAtual.tipo_atendimento];
  const confirmacao = dadosConfirmacao(acaoConfirmacao || "concluir");
  const prontuarioDisponivel =
    consultaPermiteRegistroProntuario(consultaAtual);
  const statusProntuarioEfetivo =
    prontuarioStatus || consultaAtual.prontuario_status || null;

  const aplicarUpdateOtimista = (consultaAtualizada: ConsultaAgenda) => {
    queryClient.setQueriesData(
      { queryKey: CHAVE_AGENDA, exact: false },
      (cacheAntigo: unknown) => {
        if (!cacheAntigo || typeof cacheAntigo !== "object") return cacheAntigo;

        const cache = cacheAntigo as {
          data?: ConsultaAgenda[] | { data?: ConsultaAgenda[] };
        };

        if (Array.isArray(cache.data)) {
          return {
            ...cache,
            data: cache.data.map((item) =>
              item.id === consultaAtualizada.id ? consultaAtualizada : item,
            ),
          };
        }

        if (
          cache.data &&
          typeof cache.data === "object" &&
          Array.isArray(cache.data.data)
        ) {
          return {
            ...cache,
            data: {
              ...cache.data,
              data: cache.data.data.map((item) =>
                item.id === consultaAtualizada.id ? consultaAtualizada : item,
              ),
            },
          };
        }

        return cacheAntigo;
      },
    );
  };

  const registrarProntuario = () => {
    const status = statusConsultaAtual;

    if (consultaPermiteRegistroProntuario(consultaAtual)) {
      onClose();
      onRegistrarProntuario(consultaAtual);
      return;
    }

    if (
      STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status) &&
      consultaJaPassou(consulta)
    ) {
      toastProntuarioInfo(
        "O horário desta consulta já passou. Marque a consulta como concluída para registrar o prontuário.",
      );
      return;
    }

    if (STATUS_CONSULTA_PRONTUARIO_HORARIO_ATUAL.includes(status)) {
      toastProntuarioInfo("Este atendimento ainda não foi iniciado.");
      return;
    }

    if (STATUS_CONSULTA_PRONTUARIO_BLOQUEADO.includes(status)) {
      toastProntuarioInfo(
        "Não é possível registrar o prontuário para esta consulta.",
      );
      return;
    }

    toastProntuarioInfo(
      "Marque a consulta como concluída para registrar o prontuário.",
    );
  };

  const confirmarMudancaStatus = async () => {
    if (!acaoConfirmacao) return;

    const dadosAcao = dadosConfirmacao(acaoConfirmacao);
    const consultaAtualizada = {
      ...consultaAtual,
      status: dadosAcao.status,
    } as ConsultaAgenda;

    // Atualiza painel e calendário imediatamente, sem esperar o servidor
    setConsultaExibida(consultaAtualizada);
    aplicarUpdateOtimista(consultaAtualizada);

    try {
      await atualizarConsulta.mutateAsync({
        id: consultaAtual.id,
        dados: { status: dadosAcao.status },
      });
      // onSuccess já invalida ["agenda"] e ["agenda-disponibilidade"]
      // Invalida prontuários pois o status da consulta afeta o que pode ser registrado
      queryClient.invalidateQueries({ queryKey: CHAVE_PRONTUARIOS });
      toast.success(dadosAcao.toast);
      setAcaoConfirmacao(null);
    } catch (error) {
      // Rollback: reverte painel e força refetch para restaurar dados reais
      setConsultaExibida(consultaAtual);
      queryClient.invalidateQueries({ queryKey: CHAVE_AGENDA });
      const mensagem =
        error instanceof Error ? error.message : "Erro ao atualizar consulta";
      toast.error(mensagem);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/35 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.section
          initial={{ y: 18, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/20 bg-white shadow-2xl"
        >
          {mostrarVoltar && onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              className="absolute top-4 left-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Voltar para consultas do dia"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar detalhes"
          >
            <X size={20} />
          </button>

          <div
            className={`border-[#9F64AF]/10 border-b px-6 pt-6 pb-5 ${
              mostrarVoltar ? "pl-14 pr-14" : "pr-14"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#9F64AF]">
                <LuCalendarRange size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-800">
                  Detalhes da consulta
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Visualize dados operacionais e histórico da consulta.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${configVisual.badge}`}
                    title={configVisual.descricao}
                  >
                    <IconeStatus size={14} />
                    {configVisual.texto}
                  </span>
                  {agendaFechada && (
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                      Somente histórico
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="agenda-detalhes-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Dados da consulta
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <LinhaDetalhe
                  icone={User}
                  label="Paciente"
                  valor={consultaAtual.paciente_nome}
                />
                <AvatarPsicologo
                  nome={consultaAtual.psicologo_nome}
                  avatarUrl={consultaAtual.psicologo_avatar_url}
                />
                <LinhaDetalhe
                  icone={MapPin}
                  label="Sala"
                  valor={consultaAtual.sala_nome}
                />
                <LinhaDetalhe
                  icone={CalendarClock}
                  label="Data"
                  valor={formatarData(consultaAtual.data_consulta)}
                />
                <LinhaDetalhe
                  icone={Clock}
                  label="Horário"
                  valor={`${horaCurta(consultaAtual.horario_inicio)} às ${horaCurta(
                    consultaAtual.horario_fim,
                  )}`}
                />
                <LinhaDetalhe
                  icone={FileText}
                  label="Tipo de atendimento"
                  valor={tipoAtendimento}
                />
                <LinhaProntuario
                  disponivel={prontuarioDisponivel}
                  statusProntuario={statusProntuarioEfetivo}
                  onRegistrarProntuario={registrarProntuario}
                  onAbrirProntuario={() => onAbrirProntuario(consultaAtual)}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#9F64AF]/10 bg-[#FBF7FF] p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase">
                  Observações
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {consultaAtual.observacoes || "Nenhuma observação registrada."}
                </p>
              </div>
            </section>

            {podeOperar &&
            (configOperacional.regras.podeEditar ||
              configOperacional.regras.podeRemarcar ||
              configOperacional.regras.podeCancelar ||
              configOperacional.regras.podeMarcarFalta ||
              configOperacional.regras.podeConcluir) ? (
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Ações
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {(statusConsultaAtual === "agendado" ||
                    statusConsultaAtual === "remarcado") && (
                    <button
                      type="button"
                      onClick={() => onRemarcar(consultaAtual)}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarClock size={14} className="shrink-0" />
                      Reagendar consulta
                    </button>
                  )}
                  {configOperacional.regras.podeCancelar && (
                    <button
                      type="button"
                      onClick={() => setAcaoConfirmacao("cancelar")}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarX2 size={14} className="shrink-0" />
                      Cancelar
                    </button>
                  )}
                  {configOperacional.regras.podeMarcarFalta && (
                    <button
                      type="button"
                      onClick={() => setAcaoConfirmacao("falta")}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarOff size={14} className="shrink-0" />
                      Marcar falta
                    </button>
                  )}
                  {configOperacional.regras.podeConcluir && (
                    <button
                      type="button"
                      onClick={() => setAcaoConfirmacao("concluir")}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LuCalendarCheck size={14} className="shrink-0" />
                      Marcar como concluída
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <style jsx global>{`
            .agenda-detalhes-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(159, 100, 175, 0.45) transparent;
            }
            .agenda-detalhes-scroll::-webkit-scrollbar {
              width: 7px;
            }
            .agenda-detalhes-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .agenda-detalhes-scroll::-webkit-scrollbar-thumb {
              background: rgba(159, 100, 175, 0.35);
              border-radius: 999px;
            }
            .agenda-detalhes-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(159, 100, 175, 0.55);
            }
          `}</style>
        </motion.section>
      </div>

      <ModalConfirmacaoConsulta
        aberto={Boolean(acaoConfirmacao)}
        titulo={confirmacao.titulo}
        descricao={confirmacao.descricao}
        textoConfirmar={confirmacao.textoConfirmar}
        variante={confirmacao.variante}
        carregando={atualizarConsulta.isPending}
        onClose={() => setAcaoConfirmacao(null)}
        onConfirmar={confirmarMudancaStatus}
      />
    </>,
    document.body,
  );
}
