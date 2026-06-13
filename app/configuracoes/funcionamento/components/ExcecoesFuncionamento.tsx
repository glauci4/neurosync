// app/configuracoes/funcionamento/components/ExcecoesFuncionamento.tsx
// Lista de exceções e feriados oficiais, com visual compacto e separado por origem.

"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  CalendarX2,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TbCalendarCancel } from "react-icons/tb";
import type { Excecao } from "../types";
import { obterDataLocalISO } from "../utils/calendario";

const TIPO_ICONE: Record<string, React.ElementType> = {
  feriado: CalendarDays,
  ferias: CalendarRange,
  bloqueio: CalendarX2,
  excecao: Clock3,
};

const TIPO_LABEL: Record<string, string> = {
  feriado: "Feriado",
  ferias: "Férias",
  bloqueio: "Bloqueio",
  excecao: "Horário especial",
};

const TIPO_COR: Record<string, { bg: string; text: string }> = {
  feriado: { bg: "bg-[#F3EAF8]", text: "text-[#7B3F8C]" },
  ferias: { bg: "bg-[#ECE9FF]", text: "text-[#433082]" },
  bloqueio: { bg: "bg-[#F4EAF2]", text: "text-[#74375F]" },
  excecao: { bg: "bg-[#F8E9F3]", text: "text-[#8A3363]" },
};

