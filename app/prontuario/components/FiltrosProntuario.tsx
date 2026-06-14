"use client";

import {
  BrushCleaning,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface OpcaoFiltro {
  valor: string;
  label: string;
  descricao?: string;
}

interface EstadoFiltrosProntuario {
  paciente_id?: number;
  psicologo_id?: number;
  status?: string;
  status_paciente?: "ativo" | "inativo";
  periodo?: string;
  tipo_atendimento?: string;
}

const TIPOS_ATENDIMENTO: OpcaoFiltro[] = [
  { valor: "triagem", label: "Triagem" },
  { valor: "psicoterapia", label: "Psicoterapia" },
  { valor: "devolutiva", label: "Devolutiva" },
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "orientacao", label: "Orientação" },
  { valor: "retorno", label: "Retorno" },
  { valor: "alta", label: "Alta" },
  { valor: "outro", label: "Outro" },
];

const STATUS_OPCOES: OpcaoFiltro[] = [
  { valor: "rascunho", label: "Rascunhos" },
  { valor: "finalizado", label: "Finalizados" },
  { valor: "assinado", label: "Assinados" },
];

const PERIODO_OPCOES: OpcaoFiltro[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "semana", label: "Esta semana" },
  { valor: "mes", label: "Este mês" },
];

const STATUS_PACIENTE_OPCOES: OpcaoFiltro[] = [
  { valor: "ativo", label: "Pacientes ativos" },
  { valor: "inativo", label: "Pacientes inativos" },
];

function OpcaoFiltroProntuario({
  label,
  descricao,
  selecionada,
  onClick,
}: {
  label: string;
  descricao?: string;
  selecionada: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
        selecionada
          ? "bg-[#F3EAF8] text-[#9F64AF]"
          : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{label}</span>
        {descricao && (
          <span
            className={`block truncate text-xs ${
              selecionada ? "text-[#9F64AF]/75" : "text-gray-400"
            }`}
          >
            {descricao}
          </span>
        )}
      </span>
      {selecionada && <Check size={15} className="shrink-0 text-[#9F64AF]" />}
    </button>
  );
}

