"use client";

import {
  BrushCleaning,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
import type {
  CategoriaRelatorio,
  FiltrosRelatoriosResponse,
  FiltrosRelatorios as FiltrosRelatoriosValores,
} from "../types/relatorios.types";
import type { ErrosPeriodoRelatorios } from "../utils/validarPeriodoRelatorios";

interface FiltrosRelatoriosProps {
  filtros: FiltrosRelatoriosValores;
  opcoes?: FiltrosRelatoriosResponse["data"];
  onChange: (filtros: FiltrosRelatoriosValores) => void;
  errosPeriodo?: ErrosPeriodoRelatorios;
  onPeriodoBlur?: (campo: "data_inicio" | "data_fim") => void;
  categoria?: CategoriaRelatorio;
}

interface OpcaoFiltroRelatorio {
  valor: string;
  label: string;
  descricao?: string;
}

function labelStatus(status?: string) {
  const labels: Record<string, string> = {
    agendado: "Agendado",
    remarcado: "Remarcado",
    cancelado: "Cancelado",
    falta: "Falta",
    concluido: "Concluído",
  };
  return status ? labels[status] || status : "Todos";
}

function SecaoFiltroRelatorio({
  label,
  valor,
  placeholder,
  opcoes,
  todosLabel,
  pesquisavel = false,
  onChange,
}: {
  label: string;
  valor?: string;
  placeholder: string;
  opcoes: OpcaoFiltroRelatorio[];
  todosLabel: string;
  pesquisavel?: boolean;
  onChange: (valor?: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);

  const filtradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        opcao.label.toLowerCase().includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );

  function selecionar(novoValor?: string) {
    onChange(novoValor);
    setAberto(false);
    setBusca("");
  }

  useEffect(() => {
    if (!aberto) return;

    function fecharSeClicarFora(evento: PointerEvent) {
      const alvo = evento.target as Node;
      if (containerRef.current?.contains(alvo)) return;
      setAberto(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    }

    document.addEventListener("pointerdown", fecharSeClicarFora);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", fecharSeClicarFora);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aberto]);

  const menuDropdown = (
    <div
      className="relative z-[70] mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
      onPointerDownCapture={(evento) => evento.stopPropagation()}
      onMouseDownCapture={(evento) => evento.stopPropagation()}
      onWheelCapture={(evento) => evento.stopPropagation()}
    >
      {pesquisavel ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Pesquisar..."
            className="w-full bg-transparent text-sm text-gray-700 outline-none"
          />
        </div>
      ) : null}

      <div className="relatorios-filtro-scroll max-h-56 overflow-y-auto overscroll-contain pr-1">
        <button
          type="button"
          onClick={() => selecionar(undefined)}
          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
            !valor
              ? "bg-[#F3EAF8] text-[#9F64AF]"
              : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
          }`}
        >
          <span className="font-medium">{todosLabel}</span>
          {!valor ? (
            <Check size={15} className="shrink-0 text-[#9F64AF]" />
          ) : null}
        </button>

        {filtradas.map((opcao) => {
          const ativa = valor === opcao.valor;

          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => selecionar(opcao.valor)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                ativa
                  ? "bg-[#F3EAF8] text-[#9F64AF]"
                  : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {opcao.label}
                </span>
                {opcao.descricao ? (
                  <span className="block truncate text-[11px] text-gray-400">
                    {opcao.descricao}
                  </span>
                ) : null}
              </span>
              {ativa ? (
                <Check size={15} className="shrink-0 text-[#9F64AF]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative border-b border-gray-100 py-2.5 last:border-b-0 dark:border-[var(--ns-border)]"
    >
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#F3EAF8]"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold text-gray-400 uppercase">
            {label}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-sm text-gray-700">
            <span
              className={`${selecionada ? "font-medium" : "text-gray-400"} truncate`}
            >
              {selecionada?.label || placeholder}
            </span>
            {selecionada?.descricao ? (
              <span className="truncate text-xs text-gray-400">
                {selecionada.descricao}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto ? menuDropdown : null}
    </div>
  );
}

function quantidadeAtivos(filtros: FiltrosRelatoriosValores) {
  return [
    filtros.psicologo_id,
    filtros.sala_id,
    filtros.status,
    filtros.paciente_id,
    filtros.letra_inicial,
    filtros.psicologo_responsavel_id,
  ].filter(Boolean).length;
}

function aplicarMascaraData(valor: string) {
  const somenteNumeros = valor.replace(/\D/g, "").slice(0, 8);
  const partes = [
    somenteNumeros.slice(0, 2),
    somenteNumeros.slice(2, 4),
    somenteNumeros.slice(4, 8),
  ].filter(Boolean);

  return partes.join("/");
}

function isoParaPtBr(valor?: string) {
  if (valor === "__invalid_date__") return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor || "");
  if (!match) return valor || "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function ptBrParaIso(valor: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!match) return valor;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export default function FiltrosRelatorios({
  filtros,
  opcoes,
  onChange,
  errosPeriodo,
  onPeriodoBlur,
  categoria = "visao_geral",
}: FiltrosRelatoriosProps) {
  const [aberto, setAberto] = useState(false);
  const [abreParaCima, setAbreParaCima] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{
    top?: number;
    right: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const [periodoDigitado, setPeriodoDigitado] = useState({
    data_inicio: isoParaPtBr(filtros.data_inicio),
    data_fim: isoParaPtBr(filtros.data_fim),
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const filtrosAtivos = quantidadeAtivos(filtros);

  const psicologos: OpcaoFiltroRelatorio[] = (opcoes?.psicologos || []).map(
    (psicologo) => ({
      valor: String(psicologo.id),
      label: psicologo.nome,
    }),
  );
  const salas: OpcaoFiltroRelatorio[] = (opcoes?.salas || []).map((sala) => ({
    valor: String(sala.id),
    label: sala.nome,
  }));
  const statusConsulta = (
    opcoes?.status_consulta || [
      "agendado",
      "remarcado",
      "cancelado",
      "falta",
      "concluido",
    ]
  ).map((status) => ({
    valor: status,
    label: labelStatus(status),
  }));
  const statusPaciente = (
    opcoes?.status_paciente || ["fila_espera", "em_atendimento", "encerrado"]
  ).map((status) => ({
    valor: status,
    label:
      {
        fila_espera: "Em espera",
        em_atendimento: "Em atendimento",
        encerrado: "Encerrado",
      }[status] || status,
  }));
  const letrasIniciais = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map((letra) => ({
      valor: letra,
      label: letra,
    }));
  const pacientes = (opcoes?.pacientes || []).map((paciente) => ({
    valor: String(paciente.id),
    label: paciente.nome,
    descricao: paciente.psicologo_responsavel_nome || undefined,
  }));

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      const alvo = event.target as Node;
      if (cardRef.current && !cardRef.current.contains(alvo)) {
        setAberto(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function atualizarPosicaoPopover() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const margem = 16;
      const offset = 8;
      const alturaPreferida = 560;
      const alturaMinima = 220;
      const rect = trigger.getBoundingClientRect();
      const espacoAbaixo = window.innerHeight - rect.bottom - margem;
      const espacoAcima = rect.top - margem;
      const deveAbrirParaCima =
        espacoAbaixo < alturaPreferida && espacoAcima > espacoAbaixo;
      const espacoDisponivel = deveAbrirParaCima ? espacoAcima : espacoAbaixo;
      const maxHeight = Math.max(
        alturaMinima,
        Math.min(alturaPreferida, espacoDisponivel - offset),
      );

      setAbreParaCima(deveAbrirParaCima);
      setPopoverStyle({
        top: deveAbrirParaCima ? undefined : rect.bottom + offset,
        bottom: deveAbrirParaCima
          ? window.innerHeight - rect.top + offset
          : undefined,
        right: Math.max(margem, window.innerWidth - rect.right),
        maxHeight,
      });
    }

    atualizarPosicaoPopover();
    window.addEventListener("resize", atualizarPosicaoPopover);
    window.addEventListener("scroll", atualizarPosicaoPopover, true);

    return () => {
      window.removeEventListener("resize", atualizarPosicaoPopover);
      window.removeEventListener("scroll", atualizarPosicaoPopover, true);
    };
  }, [aberto]);

  useEffect(() => {
    setPeriodoDigitado({
      data_inicio: isoParaPtBr(filtros.data_inicio),
      data_fim: isoParaPtBr(filtros.data_fim),
    });
  }, [filtros.data_inicio, filtros.data_fim]);

  function atualizar(chave: keyof FiltrosRelatoriosValores, valor: string) {
    onChange({
      ...filtros,
      [chave]:
        chave === "psicologo_id" || chave === "sala_id"
          ? valor
            ? Number(valor)
            : undefined
          : valor || undefined,
    });
  }

  function atualizarPeriodo(
    chave: "data_inicio" | "data_fim",
    valorDigitado: string,
  ) {
    const contemTextoInvalido = /[^\d/]/.test(valorDigitado);
    const mascarado = aplicarMascaraData(valorDigitado);
    setPeriodoDigitado((atual) => ({
      ...atual,
      [chave]: mascarado,
    }));
    atualizar(
      chave,
      contemTextoInvalido ? "__invalid_date__" : ptBrParaIso(mascarado),
    );
  }

  function limparFiltros() {
    setPeriodoDigitado({ data_inicio: "", data_fim: "" });
    onChange({});
    setAberto(false);
  }

  const erroPeriodo =
    errosPeriodo?.errorMessage ||
    errosPeriodo?.geral ||
    errosPeriodo?.data_inicio ||
    errosPeriodo?.data_fim;
  const dataInicioComErro = Boolean(
    errosPeriodo?.data_inicio || errosPeriodo?.geral,
  );
  const dataFimComErro = Boolean(errosPeriodo?.data_fim || errosPeriodo?.geral);
  const mostraFiltrosPaciente = categoria === "pacientes";
  const statusConsultaAtivo =
    categoria === "visao_geral" || categoria === "agenda";
  const statusAtivo =
    categoria === "pacientes" ? statusPaciente : statusConsulta;

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E1D4F0] bg-white/85 px-3 py-2 text-sm shadow-sm backdrop-blur-sm dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface)]">
            <span className="whitespace-nowrap font-medium text-gray-700 dark:text-[var(--ns-text-primary)]">
              Período
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={periodoDigitado.data_inicio}
              onChange={(evento) =>
                atualizarPeriodo("data_inicio", evento.target.value)
              }
              onBlur={() => onPeriodoBlur?.("data_inicio")}
              className={`h-9 w-32 rounded-lg border bg-white px-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-[#9F64AF] ${
                dataInicioComErro
                  ? "border-red-500"
                  : "border-gray-200 dark:border-[var(--ns-border)]"
              }`}
            />
            <span className="text-gray-400 dark:text-[var(--ns-text-secondary)]">
              até
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={periodoDigitado.data_fim}
              onChange={(evento) =>
                atualizarPeriodo("data_fim", evento.target.value)
              }
              onBlur={() => onPeriodoBlur?.("data_fim")}
              className={`h-9 w-32 rounded-lg border bg-white px-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-[#9F64AF] ${
                dataFimComErro
                  ? "border-red-500"
                  : "border-gray-200 dark:border-[var(--ns-border)]"
              }`}
            />
          </div>

          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setAberto((valor) => !valor)}
              className="relative rounded-xl border border-gray-300 bg-white/85 p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-[#9F64AF] dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:text-[var(--ns-text-secondary)] dark:hover:bg-[#F3E8F7] dark:hover:text-[#9F64AF]"
              title="Filtros avançados"
              aria-label="Filtros avançados"
            >
              <SlidersHorizontal size={18} />
              {filtrosAtivos > 0 ? (
                <span className="-top-1 -right-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9F64AF] px-1 text-[10px] font-bold text-white">
                  {filtrosAtivos}
                </span>
              ) : null}
            </button>

            {aberto ? (
              <div
                ref={cardRef}
                className="fixed z-50 w-[min(86vw,420px)]"
                style={popoverStyle || undefined}
                role="dialog"
                aria-label="Filtros de relatórios"
                onPointerDownCapture={(evento) => evento.stopPropagation()}
                onMouseDownCapture={(evento) => evento.stopPropagation()}
                onWheelCapture={(evento) => evento.stopPropagation()}
              >
                <span
                  className={`pointer-events-none absolute right-5 z-[55] h-4 w-4 rotate-45 bg-white/95 backdrop-blur-sm ${
                    abreParaCima
                      ? "-bottom-2 border-r border-b border-[#9F64AF]/15 shadow-[2px_2px_3px_rgba(159,100,175,0.04)]"
                      : "-top-2 border-l border-t border-[#9F64AF]/15 shadow-[-2px_-2px_3px_rgba(159,100,175,0.04)]"
                  }`}
                />

                <div
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white/95 shadow-2xl backdrop-blur-sm"
                  style={
                    popoverStyle?.maxHeight
                      ? { maxHeight: popoverStyle.maxHeight }
                      : undefined
                  }
                >
                  <div className="shrink-0 border-b border-[#F3EAF8] px-4 pt-3 pb-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Filtrar relatórios
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {categoria === "visao_geral"
                        ? "Refine a visão operacional por psicólogo, sala e status das consultas."
                        : "Refine a visão operacional por psicólogo, sala ou status."}
                    </p>
                  </div>

                  <div
                    className="relatorios-filtro-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 pr-2 pb-4"
                    onPointerDownCapture={(evento) => evento.stopPropagation()}
                    onMouseDownCapture={(evento) => evento.stopPropagation()}
                    onWheelCapture={(evento) => evento.stopPropagation()}
                  >
                    {mostraFiltrosPaciente ? (
                      <>
                        <SecaoFiltroRelatorio
                          label="Paciente específico"
                          valor={
                            filtros.paciente_id
                              ? String(filtros.paciente_id)
                              : undefined
                          }
                          placeholder="Todos os pacientes"
                          todosLabel="Todos os pacientes"
                          opcoes={pacientes}
                          pesquisavel
                          onChange={(valor) =>
                            atualizar("paciente_id", valor || "")
                          }
                        />
                        <SecaoFiltroRelatorio
                          label="Letra inicial"
                          valor={filtros.letra_inicial || undefined}
                          placeholder="Todas"
                          todosLabel="Todas"
                          opcoes={letrasIniciais}
                          onChange={(valor) =>
                            atualizar("letra_inicial", valor || "")
                          }
                        />
                        <SecaoFiltroRelatorio
                          label="Psicólogo responsável"
                          valor={
                            filtros.psicologo_responsavel_id
                              ? String(filtros.psicologo_responsavel_id)
                              : undefined
                          }
                          placeholder="Todos"
                          todosLabel="Todos"
                          opcoes={psicologos}
                          pesquisavel
                          onChange={(valor) =>
                            atualizar("psicologo_responsavel_id", valor || "")
                          }
                        />
                      </>
                    ) : (
                      <>
                        <SecaoFiltroRelatorio
                          label="Psicólogo"
                          valor={
                            filtros.psicologo_id
                              ? String(filtros.psicologo_id)
                              : undefined
                          }
                          placeholder="Todos"
                          todosLabel="Todos"
                          opcoes={psicologos}
                          pesquisavel
                          onChange={(valor) =>
                            atualizar("psicologo_id", valor || "")
                          }
                        />
                        <SecaoFiltroRelatorio
                          label="Sala"
                          valor={
                            filtros.sala_id
                              ? String(filtros.sala_id)
                              : undefined
                          }
                          placeholder="Todas"
                          todosLabel="Todas"
                          opcoes={salas}
                          pesquisavel
                          onChange={(valor) =>
                            atualizar("sala_id", valor || "")
                          }
                        />
                      </>
                    )}

                    {statusConsultaAtivo ? (
                      <SecaoFiltroRelatorio
                        label="Status da consulta"
                        valor={filtros.status}
                        placeholder="Todos"
                        todosLabel="Todos"
                        opcoes={statusConsulta}
                        pesquisavel
                        onChange={(valor) => atualizar("status", valor || "")}
                      />
                    ) : (
                      <SecaoFiltroRelatorio
                        label="Status"
                        valor={filtros.status}
                        placeholder="Todos"
                        todosLabel="Todos"
                        opcoes={statusAtivo}
                        pesquisavel
                        onChange={(valor) => atualizar("status", valor || "")}
                      />
                    )}
                  </div>

                  <div className="shrink-0 border-t border-[#F3EAF8] bg-white/95 px-4 pt-3 pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-400">
                        {filtrosAtivos}{" "}
                        {filtrosAtivos === 1 ? "filtro" : "filtros"}
                      </span>
                      <button
                        type="button"
                        onClick={limparFiltros}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                      >
                        <BrushCleaning size={13} />
                        Limpar filtros
                      </button>
                    </div>
                  </div>
                </div>

                <style jsx global>{`
                  .relatorios-filtro-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(159, 100, 175, 0.28) transparent;
                  }
                  .relatorios-filtro-scroll::-webkit-scrollbar {
                    width: 5px;
                  }
                  .relatorios-filtro-scroll::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .relatorios-filtro-scroll::-webkit-scrollbar-thumb {
                    background: rgba(159, 100, 175, 0.25);
                    border-radius: 999px;
                  }
                  .relatorios-filtro-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(159, 100, 175, 0.42);
                  }
                `}</style>
              </div>
            ) : null}
          </div>

          <span className="whitespace-nowrap text-sm text-gray-500 dark:text-[var(--ns-text-secondary)]">
            {filtrosAtivos}{" "}
            {filtrosAtivos === 1 ? "filtro ativo" : "filtros ativos"}
          </span>
        </div>
      </div>

      {erroPeriodo ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <MdErrorOutline size={14} className="shrink-0" />
          <span>{erroPeriodo}</span>
        </p>
      ) : null}
    </div>
  );
}
