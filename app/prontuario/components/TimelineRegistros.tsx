"use client";

import Highlight from "@tiptap/extension-highlight";
import TiptapUnderline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarClock,
  DoorOpen,
  FileCheck,
  FileText,
  PenLine,
  PencilLine,
  Signature,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  obterAgendaStatusConfig,
  obterStatusConsultaExibicao,
} from "@/app/agenda/constants/agendaStatusConfig";
import type {
  RegistroClinico,
  StatusProntuario,
  TipoAtendimentoProntuario,
} from "../hooks/useProntuario";
import MenuAcoesRegistroClinico from "./MenuAcoesRegistroClinico";

const TIPOS_ATENDIMENTO: Array<{
  valor: TipoAtendimentoProntuario;
  label: string;
}> = [
  { valor: "triagem", label: "Triagem" },
  { valor: "psicoterapia", label: "Psicoterapia" },
  { valor: "devolutiva", label: "Devolutiva" },
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "orientacao", label: "Orientação" },
  { valor: "retorno", label: "Retorno" },
  { valor: "alta", label: "Alta" },
  { valor: "outro", label: "Outro" },
];

const STATUS_CONFIG: Record<
  StatusProntuario,
  { label: string; classe: string; icone: typeof FileText }
> = {
  rascunho: {
    label: "Rascunho",
    classe: "border-amber-100 bg-amber-50 text-amber-700",
    icone: PencilLine,
  },
  finalizado: {
    label: "Finalizado",
    classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]",
    icone: FileCheck,
  },
  assinado: {
    label: "Assinado",
    classe: "border-[#D9BCE8] bg-[#F3EAF8] text-[#5F2D6D]",
    icone: Signature,
  },
};

