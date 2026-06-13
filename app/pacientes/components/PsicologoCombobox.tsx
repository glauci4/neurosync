"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdErrorOutline } from "react-icons/md";

interface OpcaoCombobox {
  valor: string;
  label: string;
  descricao?: string;
}

interface PsicologoComboboxProps {
  label: string;
  value: string;
  opcoes: OpcaoCombobox[];
  placeholder: string;
  erro?: string;
  obrigatorio?: boolean;
  onChange: (valor: string) => void;
}

export default function PsicologoCombobox({
  label,
  value,
  opcoes,
  placeholder,
  erro,
  obrigatorio,
  onChange,
}: PsicologoComboboxProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [montado, setMontado] = useState(false);
  const [posicao, setPosicao] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    abrirAcima: boolean;
  } | null>(null);
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const painelRef = useRef<HTMLDivElement | null>(null);

  const selecionada = opcoes.find((opcao) => opcao.valor === value);
  const filtradas = useMemo(
    () =>
      opcoes.filter((opcao) =>
        `${opcao.label} ${opcao.descricao || ""}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [busca, opcoes],
  );

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;

    const calcularPosicao = () => {
      const botao = botaoRef.current;
      if (!botao) return;

      const rect = botao.getBoundingClientRect();
      const margem = 8;
      const limiteViewport = 12;
      const espacoAbaixo = window.innerHeight - rect.bottom - limiteViewport;
      const espacoAcima = rect.top - limiteViewport;
      const abrirAcima =
        espacoAbaixo < 240 && espacoAcima > espacoAbaixo + margem;
      const maxHeightBase = 280;
      const maxHeight = Math.max(
        160,
        Math.min(maxHeightBase, abrirAcima ? espacoAcima : espacoAbaixo),
      );

      setPosicao({
        top: abrirAcima
          ? Math.max(limiteViewport, rect.top - maxHeight - margem)
          : rect.bottom + margem,
        left: rect.left,
        width: rect.width,
        maxHeight,
        abrirAcima,
      });
    };

    const handleCliqueFora = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (
        botaoRef.current?.contains(alvo) ||
        painelRef.current?.contains(alvo)
      ) {
        return;
      }
      setAberto(false);
      setBusca("");
    };

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAberto(false);
        setBusca("");
      }
    };

    calcularPosicao();
    window.addEventListener("resize", calcularPosicao);
    window.addEventListener("scroll", calcularPosicao, true);
    document.addEventListener("mousedown", handleCliqueFora, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("resize", calcularPosicao);
      window.removeEventListener("scroll", calcularPosicao, true);
      document.removeEventListener("mousedown", handleCliqueFora, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [aberto]);

  const abrir = () => {
    setAberto((atual) => !atual);
    setBusca("");
  };

  const selecionar = (valorSelecionado: string) => {
    onChange(valorSelecionado);
    setAberto(false);
    setBusca("");
  };

  return (
    <div className="relative">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </span>
      <button
        ref={botaoRef}
        type="button"
        onClick={abrir}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white/90 px-3 text-left text-sm text-gray-700 shadow-sm transition hover:border-[#9F64AF]/50 ${
          erro ? "border-red-300" : "border-gray-200"
        }`}
      >
        <span className={selecionada ? "truncate" : "truncate text-gray-400"}>
          {selecionada?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>
      {erro && (
        <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-500">
          <MdErrorOutline size={14} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </p>
      )}

      {aberto &&
        montado &&
        posicao &&
        createPortal(
          <div
            ref={painelRef}
            className="fixed z-[10000] rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"
            style={{
              top: posicao.top,
              left: posicao.left,
              width: posicao.width,
              maxHeight: posicao.maxHeight,
            }}
          >
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Pesquisar..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>

            <div
              className="dropdown-scroll min-h-0 overflow-y-auto pr-1"
              style={{ maxHeight: `calc(${posicao.maxHeight}px - 56px)` }}
            >
              {filtradas.map((opcao) => {
                const selecionadaAgora = value === opcao.valor;

                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => selecionar(opcao.valor)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      selecionadaAgora
                        ? "bg-[#F3EAF8] text-[#9F64AF]"
                        : "text-gray-700 hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {opcao.label}
                      </span>
                      {opcao.descricao && (
                        <span
                          className={`block truncate text-xs ${
                            selecionadaAgora
                              ? "text-[#9F64AF]/75"
                              : "text-gray-400"
                          }`}
                        >
                          {opcao.descricao}
                        </span>
                      )}
                    </span>
                    {selecionadaAgora && (
                      <Check size={15} className="shrink-0 text-[#9F64AF]" />
                    )}
                  </button>
                );
              })}

              {filtradas.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-gray-400">
                  Nenhum resultado encontrado.
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
