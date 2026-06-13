// app/inicio/components/FiltrosInicio.tsx
// Filtros rápidos da Home em um popover compacto, no padrão visual do sistema.

"use client";

import {
  BrushCleaning,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { ComponentType, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type StatusFiltroInicio =
  | "todos"
  | "em_andamento"
  | "agendadas"
  | "concluidas"
  | "pendentes";

export interface EstadoFiltrosInicio {
  status: StatusFiltroInicio;
  psicologo_id?: number;
  sala?: string;
}

interface OpcaoFiltro {
  valor: string;
  label: string;
  descricao?: string;
  icone?: ComponentType<{ size?: number; className?: string }>;
}

interface FiltrosInicioProps {
  filtros: EstadoFiltrosInicio;
  psicologos: OpcaoFiltro[];
  salas: OpcaoFiltro[];
  mostrarPsicologos: boolean;
  onChange: (filtros: EstadoFiltrosInicio) => void;
}

const STATUS_OPCOES: OpcaoFiltro[] = [
  {
    valor: "todos",
    label: "Todos",
    descricao: "Todas as consultas do dia",
  },
  {
    valor: "em_andamento",
    label: "Em andamento",
    descricao: "Consultas em curso no horário atual",
  },
  {
    valor: "agendadas",
    label: "Agendadas",
    descricao: "Consultas futuras do dia",
  },
  {
    valor: "concluidas",
    label: "Concluídas",
    descricao: "Consultas finalizadas",
  },
  {
    valor: "pendentes",
    label: "Pendentes",
    descricao: "Consultas que ainda exigem atenção",
  },
];

function ComboboxFiltro({
  label,
  valor,
  opcoes,
  placeholder,
  pesquisavel = true,
  painelInteracaoRef,
  onChange,
}: {
  label: string;
  valor?: string;
  opcoes: OpcaoFiltro[];
  placeholder: string;
  pesquisavel?: boolean;
  painelInteracaoRef?: RefObject<HTMLDivElement | null>;
  onChange: (valor?: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const painelInteracaoAtualRef = useRef<HTMLDivElement | null>(null);
  painelInteracaoAtualRef.current = painelInteracaoRef?.current ?? null;

  const opcaoSelecionada = opcoes.find((opcao) => opcao.valor === valor);
  const IconeSelecionado = opcaoSelecionada?.icone;

  const filtradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        `${opcao.label} ${opcao.descricao || ""}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );

  useEffect(() => {
    if (!aberto) return;

    const fecharAoClicarFora = (evento: PointerEvent) => {
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
    };

    const fecharComEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    };

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
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
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-sm text-gray-700">
            {IconeSelecionado && (
              <IconeSelecionado size={15} className="shrink-0 text-[#9F64AF]" />
            )}
            <span
              className={`truncate ${opcaoSelecionada ? "font-medium" : "text-gray-400"}`}
            >
              {opcaoSelecionada?.label || placeholder}
            </span>
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div
          className="mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
          onPointerDown={(evento) => evento.stopPropagation()}
        >
          {pesquisavel && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Pesquisar..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
          )}

          <div
            className={
              pesquisavel
                ? "agenda-filtro-scroll max-h-48 overflow-y-auto pr-1"
                : "agenda-filtro-scroll max-h-36 space-y-1 overflow-y-auto pr-1"
            }
          >
            {opcoes.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">
                Nenhuma opção disponível.
              </div>
            ) : (
              filtradas.map((opcao) => (
                <OpcaoFiltroLinha
                  key={opcao.valor}
                  opcao={opcao}
                  selecionada={opcao.valor === valor}
                  onSelecionar={() => {
                    onChange(opcao.valor);
                    setAberto(false);
                    setBusca("");
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OpcaoFiltroLinha({
  opcao,
  selecionada,
  onSelecionar,
}: {
  opcao: OpcaoFiltro;
  selecionada: boolean;
  onSelecionar: () => void;
}) {
  const Icone = opcao.icone;

  return (
    <button
      type="button"
      onClick={onSelecionar}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
        selecionada
          ? "bg-[#F3EAF8] text-[#9F64AF]"
          : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icone && <Icone size={15} className="shrink-0 text-[#9F64AF]" />}
        <span className="min-w-0">
          <span className="block truncate font-medium">{opcao.label}</span>
          {opcao.descricao && (
            <span
              className={`block truncate text-xs ${
                selecionada ? "text-[#9F64AF]/75" : "text-gray-400"
              }`}
            >
              {opcao.descricao}
            </span>
          )}
        </span>
      </span>
      {selecionada && <Check size={15} className="shrink-0 text-[#9F64AF]" />}
    </button>
  );
}

export default function FiltrosInicio({
  filtros,
  psicologos,
  salas,
  mostrarPsicologos,
  onChange,
}: FiltrosInicioProps) {
  const [aberto, setAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement | null>(null);

  const filtrosAtivos = [
    filtros.status !== "todos",
    Boolean(filtros.psicologo_id),
    Boolean(filtros.sala),
  ].filter(Boolean).length;

  useEffect(() => {
    if (!aberto) return;

    const fecharAoClicarFora = (evento: PointerEvent) => {
      const caminhoEvento = evento.composedPath();
      if (painelRef.current && !caminhoEvento.includes(painelRef.current)) {
        setAberto(false);
      }
    };

    const fecharComEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [aberto]);

  const limparFiltros = () =>
    onChange({
      status: "todos",
      psicologo_id: undefined,
      sala: undefined,
    });

  return (
    <div ref={painelRef} className={`relative ${aberto ? "z-[9999]" : ""}`}>
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="relative inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white/85 p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-[#9F64AF]"
        title="Filtrar painel"
      >
        <SlidersHorizontal size={18} />
        {filtrosAtivos > 0 && (
          <span className="-top-1 -right-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9F64AF] px-1 text-[10px] font-bold text-white">
            {filtrosAtivos}
          </span>
        )}
      </button>

      {aberto && (
        <div
          className="absolute right-0 top-full z-[9999] mt-2 w-[min(92vw,390px)]"
          onPointerDown={(evento) => evento.stopPropagation()}
        >
          <span className="-top-2 right-3 absolute z-10 h-4 w-4 rotate-45 border-t border-l border-[#9F64AF]/15 bg-white/95 backdrop-blur-sm" />

          <div className="relative flex max-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-2xl border border-[#9F64AF]/15 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
            <div className="shrink-0 border-b border-[#F3EAF8] px-1 pb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Filtrar painel
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Refine as consultas exibidas hoje.
              </p>
            </div>

            <div className="agenda-filtro-scroll min-h-0 flex-1 overflow-y-auto py-1 pr-1 pb-3">
              <ComboboxFiltro
                label="Status"
                valor={filtros.status}
                opcoes={STATUS_OPCOES}
                placeholder="Todos"
                pesquisavel={false}
                painelInteracaoRef={painelRef}
                onChange={(valor) =>
                  onChange({
                    ...filtros,
                    status: (valor || "todos") as EstadoFiltrosInicio["status"],
                  })
                }
              />

              {mostrarPsicologos && (
                <ComboboxFiltro
                  label="Psicólogo"
                  valor={
                    filtros.psicologo_id
                      ? String(filtros.psicologo_id)
                      : undefined
                  }
                  opcoes={psicologos}
                  placeholder="Todos"
                  painelInteracaoRef={painelRef}
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      psicologo_id: valor ? Number(valor) : undefined,
                    })
                  }
                />
              )}

              <ComboboxFiltro
                label="Sala"
                valor={filtros.sala}
                opcoes={salas}
                placeholder="Todas"
                painelInteracaoRef={painelRef}
                onChange={(valor) =>
                  onChange({
                    ...filtros,
                    sala: valor,
                  })
                }
              />
            </div>

            <div className="shrink-0 border-t border-[#F3EAF8] bg-white/95 px-1 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {filtrosAtivos}{" "}
                  {filtrosAtivos === 1 ? "filtro ativo" : "filtros ativos"}
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
        </div>
      )}
    </div>
  );
}