function formatarData(data?: string | null) {
  if (!data) return "-";
  const date = new Date(`${String(data).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatarDataHoraEdicao(data?: string | null) {
  if (!data) return "-";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return String(data);
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const horaFormatada = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dataFormatada} às ${horaFormatada}`;
}

function formatarDataClinica(data?: string | null) {
  if (!data) return "-";
  const date = new Date(`${String(data).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(data);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatarHoraClinica(data?: string | null) {
  if (!data) return "";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatarHoraCurta(hora?: string | null) {
  if (!hora) return "-";
  return String(hora).slice(0, 5) || "-";
}

function tipoAtendimentoLabel(tipo: TipoAtendimentoProntuario) {
  return TIPOS_ATENDIMENTO.find((opcao) => opcao.valor === tipo)?.label || tipo;
}

function ConteudoEvolucao({ conteudo }: { conteudo: string }) {
  const editorLeitura = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      Highlight.configure({ multicolor: true }),
    ],
    content: conteudo,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "text-sm leading-6 text-gray-700 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
  });

  return <EditorContent editor={editorLeitura} />;
}

function BlocoConsultaVinculada({
  evolucao,
  onVerDetalhesConsulta,
}: {
  evolucao: RegistroClinico;
  onVerDetalhesConsulta: (evolucao: RegistroClinico) => void;
}) {
  const statusConsulta = evolucao.consulta_status
    ? obterAgendaStatusConfig(
        obterStatusConsultaExibicao({
          status: evolucao.consulta_status,
          data_consulta: evolucao.consulta_data_consulta,
          horario_inicio: evolucao.consulta_horario_inicio,
          horario_fim: evolucao.consulta_horario_fim,
        }),
      )
    : null;
  const tipoConsulta =
    evolucao.consulta_tipo_atendimento === "outro" &&
    evolucao.consulta_tipo_outro
      ? evolucao.consulta_tipo_outro
      : evolucao.consulta_tipo_atendimento
        ? tipoAtendimentoLabel(evolucao.consulta_tipo_atendimento)
        : "-";

  return (
    <section className="rounded-xl border border-[#D9BCE8] bg-[#FBF7FF] px-3 py-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-gray-400">
            Consulta vinculada
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-gray-800">
            {evolucao.consulta_data_consulta
              ? formatarDataClinica(evolucao.consulta_data_consulta)
              : "Não registrada"}
          </p>
        </div>
        {statusConsulta && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusConsulta.badge}`}
          >
            <statusConsulta.icone size={12} />
            {statusConsulta.texto}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={13} className="shrink-0 text-[#9F64AF]" />
          {formatarHoraCurta(evolucao.consulta_horario_inicio)} às{" "}
          {formatarHoraCurta(evolucao.consulta_horario_fim)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={13} className="shrink-0 text-[#9F64AF]" />
          {tipoConsulta}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UserRound size={13} className="shrink-0 text-[#9F64AF]" />
          {evolucao.consulta_psicologo_nome || "-"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <DoorOpen size={13} className="shrink-0 text-[#9F64AF]" />
          {evolucao.consulta_sala_nome || "-"}
        </span>
      </div>

      {evolucao.consulta_observacoes && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-gray-500">
          {evolucao.consulta_observacoes}
        </p>
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => onVerDetalhesConsulta(evolucao)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#9F64AF]/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#9F64AF] transition hover:bg-[#F3EAF8]"
        >
          Ver detalhes da consulta
        </button>
      </div>
    </section>
  );
}

function CardRegistroClinico({
  evolucao,
  onVisualizar,
}: {
  evolucao: RegistroClinico;
  onVisualizar: (evolucao: RegistroClinico) => void;
}) {
  const status = STATUS_CONFIG[evolucao.status];
  const StatusIcone = status.icone;
  const horaRegistro =
    formatarHoraClinica(evolucao.finalizado_em) ||
    formatarHoraClinica(evolucao.criado_em);
  const consultaVinculada = Number(evolucao.consulta_id) > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="border-[#F3EAF8] border-b bg-white/80 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.classe}`}
              >
                <StatusIcone size={13} />
                {status.label}
              </span>
              {consultaVinculada && (
                <span className="rounded-full border border-[#D9BCE8] bg-[#F9F4FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A4B86]">
                  Consulta vinculada
                </span>
              )}
            </div>
            <h3 className="mt-2 truncate text-base font-semibold text-gray-800">
              {evolucao.paciente_nome}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={13} className="text-[#9F64AF]" />
                {formatarDataClinica(evolucao.data_registro)}
                {horaRegistro ? ` · ${horaRegistro}` : ""}
              </span>
              <span>{tipoAtendimentoLabel(evolucao.tipo_atendimento)}</span>
              <span>
                {evolucao.psicologo_nome}
                {evolucao.crp ? ` · CRP ${evolucao.crp}` : ""}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onVisualizar(evolucao)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#9F64AF]/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#9F64AF] transition hover:bg-[#F3EAF8]"
            >
              <FileText size={13} />
              Ver registro
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ModalVisualizarRegistroClinico({
  evolucao,
  onClose,
  onEditar,
  onFinalizar,
  onAssinar,
  onGerarPdf,
  onImprimir,
  onVerDetalhesConsulta,
}: {
  evolucao: RegistroClinico | null;
  onClose: () => void;
  onEditar: (evolucao: RegistroClinico) => void;
  onFinalizar: (evolucao: RegistroClinico) => void;
  onAssinar: (evolucao: RegistroClinico) => void;
  onGerarPdf: (evolucao: RegistroClinico) => void;
  onImprimir: (evolucao: RegistroClinico) => void;
  onVerDetalhesConsulta: (evolucao: RegistroClinico) => void;
}) {
  const montado = typeof document !== "undefined";

  useEffect(() => {
    if (!evolucao) return;
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [evolucao, onClose]);

  if (!evolucao || !montado) return null;

  const status = STATUS_CONFIG[evolucao.status];
  const StatusIcone = status.icone;
  const podeEditar = evolucao.status === "rascunho";

  return createPortal(
    <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar visualização do registro"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white shadow-2xl"
      >
        <div className="shrink-0 border-[#F3EAF8] border-b bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.classe}`}
                >
                  <StatusIcone size={13} />
                  {status.label}
                </span>
                {Number(evolucao.consulta_id) > 0 && (
                  <span className="rounded-full border border-[#D9BCE8] bg-[#F9F4FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A4B86]">
                    Consulta vinculada
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-gray-800">
                Registro clínico
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {evolucao.paciente_nome} ·{" "}
                {formatarDataClinica(evolucao.data_registro)} ·{" "}
                {tipoAtendimentoLabel(evolucao.tipo_atendimento)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-14 z-10">
          <MenuAcoesRegistroClinico
            onGerarPdf={() => onGerarPdf(evolucao)}
            onImprimir={() => onImprimir(evolucao)}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        <div className="agenda-filtro-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FCFAFD] p-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase text-gray-500">
                Conteúdo do registro
              </span>
              <span className="text-[11px] text-gray-400">
                Atualizado em {formatarDataHora(evolucao.atualizado_em)}
              </span>
            </div>
            {evolucao.conteudo ? (
              <ConteudoEvolucao conteudo={evolucao.conteudo} />
            ) : (
              <p className="text-sm leading-6 text-gray-500">
                Rascunho sem conteúdo registrado.
              </p>
            )}

            {evolucao.status === "assinado" && (
              <div className="mt-4 pt-3">
                <div className="max-w-sm text-gray-700">
                  {evolucao.assinatura_url && (
                    <Image
                      src={evolucao.assinatura_url}
                      alt="Assinatura profissional"
                      width={360}
                      height={114}
                      className="mb-1.5 max-h-28 max-w-[340px] object-contain"
                    />
                  )}
                  <div className="mb-3 h-px w-56 bg-gray-200/80" />
                  <p className="text-sm font-semibold text-gray-800">
                    {evolucao.psicologo_nome}
                  </p>
                  {evolucao.crp && (
                    <p className="mt-0.5 text-xs text-gray-600">
                      CRP {evolucao.crp}
                    </p>
                  )}
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    <span className="block">Assinado digitalmente em</span>
                    {formatarDataHora(evolucao.assinado_em)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {evolucao.editado_em && evolucao.editado_por_nome && (
            <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-3.5 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <p className="leading-[1.15]">
                Editado por{" "}
                <span className="font-semibold text-gray-700">
                  {evolucao.editado_por_nome}
                </span>
                {evolucao.crp_editor ? ` - CRP ${evolucao.crp_editor}` : ""} em{" "}
                {formatarDataHoraEdicao(evolucao.editado_em)}
              </p>
              {evolucao.assinatura_editor_url && (
                <div className="shrink-0 rounded-lg border border-gray-100 bg-white p-2">
                  <Image
                    src={evolucao.assinatura_editor_url}
                    alt="Assinatura do psicólogo editor"
                    width={150}
                    height={48}
                    className="max-h-10 max-w-[130px] object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {Number(evolucao.consulta_id) > 0 && (
            <BlocoConsultaVinculada
              evolucao={evolucao}
              onVerDetalhesConsulta={onVerDetalhesConsulta}
            />
          )}
        </div>

        <div className="shrink-0 border-[#F3EAF8] border-t bg-white px-6 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Fechar
            </button>
            {podeEditar && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditar(evolucao);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#9F64AF]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#9F64AF] transition hover:bg-[#F3EAF8]"
                >
                  <PenLine size={15} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onFinalizar(evolucao)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#9F64AF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8B509B]"
                >
                  Finalizar
                </button>
              </>
            )}
            {evolucao.status === "finalizado" && (
              <button
                type="button"
                onClick={() => onAssinar(evolucao)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#9F64AF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8B509B]"
              >
                <Signature size={15} />
                Assinar registro
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

export function TimelineRegistros({
  evolucoes,
  onVisualizar,
  onEditar,
  onFinalizar,
  onAssinar,
}: {
  evolucoes: RegistroClinico[];
  onVisualizar: (evolucao: RegistroClinico) => void;
  onEditar: (evolucao: RegistroClinico) => void;
  onFinalizar: (evolucao: RegistroClinico) => void;
  onAssinar: (evolucao: RegistroClinico) => void;
}) {
  return (
    <section className="space-y-6">
      {evolucoes.map((evolucao, index) => (
        <div key={evolucao.id} className="grid gap-3 md:grid-cols-[104px_1fr]">
          <div className="flex md:justify-end">
            <div className="rounded-xl border border-[#9F64AF]/15 bg-white/75 px-2.5 py-1.5 text-left shadow-sm md:text-right">
              <p className="text-[11px] font-semibold text-[#9F64AF]">
                {formatarData(evolucao.data_registro)}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {tipoAtendimentoLabel(evolucao.tipo_atendimento)}
              </p>
            </div>
          </div>

          <div className="relative pl-4">
            <span className="absolute top-2 left-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#9F64AF] shadow-[0_0_0_4px_rgba(159,100,175,0.16)]" />
            {index < evolucoes.length - 1 && (
              <span className="absolute top-5 bottom-[-1.25rem] left-[4px] w-px bg-[#D9BCE8]" />
            )}
            <span className="sr-only">Linha do tempo clínica</span>
            <CardRegistroClinico
              evolucao={evolucao}
              onVisualizar={onVisualizar}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