function formatarData(data: string | Date): string {
  if (!data) return "";
  const dataStr = typeof data === "string" ? data.split("T")[0] : "";
  if (dataStr && /^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  const dataObj = typeof data === "string" ? new Date(data) : new Date(data);
  if (Number.isNaN(dataObj.getTime())) return "";
  const dia = dataObj.getDate().toString().padStart(2, "0");
  const mes = (dataObj.getMonth() + 1).toString().padStart(2, "0");
  const ano = dataObj.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

interface ExcecoesFuncionamentoProps {
  excecoes: Excecao[];
  feriadosOficiais?: Array<{ date: string; name: string }>;
  loading: boolean;
  disabled: boolean;
  compacto?: boolean;
  podeCriarExcecao?: boolean;
  onNovaExcecao?: () => void;
  onRemover?: (id: number) => void;
  onSolicitarRemocao?: (excecao: Excecao) => void;
}

export default function ExcecoesFuncionamento({
  excecoes,
  feriadosOficiais = [],
  loading,
  disabled,
  compacto = false,
  podeCriarExcecao = false,
  onNovaExcecao,
  onRemover,
  onSolicitarRemocao,
}: ExcecoesFuncionamentoProps) {
  const [filtroTipo, setFiltroTipo] = useState<"todos" | Excecao["tipo"]>(
    "todos",
  );
  const [filtroFeriados, setFiltroFeriados] = useState<
    "30" | "60" | "90" | "todos"
  >("30");

  const hoje = obterDataLocalISO(new Date());
  const feriadosOficiaisMapa = useMemo(
    () =>
      new Map(feriadosOficiais.map((feriado) => [feriado.date, feriado.name])),
    [feriadosOficiais],
  );

  const excecoesClinica = useMemo(
    () =>
      excecoes
        .filter(
          (e) =>
            e.ativo !== 0 &&
            !(
              e.tipo === "feriado" &&
              feriadosOficiaisMapa.has(e.data_especifica)
            ) &&
            (e.data_especifica >= hoje ||
              Boolean(e.data_fim && e.data_fim >= hoje)),
        )
        .sort((a, b) => a.data_especifica.localeCompare(b.data_especifica)),
    [excecoes, feriadosOficiaisMapa, hoje],
  );

  const feriadosOficiaisFuturos = useMemo(
    () =>
      feriadosOficiais
        .filter((feriado) => feriado.date >= hoje)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [feriadosOficiais, hoje],
  );

  const prazoFeriados = Number.parseInt(filtroFeriados, 10);

  const feriadosOficiaisVisiveis = useMemo(() => {
    const base =
      filtroFeriados === "todos"
        ? feriadosOficiaisFuturos
        : feriadosOficiaisFuturos.filter((feriado) => {
            const dataFeriado = new Date(`${feriado.date}T00:00:00`);
            const diff =
              (dataFeriado.getTime() - new Date(`${hoje}T00:00:00`).getTime()) /
              (1000 * 60 * 60 * 24);
            return diff <= prazoFeriados;
          });
    return base;
  }, [feriadosOficiaisFuturos, filtroFeriados, hoje, prazoFeriados]);

  const excecoesFiltradas = useMemo(() => {
    if (filtroTipo === "todos") return excecoesClinica;
    return excecoesClinica.filter((e) => e.tipo === filtroTipo);
  }, [excecoesClinica, filtroTipo]);

  const proximosFeriados = useMemo(
    () => feriadosOficiaisFuturos.slice(0, 1),
    [feriadosOficiaisFuturos],
  );

  const proximaExcecao = useMemo(
    () => excecoesClinica[0] || null,
    [excecoesClinica],
  );

  const feriasCadastradas = useMemo(
    () => excecoesClinica.filter((e) => e.tipo === "ferias").length,
    [excecoesClinica],
  );

  const bloqueiosAtivos = useMemo(
    () => excecoesClinica.filter((e) => e.tipo === "bloqueio").length,
    [excecoesClinica],
  );

  const filtrosClinica: Array<"todos" | Excecao["tipo"]> = [
    "todos",
    "ferias",
    "bloqueio",
    "excecao",
  ];

  const filtrosFeriados = ["30", "60", "90", "todos"] as const;
  const mensagemVaziaClinica =
    filtroTipo === "todos"
      ? "Nenhuma exceção cadastrada."
      : filtroTipo === "ferias"
        ? "Nenhuma férias cadastrada."
        : filtroTipo === "bloqueio"
          ? "Nenhum bloqueio cadastrado."
          : "Nenhum horário especial configurado.";

  return (
    <section
      className={
        compacto
          ? "space-y-4"
          : "bg-white/70 backdrop-blur-sm rounded-2xl border border-[#9F64AF]/20 shadow-sm p-5"
      }
    >
      <div className="rounded-2xl border border-[#9F64AF]/10 bg-[#F9F5FF]/70 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-medium text-gray-600">
            Férias cadastradas{" "}
            <span className="ml-1 font-semibold text-gray-800">
              {feriasCadastradas}
            </span>
          </span>
          <span className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-medium text-gray-600">
            Bloqueios ativos{" "}
            <span className="ml-1 font-semibold text-gray-800">
              {bloqueiosAtivos}
            </span>
          </span>
          <span className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-medium text-gray-600">
            Próximo feriado{" "}
            <span className="ml-1 font-semibold text-gray-800">
              {proximosFeriados[0]
                ? formatarData(proximosFeriados[0].date)
                : "Nenhum"}
            </span>
          </span>
          <span className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-medium text-gray-600">
            Próxima exceção{" "}
            <span className="ml-1 font-semibold text-gray-800">
              {proximaExcecao
                ? `${formatarData(proximaExcecao.data_especifica)} · ${TIPO_LABEL[proximaExcecao.tipo] || proximaExcecao.tipo}`
                : "Nenhuma"}
            </span>
          </span>
          {podeCriarExcecao && onNovaExcecao && (
            <button
              type="button"
              onClick={onNovaExcecao}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#9F64AF] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-[#8B509B]"
            >
              <Plus size={13} />
              Nova exceção
            </button>
          )}
        </div>
      </div>

      <div className={compacto ? "space-y-4" : "space-y-5"}>
        <div className="rounded-2xl border border-[#9F64AF]/15 bg-white/85 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TbCalendarCancel size={16} className="text-[#9F64AF]" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Exceções da clínica
                </h4>
              </div>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                Bloqueios, férias e ajustes cadastrados manualmente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 rounded-full bg-[#F9F5FF] p-1.5">
              {filtrosClinica.map((tipo) => {
                const ativo = filtroTipo === tipo;
                const label =
                  tipo === "todos"
                    ? "Todos"
                    : TIPO_LABEL[tipo as Excecao["tipo"]];
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroTipo(tipo)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      ativo
                        ? "bg-[#9F64AF] text-white shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-[#9F64AF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : excecoesFiltradas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/40 px-4 py-6 text-center">
                <TbCalendarCancel
                  size={24}
                  className="mx-auto mb-2 text-gray-300"
                />
                <p className="text-sm text-gray-600">{mensagemVaziaClinica}</p>
              </div>
            ) : (
              excecoesFiltradas.map((e) => {
                const Icone = TIPO_ICONE[e.tipo] || CalendarDays;
                const cores = TIPO_COR[e.tipo] || TIPO_COR.excecao;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-[#9F64AF]/10 bg-white/90 px-3 py-2.5 transition-all hover:border-[#9F64AF]/30 hover:shadow-sm"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cores.bg}`}
                    >
                      <Icone size={14} className={cores.text} />
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${cores.bg} ${cores.text}`}
                    >
                      {TIPO_LABEL[e.tipo] || e.tipo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {e.data_fim
                          ? `${formatarData(e.data_especifica)} → ${formatarData(e.data_fim)}`
                          : formatarData(e.data_especifica)}
                      </p>
                      {(e.descricao || e.hora_inicio) && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {e.hora_inicio && (
                            <>
                              <Clock3 size={11} className="inline mr-1" />
                              {e.hora_inicio}–{e.hora_fim}
                              {e.descricao && " · "}
                            </>
                          )}
                          {e.descricao}
                        </p>
                      )}
                    </div>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() =>
                          onSolicitarRemocao
                            ? onSolicitarRemocao(e)
                            : onRemover?.(e.id)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#9F64AF]/15 bg-white/85 p-4 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TbCalendarCancel size={16} className="text-[#9F64AF]" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Feriados oficiais
                </h4>
              </div>
              <p className="mt-1 ml-6 text-xs text-gray-600">
                Datas nacionais exibidas apenas como referência.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 rounded-full bg-[#F9F5FF] p-1.5">
              {filtrosFeriados.map((prazo) => {
                const ativo = filtroFeriados === prazo;
                const label =
                  prazo === "todos" ? "Todos" : `Próximos ${prazo} dias`;
                return (
                  <button
                    key={prazo}
                    type="button"
                    onClick={() => {
                      setFiltroFeriados(prazo);
                    }}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      ativo
                        ? "bg-[#9F64AF] text-white shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {feriadosOficiaisVisiveis.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-4 py-4 text-center">
                <TbCalendarCancel
                  size={22}
                  className="mx-auto mb-1.5 text-gray-300"
                />
                <p className="text-sm text-gray-600">
                  Nenhum feriado oficial encontrado no período.
                </p>
              </div>
            ) : (
              feriadosOficiaisVisiveis.map((feriado) => (
                <div
                  key={feriado.date}
                  title={feriado.name}
                  className="flex items-center gap-3 rounded-xl border border-[#9F64AF]/10 bg-[#F9F5FF]/90 px-3 py-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-[#9F64AF]">
                    <CalendarDays size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {feriado.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatarData(feriado.date)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#7B3F8C]">
                    Oficial
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
