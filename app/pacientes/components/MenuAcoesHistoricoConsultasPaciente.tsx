"use client";

import { FileText, MoreVertical, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MenuAcoesHistoricoConsultasPacienteProps {
  onGerarPdf: () => void;
  onImprimir: () => void;
}

interface PosicaoPopover {
  top: number;
  left: number;
  width: number;
}

function classNameAcao(base: string) {
  return `inline-flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-[#F3E8F7] hover:text-[#9F64AF] disabled:cursor-not-allowed disabled:opacity-60 ${base}`;
}

function calcularPosicao(botao: HTMLButtonElement | null): PosicaoPopover {
  if (!botao || typeof window === "undefined") {
    return { top: 0, left: 0, width: 0 };
  }

  const rect = botao.getBoundingClientRect();
  const largura = 216;
  const margem = 8;
  const leftIdeal = rect.right - largura;
  const left = Math.min(
    Math.max(12, leftIdeal),
    Math.max(12, window.innerWidth - largura - 12),
  );

  return {
    top: rect.bottom + margem,
    left,
    width: largura,
  };
}

export default function MenuAcoesHistoricoConsultasPaciente({
  onGerarPdf,
  onImprimir,
}: MenuAcoesHistoricoConsultasPacienteProps) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [posicao, setPosicao] = useState<PosicaoPopover | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (evento: PointerEvent) => {
      const alvo = evento.target as Node;
      if (
        aberto &&
        menuRef.current &&
        !menuRef.current.contains(alvo) &&
        botaoRef.current &&
        !botaoRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function atualizarPosicao() {
      setPosicao(calcularPosicao(botaoRef.current));
    }

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    atualizarPosicao();
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto]);

  return (
    <div className="relative shrink-0">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#9F64AF]/30 bg-[#F3E8F7] text-[#9F64AF] shadow-sm transition hover:bg-[#E1D4F0]"
        aria-label="Ações do histórico"
        title="Ações do histórico"
      >
        <MoreVertical size={16} />
      </button>

      {aberto && montado && posicao
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] w-56 rounded-2xl border border-[#9F64AF]/15 bg-white p-2 shadow-2xl"
              style={{
                top: `${posicao.top}px`,
                left: `${posicao.left}px`,
                width: `${posicao.width}px`,
              }}
              onPointerDownCapture={(evento) => evento.stopPropagation()}
              onMouseDownCapture={(evento) => evento.stopPropagation()}
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    onGerarPdf();
                  }}
                  className={classNameAcao("")}
                >
                  <FileText size={15} />
                  Gerar PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    onImprimir();
                  }}
                  className={classNameAcao("")}
                >
                  <Printer size={15} />
                  Imprimir
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
