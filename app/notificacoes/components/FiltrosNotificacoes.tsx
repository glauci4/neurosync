"use client";

import {
  BrushCleaning,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type FiltroLeituraNotificacoes = "todas" | "nao_lidas" | "lidas";
export type FiltroTipoNotificacoes =
  | "todos"
  | "consulta"
  | "feriado"
  | "transferencia"
  | "pendente";
export type FiltroPeriodoNotificacoes =
  | "todos"
  | "hoje"
  | "ontem"
  | "semana"
  | "anteriores";

export interface FiltrosNotificacoesValores {
  leitura: FiltroLeituraNotificacoes;
  tipo: FiltroTipoNotificacoes;
  periodo: FiltroPeriodoNotificacoes;
}

interface OpcaoFiltro {
  valor: string;
  label: string;
}

interface FiltrosNotificacoesProps {
  filtros: FiltrosNotificacoesValores;
  onChange: (filtros: FiltrosNotificacoesValores) => void;
}

const FILTROS_PADRAO: FiltrosNotificacoesValores = {
  leitura: "todas",
  tipo: "todos",
  periodo: "todos",
};

const OPCOES_LEITURA: OpcaoFiltro[] = [
  { valor: "todas", label: "Todas" },
  { valor: "nao_lidas", label: "Não lidas" },
  { valor: "lidas", label: "Lidas" },
];

const OPCOES_TIPO: OpcaoFiltro[] = [
  { valor: "todos", label: "Todos" },
  { valor: "consulta", label: "Consultas" },
  { valor: "feriado", label: "Feriados" },
  { valor: "transferencia", label: "Transferências" },
  { valor: "pendente", label: "Pendentes" },
];

const OPCOES_PERIODO: OpcaoFiltro[] = [
  { valor: "todos", label: "Todas" },
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "semana", label: "Esta semana" },
  { valor: "anteriores", label: "Anteriores" },
];

function contarFiltrosAtivos(filtros: FiltrosNotificacoesValores) {
  return [
    filtros.leitura !== FILTROS_PADRAO.leitura,
    filtros.tipo !== FILTROS_PADRAO.tipo,
    filtros.periodo !== FILTROS_PADRAO.periodo,
  ].filter(Boolean).length;
}