function ComboboxFiltroProntuario({
  label,
  valor,
  opcoes,
  placeholder,
  onChange,
}: {
  label: string;
  valor?: string;
  opcoes: OpcaoFiltro[];
  placeholder: string;
  onChange: (valor?: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const opcoesFiltradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        `${opcao.label} ${opcao.descricao || ""}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);

  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  const selecionar = (novoValor?: string) => {
    onChange(novoValor);
    setAberto(false);
    setBusca("");
  };

  return (
    <div className="relative border-gray-100 border-b py-2.5 last:border-b-0">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#F3EAF8]"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold text-gray-400 uppercase">
            {label}
          </span>
          <span
            className={`mt-0.5 block truncate text-sm ${
              selecionada ? "font-medium text-gray-700" : "text-gray-400"
            }`}
          >
            {selecionada?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && (
        <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="agenda-filtro-scroll max-h-48 overflow-y-auto pr-1">
            <OpcaoFiltroProntuario
              label="Todos"
              selecionada={!valor}
              onClick={() => selecionar(undefined)}
            />
            {opcoesFiltradas.map((opcao) => (
              <OpcaoFiltroProntuario
                key={opcao.valor}
                label={opcao.label}
                descricao={opcao.descricao}
                selecionada={valor === opcao.valor}
                onClick={() => selecionar(opcao.valor)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FiltrosProntuario({
  filtros,
  pacientes,
  psicologos,
  onChange,
}: {
  filtros: EstadoFiltrosProntuario;
  pacientes: OpcaoFiltro[];
  psicologos: OpcaoFiltro[];
  onChange: (filtros: EstadoFiltrosProntuario) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({
    top: 0,
    left: 0,
    width: 380,
    maxHeight: 520,
    arrowLeft: 330,
  });
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  const atualizarPosicao = useCallback(() => {
    if (!botaoRef.current) return;

    const rect = botaoRef.current.getBoundingClientRect();
    const margem = 16;
    const espacamento = 12;
    const largura = Math.min(380, window.innerWidth - margem * 2);
    const top = rect.bottom + espacamento;
    const left = Math.min(
      Math.max(margem, rect.right - largura),
      window.innerWidth - largura - margem,
    );
    const alturaDisponivel = Math.max(140, window.innerHeight - top - margem);
    const maxHeight = Math.min(
      Math.floor(window.innerHeight * 0.7),
      alturaDisponivel,
    );

    setPosicao({
      top,
      left,
      width: largura,
      maxHeight,
      arrowLeft: Math.min(
        Math.max(18, rect.left + rect.width / 2 - left - 8),
        largura - 34,
      ),
    });
  }, []);

  useEffect(() => {
    if (!aberto) return;
    atualizarPosicao();

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    const handleClickOutside = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(alvo) &&
        botaoRef.current &&
        !botaoRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    };
    const handleViewportChange = () => atualizarPosicao();

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [aberto, atualizarPosicao]);

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => {
          setAberto((atual) => {
            const proximo = !atual;
            if (proximo) requestAnimationFrame(atualizarPosicao);
            return proximo;
          });
        }}
        className="relative rounded-xl border border-gray-300 bg-white/85 p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-[#9F64AF]"
        title="Filtrar prontuário"
        aria-label="Filtrar prontuário"
        aria-expanded={aberto}
      >
        <SlidersHorizontal size={18} />
        {filtrosAtivos > 0 && (
          <span className="-top-1 -right-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9F64AF] px-1 text-[10px] font-bold text-white">
            {filtrosAtivos}
          </span>
        )}
      </button>

      {aberto
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[10000] flex flex-col overflow-visible rounded-2xl border border-[#9F64AF]/15 bg-white/95 p-3 shadow-2xl backdrop-blur-sm"
              style={{
                top: posicao.top,
                left: posicao.left,
                width: posicao.width,
                maxHeight: posicao.maxHeight,
              }}
              role="dialog"
              aria-label="Filtros do prontuário"
            >
              <span
                className="-top-2 absolute h-4 w-4 rotate-45 border-t border-l border-[#9F64AF]/15 bg-white/95 backdrop-blur-sm"
                style={{ left: posicao.arrowLeft }}
              />
              <div className="shrink-0 border-[#F3EAF8] border-b px-1 pb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Filtrar prontuário
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Refine o histórico clínico exibido na timeline.
                </p>
              </div>

              <div className="agenda-filtro-scroll min-h-0 flex-1 overflow-y-auto py-1 pr-1">
                <ComboboxFiltroProntuario
                  label="Paciente"
                  valor={
                    filtros.paciente_id
                      ? String(filtros.paciente_id)
                      : undefined
                  }
                  opcoes={pacientes}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      paciente_id: valor ? Number(valor) : undefined,
                    })
                  }
                />
                <ComboboxFiltroProntuario
                  label="Psicólogo"
                  valor={
                    filtros.psicologo_id
                      ? String(filtros.psicologo_id)
                      : undefined
                  }
                  opcoes={psicologos}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      psicologo_id: valor ? Number(valor) : undefined,
                    })
                  }
                />
                <ComboboxFiltroProntuario
                  label="Status do paciente"
                  valor={filtros.status_paciente}
                  opcoes={STATUS_PACIENTE_OPCOES}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({
                      ...filtros,
                      status_paciente: valor as "ativo" | "inativo" | undefined,
                    })
                  }
                />
                <ComboboxFiltroProntuario
                  label="Status"
                  valor={filtros.status}
                  opcoes={STATUS_OPCOES}
                  placeholder="Todos"
                  onChange={(valor) => onChange({ ...filtros, status: valor })}
                />
                <ComboboxFiltroProntuario
                  label="Período"
                  valor={filtros.periodo}
                  opcoes={PERIODO_OPCOES}
                  placeholder="Todos"
                  onChange={(valor) => onChange({ ...filtros, periodo: valor })}
                />
                <ComboboxFiltroProntuario
                  label="Tipo de atendimento"
                  valor={filtros.tipo_atendimento}
                  opcoes={TIPOS_ATENDIMENTO}
                  placeholder="Todos"
                  onChange={(valor) =>
                    onChange({ ...filtros, tipo_atendimento: valor })
                  }
                />
              </div>

              <div className="flex shrink-0 items-center justify-between border-[#F3EAF8] border-t bg-white/95 px-1 pt-3">
                <span className="text-xs text-gray-400">
                  {filtrosAtivos} {filtrosAtivos === 1 ? "filtro" : "filtros"}
                </span>
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                >
                  <BrushCleaning size={13} />
                  Limpar filtros
                </button>
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
