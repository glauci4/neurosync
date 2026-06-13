import {
  BrushCleaning,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { ComponentType, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { agendaStatusOpcoes } from "../constants/agendaStatusConfig";

interface Opcao {
  valor: string;
  label: string;
  descricao?: string;
  icone?: ComponentType<{ size?: number; className?: string }>;
}

export interface EstadoFiltrosAgenda {
  paciente_id?: number;
  psicologo_id?: number;
  sala_id?: number;
  status?: string;
  tipo_atendimento?: string;
}

interface FiltrosAgendaProps {
  filtros: EstadoFiltrosAgenda;
  pacientes: Opcao[];
  psicologos: Opcao[];
  salas: Opcao[];
  onChange: (filtros: EstadoFiltrosAgenda) => void;
}

const TIPOS_ATENDIMENTO: Opcao[] = [
  { valor: "triagem", label: "Triagem" },
  { valor: "psicoterapia", label: "Psicoterapia" },
  { valor: "devolutiva", label: "Devolutiva" },
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "orientacao", label: "Orientação" },
  { valor: "retorno", label: "Retorno" },
  { valor: "alta", label: "Alta" },
  { valor: "outro", label: "Outro" },
];

function ComboboxAgenda({
  label,
  valor,
  opcoes,
  placeholder,
  painelInteracaoRef,
  onChange,
}: {
  label: string;
  valor?: string;
  opcoes: Opcao[];
  placeholder: string;
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

    const fecharComEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    };
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

    document.addEventListener("keydown", fecharComEscape);
    document.addEventListener("pointerdown", fecharAoClicarFora);
    return () => {
      document.removeEventListener("keydown", fecharComEscape);
      document.removeEventListener("pointerdown", fecharAoClicarFora);
    };
  }, [aberto]);

  return (
    <div
      ref={containerRef}
      className="relative border-gray-100 border-b py-1.5 last:border-b-0"
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
          className="mt-2 flex max-h-56 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
          onPointerDown={(evento) => evento.stopPropagation()}
        >
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
            {(() => {
              const todosSelecionado = !valor;

              return (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setAberto(false);
                    setBusca("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    todosSelecionado
                      ? "bg-[#F3EAF8] text-[#9F64AF]"
                      : "text-gray-500 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                  }`}
                >
                  <span className="font-medium">Todos</span>
                  {todosSelecionado && (
                    <Check size={15} className="shrink-0 text-[#9F64AF]" />
                  )}
                </button>
              );
            })()}

            {filtradas.map((opcao) => (
              <OpcaoCombobox
                key={opcao.valor}
                opcao={opcao}
                selecionada={valor === opcao.valor}
                onSelecionar={() => {
                  onChange(opcao.valor);
                  setAberto(false);
                  setBusca("");
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpcaoCombobox({
  opcao,
  selecionada,
  onSelecionar,
}: {
  opcao: Opcao;
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

export default function FiltrosAgenda({
  filtros,
  pacientes,
  psicologos,
  salas,
  onChange,
}: FiltrosAgendaProps) {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement | null>(null);
  const statusOpcoes = agendaStatusOpcoes.map((status) => ({
    valor: status.valor,
    label: status.label,
    descricao: status.descricao,
    icone: status.icone,
  }));
  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;
  const limparFiltros = () => onChange({});

  useEffect(() => {
    if (!filtroAberto) return;

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setFiltroAberto(false);
    };
    const handlePointerDown = (evento: PointerEvent) => {
      if (!painelRef.current?.contains(evento.target as Node)) {
        setFiltroAberto(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [filtroAberto]);

  return (
    <div
      ref={painelRef}
      className={`relative ${filtroAberto ? "z-[9999]" : ""}`}
    >
      <button
        type="button"
        onClick={() => setFiltroAberto((atual) => !atual)}
        className="relative rounded-xl border border-gray-300 bg-white/85 p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-[#9F64AF]"
        title="Filtrar agenda"
      >
        <SlidersHorizontal size={18} />
        {filtrosAtivos > 0 && (
          <span className="-top-1 -right-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9F64AF] px-1 text-[10px] font-bold text-white">
            {filtrosAtivos}
          </span>
        )}
      </button>

      {filtroAberto && (
        <div
          className="absolute top-full right-0 z-[9999] mt-2 w-[min(86vw,360px)]"
          onPointerDown={(evento) => evento.stopPropagation()}
        >
          <span className="-top-2 right-3 absolute z-10 h-4 w-4 rotate-45 border-t border-l border-[#9F64AF]/15 bg-white/95 backdrop-blur-sm" />
          <div
            data-agenda-filtro-panel
            className="relative flex flex-col overflow-visible rounded-2xl border border-[#9F64AF]/15 bg-white/95 p-2.5 shadow-2xl backdrop-blur-sm"
          >
            <div className="shrink-0 border-[#F3EAF8] border-b px-1 pb-2.5">
              <h3 className="text-sm font-semibold text-gray-800">
                Filtrar agenda
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Selecione os filtros que deseja aplicar.
              </p>
            </div>

            <div className="min-h-0 py-0.5 pr-1 pb-2">
              <ComboboxAgenda
                label="Psicólogo(a)"
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
              <ComboboxAgenda
                label="Sala"
                valor={filtros.sala_id ? String(filtros.sala_id) : undefined}
                opcoes={salas}
                placeholder="Todas"
                painelInteracaoRef={painelRef}
                onChange={(valor) =>
                  onChange({
                    ...filtros,
                    sala_id: valor ? Number(valor) : undefined,
                  })
                }
              />
              <ComboboxAgenda
                label="Status"
                valor={filtros.status}
                opcoes={statusOpcoes}
                placeholder="Todos"
                painelInteracaoRef={painelRef}
                onChange={(valor) => onChange({ ...filtros, status: valor })}
              />
              <ComboboxAgenda
                label="Tipo"
                valor={filtros.tipo_atendimento}
                opcoes={TIPOS_ATENDIMENTO}
                placeholder="Todos"
                painelInteracaoRef={painelRef}
                onChange={(valor) =>
                  onChange({ ...filtros, tipo_atendimento: valor })
                }
              />
              <ComboboxAgenda
                label="Paciente"
                valor={
                  filtros.paciente_id ? String(filtros.paciente_id) : undefined
                }
                opcoes={pacientes}
                placeholder="Todos"
                painelInteracaoRef={painelRef}
                onChange={(valor) =>
                  onChange({
                    ...filtros,
                    paciente_id: valor ? Number(valor) : undefined,
                  })
                }
              />
            </div>

            <div className="shrink-0 border-[#F3EAF8] border-t bg-white/95 px-1 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {filtrosAtivos} {filtrosAtivos === 1 ? "filtro" : "filtros"}
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
