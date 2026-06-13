"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CalendarOff,
  CalendarX2,
  Clock,
  ExternalLink,
  FileText,
  History,
  MapPin,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendarCheck, LuCalendarRange } from "react-icons/lu";
import { toast } from "sonner";
import {
  type AgendaStatus,
  obterAgendaStatusConfig,
} from "../constants/agendaStatusConfig";
import { useAtualizarConsulta } from "../hooks/useAgenda";
import type { ConsultaAgenda } from "./CalendarioAgenda";
import ModalConfirmacaoConsulta from "./ModalConfirmacaoConsulta";

interface PainelDetalhesConsultaProps {
  consulta?: ConsultaAgenda | null;
  aberto: boolean;
  onClose: () => void;
  onRemarcar: (consulta: ConsultaAgenda) => void;
}

type AcaoConfirmacao = "cancelar" | "falta" | "concluir";

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

function dadosConfirmacao(acao?: AcaoConfirmacao) {
  if (acao === "cancelar") {
    return {
      titulo: "Cancelar consulta",
      descricao:
        "A consulta será mantida no histórico, mas deixará de ocupar sala e horário operacional. Após esta ação, você poderá reagendar a consulta se necessário.",
      textoConfirmar: "Cancelar consulta",
      status: "cancelado" as AgendaStatus,
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
      status: "falta" as AgendaStatus,
      toast: "Paciente marcado como falta",
      variante: "aviso" as const,
    };
  }
  return {
    titulo: "Concluir consulta",
    descricao:
      "A consulta será marcada como concluída e ficará preparada para integração futura com o prontuário.",
    textoConfirmar: "Concluir consulta",
    status: "concluido" as AgendaStatus,
    toast: "Consulta concluída",
    variante: "sucesso" as const,
  };
}

export default function PainelDetalhesConsulta({
  consulta,
  aberto,
  onClose,
  onRemarcar,
}: PainelDetalhesConsultaProps) {
  const [montado, setMontado] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] =
    useState<AcaoConfirmacao | null>(null);
  const atualizarConsulta = useAtualizarConsulta();

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  if (!aberto || !consulta || !montado) return null;

  const config = obterAgendaStatusConfig(consulta.status);
  const IconeStatus = config.icone;
  const agendaFechada = Boolean(consulta.fechado_dia);
  const podeOperar = !agendaFechada;
  const tipoAtendimento =
    consulta.tipo_atendimento === "outro" && consulta.tipo_outro
      ? consulta.tipo_outro
      : tipoAtendimentoLabel[consulta.tipo_atendimento];
  const confirmacao = dadosConfirmacao(acaoConfirmacao || "concluir");

  const confirmarMudancaStatus = async () => {
    if (!acaoConfirmacao) return;

    const dados = dadosConfirmacao(acaoConfirmacao);

    try {
      // Mudanças críticas de status passam por confirmação e pela mutation
      // central da Agenda, mantendo cache e regras futuras de prontuário.
      await atualizarConsulta.mutateAsync({
        id: consulta.id,
        dados: { status: dados.status },
      });
      toast.success(dados.toast);
      setAcaoConfirmacao(null);
      onClose();
    } catch (error) {
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
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar detalhes"
          >
            <X size={20} />
          </button>

          <div className="border-[#9F64AF]/10 border-b px-6 pt-6 pb-5 pr-14">
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
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${config.badge}`}
                    title={config.descricao}
                  >
                    <IconeStatus size={14} />
                    {config.texto}
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

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Dados da consulta
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <LinhaDetalhe
                  icone={User}
                  label="Paciente"
                  valor={consulta.paciente_nome}
                />
                <AvatarPsicologo
                  nome={consulta.psicologo_nome}
                  avatarUrl={consulta.psicologo_avatar_url}
                />
                <LinhaDetalhe
                  icone={MapPin}
                  label="Sala"
                  valor={consulta.sala_nome}
                />
                <LinhaDetalhe
                  icone={CalendarClock}
                  label="Data"
                  valor={formatarData(consulta.data_consulta)}
                />
                <LinhaDetalhe
                  icone={Clock}
                  label="Horário"
                  valor={`${horaCurta(consulta.horario_inicio)} às ${horaCurta(
                    consulta.horario_fim,
                  )}`}
                />
                <LinhaDetalhe
                  icone={FileText}
                  label="Tipo de atendimento"
                  valor={tipoAtendimento}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#9F64AF]/10 bg-[#FBF7FF] p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase">
                  Observações
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {consulta.observacoes || "Nenhuma observação registrada."}
                </p>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-[#9F64AF]/10 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#9F64AF]">
                  <History size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Histórico da consulta
                  </h3>
                  <p className="text-xs text-gray-500">
                    Alterações e movimentações operacionais.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-[#D9BCE8] bg-[#FBF7FF] p-4">
                <div className="flex items-start gap-3 text-sm text-gray-500">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#9F64AF]">
                    <History size={14} />
                  </span>
                  <div>
                    <p className="font-medium text-gray-700">
                      Nenhuma movimentação registrada para esta consulta.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Alterações futuras aparecerão aqui em formato de linha do
                      tempo.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {"preparaProntuario" in config.regras &&
              config.regras.preparaProntuario && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        Prontuário preparado para esta consulta
                      </p>
                      <p className="mt-1 leading-6">
                        A integração futura usará consulta_id {consulta.id},
                        paciente_id {consulta.paciente_id}, psicologo_id{" "}
                        {consulta.psicologo_id} e status concluído para evolução
                        clínica, relatórios e documentos.
                      </p>
                      <button
                        type="button"
                        disabled
                        title="Em breve"
                        className="mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-700 opacity-70"
                      >
                        <ExternalLink size={14} />
                        Abrir prontuário
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px]">
                          Em breve
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {podeOperar &&
            (config.regras.podeEditar ||
              config.regras.podeRemarcar ||
              config.regras.podeCancelar ||
              config.regras.podeMarcarFalta ||
              config.regras.podeConcluir) ? (
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Ações
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {(consulta.status === "agendado" ||
                    consulta.status === "remarcado") && (
                    <button
                      type="button"
                      onClick={() => onRemarcar(consulta)}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarClock size={14} className="shrink-0" />
                      Reagendar consulta
                    </button>
                  )}
                  {config.regras.podeCancelar && (
                    <button
                      type="button"
                      onClick={() => setAcaoConfirmacao("cancelar")}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarX2 size={14} className="shrink-0" />
                      Cancelar
                    </button>
                  )}
                  {config.regras.podeMarcarFalta && (
                    <button
                      type="button"
                      onClick={() => setAcaoConfirmacao("falta")}
                      className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#9F64AF]/20 bg-[#9F64AF]/20 px-3.5 text-xs font-medium leading-none text-[#9F64AF] transition hover:bg-[#9F64AF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarOff size={14} className="shrink-0" />
                      Marcar falta
                    </button>
                  )}
                  {config.regras.podeConcluir && (
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
            ) : (
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                Esta consulta está disponível apenas para histórico.
              </div>
            )}
          </div>
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