function CampoFiltro({
  label,
  valor,
  opcoes,
  placeholder,
  painelInteracaoRef,
  onChange,
}: {
  label: string;
  valor: string;
  opcoes: OpcaoFiltro[];
  placeholder: string;
  painelInteracaoRef?: RefObject<HTMLDivElement | null>;
  onChange: (valor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const painelInteracaoAtualRef = useRef<HTMLDivElement | null>(null);
  painelInteracaoAtualRef.current = painelInteracaoRef?.current ?? null;
  const opcaoSelecionada = opcoes.find((opcao) => opcao.valor === valor);
  const filtradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        opcao.label.toLowerCase().includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );

  useEffect(() => {
    if (!aberto) return;

    function handlePointerDown(evento: PointerEvent) {
      const caminhoEvento = evento.composedPath();
      const painelInteracao = painelInteracaoAtualRef.current;

      if (painelInteracao && caminhoEvento.includes(painelInteracao)) {
        return;
      }

      if (
        containerRef.current &&
        !caminhoEvento.includes(containerRef.current)
      ) {
        setAberto(false);
        setBusca("");
      }
    }

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aberto]);

  return (
    <div
      ref={containerRef}
      className="relative border-b border-gray-100 py-2.5 last:border-b-0"
    >
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#F3EAF8]"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase text-gray-400">
            {label}
          </span>
          <span
            className={`mt-0.5 block truncate text-sm ${
              opcaoSelecionada ? "font-medium text-gray-700" : "text-gray-400"
            }`}
          >
            {opcaoSelecionada?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2">
          <div className="flex max-h-56 flex-col rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
            <div className="mb-2 flex shrink-0 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Pesquisar..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>

            <div className="agenda-filtro-scroll min-h-0 flex-1 overflow-y-auto pr-1">
              {filtradas.map((opcao) => {
                const selecionada = valor === opcao.valor;

                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => {
                      onChange(opcao.valor);
                      setAberto(false);
                      setBusca("");
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      selecionada
                        ? "bg-[#F3EAF8] text-[#9F64AF]"
                        : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                    }`}
                  >
                    <span className="truncate font-medium">{opcao.label}</span>
                    {selecionada ? (
                      <Check size={15} className="shrink-0 text-[#9F64AF]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FiltrosNotificacoes({
  filtros,
  onChange,
}: FiltrosNotificacoesProps) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [posicaoPopover, setPosicaoPopover] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    abrirAcima: boolean;
  } | null>(null);
  const painelRef = useRef<HTMLDivElement | null>(null);
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const filtrosAtivos = contarFiltrosAtivos(filtros);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    const atualizarPosicao = () => {
      const botao = botaoRef.current;
      if (!botao) return;

      const rect = botao.getBoundingClientRect();
      const width = Math.min(window.innerWidth - 24, 360);
      const left = Math.min(
        Math.max(rect.left, 12),
        window.innerWidth - width - 12,
      );
      const espacoAbaixo = window.innerHeight - rect.bottom - 12;
      const espacoAcima = rect.top - 12;
      const distancia = 8;
      const alturaPreferida = Math.min(520, window.innerHeight - 24);
      const abrirAcima = espacoAbaixo < 280 && espacoAcima > espacoAbaixo;
      const maxHeight = Math.max(
        240,
        Math.min(
          alturaPreferida,
          abrirAcima
            ? Math.max(240, rect.top - 12)
            : Math.max(240, window.innerHeight - rect.bottom - distancia - 12),
        ),
      );
      const top = abrirAcima
        ? Math.max(12, rect.top - distancia - maxHeight)
        : rect.bottom + distancia;

      setPosicaoPopover({ top, left, width, maxHeight, abrirAcima });
    };

    atualizarPosicao();

    function handlePointerDown(evento: PointerEvent) {
      if (!painelRef.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto]);

  return (
    <div
      ref={painelRef}
      className={`relative inline-flex items-center gap-2 rounded-2xl border border-[#9F64AF]/15 bg-white/70 px-2.5 py-2 shadow-sm backdrop-blur-sm ${aberto ? "z-[9999]" : ""}`}
    >
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="relative rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-[#F8F3FB] hover:text-[#9F64AF]"
        title="Filtrar notificações"
      >
        <SlidersHorizontal size={17} />
        {filtrosAtivos > 0 ? (
          <span className="-right-1 -top-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9F64AF] px-1 text-[10px] font-bold text-white">
            {filtrosAtivos}
          </span>
        ) : null}
      </button>

      <span className="pr-1 text-xs font-medium text-gray-500">
        {filtrosAtivos}{" "}
        {filtrosAtivos === 1 ? "filtro ativo" : "filtros ativos"}
      </span>

      {aberto && montado && posicaoPopover
        ? createPortal(
            <div
              className="fixed z-[9999]"
              style={{
                top: `${posicaoPopover.top}px`,
                left: `${posicaoPopover.left}px`,
                width: `${posicaoPopover.width}px`,
                maxHeight: `${posicaoPopover.maxHeight}px`,
              }}
              onPointerDown={(evento) => evento.stopPropagation()}
            >
              <span
                className={`absolute z-10 h-4 w-4 rotate-45 border-l border-t border-[#9F64AF]/15 bg-white/95 backdrop-blur-sm ${
                  posicaoPopover.abrirAcima
                    ? "-bottom-2 left-4"
                    : "-top-2 left-4"
                }`}
              />
              <div className="relative flex h-full max-h-full flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
                <div className="shrink-0 border-b border-[#F3EAF8] bg-white/95 px-1 pb-3 pt-0">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Filtrar notificações
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Selecione os filtros que deseja aplicar.
                  </p>
                </div>

                <div className="agenda-filtro-scroll min-h-0 flex-1 overflow-y-auto py-1 pr-1 pb-3">
                  <CampoFiltro
                    label="Leitura"
                    valor={filtros.leitura}
                    opcoes={OPCOES_LEITURA}
                    placeholder="Todas"
                    painelInteracaoRef={painelRef}
                    onChange={(valor) =>
                      onChange({
                        ...filtros,
                        leitura: valor as FiltroLeituraNotificacoes,
                      })
                    }
                  />
                  <CampoFiltro
                    label="Tipo"
                    valor={filtros.tipo}
                    opcoes={OPCOES_TIPO}
                    placeholder="Todos"
                    painelInteracaoRef={painelRef}
                    onChange={(valor) =>
                      onChange({
                        ...filtros,
                        tipo: valor as FiltroTipoNotificacoes,
                      })
                    }
                  />
                  <CampoFiltro
                    label="Período"
                    valor={filtros.periodo}
                    opcoes={OPCOES_PERIODO}
                    placeholder="Todas"
                    painelInteracaoRef={painelRef}
                    onChange={(valor) =>
                      onChange({
                        ...filtros,
                        periodo: valor as FiltroPeriodoNotificacoes,
                      })
                    }
                  />
                </div>

                <div className="shrink-0 border-t border-[#F3EAF8] bg-white/95 px-1 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {filtrosAtivos}{" "}
                      {filtrosAtivos === 1 ? "filtro" : "filtros"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange(FILTROS_PADRAO)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                    >
                      <BrushCleaning size={13} />
                      Limpar filtros
                    </button>
                  </div>
                </div>

                <style jsx global>{`
                  .agenda-filtro-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(159, 100, 175, 0.45) transparent;
                  }
                  .agenda-filtro-scroll::-webkit-scrollbar {
                    width: 7px;
                  }
                  .agenda-filtro-scroll::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .agenda-filtro-scroll::-webkit-scrollbar-thumb {
                    background: rgba(159, 100, 175, 0.35);
                    border-radius: 999px;
                  }
                  .agenda-filtro-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(159, 100, 175, 0.55);
                  }
                `}</style>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
