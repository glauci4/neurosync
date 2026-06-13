"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdErrorOutline } from "react-icons/md";

export interface DropdownSelectOption {
  value: string;
  label: string;
  descricao?: string;
}

interface DropdownSelectProps {
  label: string;
  value: string;
  options: DropdownSelectOption[];
  placeholder: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function DropdownSelect({
  label,
  value,
  options,
  placeholder,
  error,
  required,
  disabled,
  onChange,
}: DropdownSelectProps) {
  const [aberto, setAberto] = useState(false);
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

  const selecionada = options.find((opcao) => opcao.value === value);
  const mostrarPlaceholder = !value;

  useEffect(() => {
    setMontado(true);
  }, []);

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
        espacoAbaixo < 220 && espacoAcima > espacoAbaixo + margem;
      const maxHeightBase = 260;
      const maxHeight = Math.max(
        150,
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
    };

    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAberto(false);
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

  const alternar = () => {
    if (disabled) return;
    setAberto((atual) => !atual);
  };

  const selecionar = (valor: string) => {
    onChange(valor);
    setAberto(false);
  };

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <button
        ref={botaoRef}
        type="button"
        onClick={alternar}
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white/90 px-3 text-left text-sm text-gray-700 shadow-sm transition hover:border-[#9F64AF]/50 focus:outline-none focus:ring-2 focus:ring-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? "border-red-300" : "border-gray-200"
        }`}
      >
        <span
          className={mostrarPlaceholder ? "truncate text-gray-400" : "truncate"}
        >
          {mostrarPlaceholder ? placeholder : selecionada?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>
      <div className="mt-1.5 min-h-5">
        {error ? (
          <p className="flex items-center gap-1.5 text-xs font-medium leading-5 text-red-500">
            <MdErrorOutline size={16} className="shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>

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
            <div
              className="dropdown-scroll min-h-0 overflow-y-auto pr-1"
              style={{ maxHeight: `${posicao.maxHeight}px` }}
            >
              {options.map((opcao) => {
                const selecionadaAgora = value === opcao.value;

                return (
                  <button
                    key={opcao.value}
                    type="button"
                    onClick={() => selecionar(opcao.value)}
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
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
