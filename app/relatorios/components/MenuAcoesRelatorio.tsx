"use client";

import { MoreVertical } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PosicaoPopover {
  top: number;
  left: number;
  width: number;
}

interface MenuAcoesRelatorioProps {
  children: ReactNode;
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

export default function MenuAcoesRelatorio({
  children,
}: MenuAcoesRelatorioProps) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [posicao, setPosicao] = useState<PosicaoPopover | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      const alvo = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(alvo) &&
        botaoRef.current &&
        !botaoRef.current.contains(alvo)
      ) {
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

    function atualizarPosicao() {
      setPosicao(calcularPosicao(botaoRef.current));
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

  function toggleMenu() {
    setAberto((atual) => !atual);
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={botaoRef}
        type="button"
        onClick={toggleMenu}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#9F64AF]/30 bg-[#F3E8F7] text-[#9F64AF] shadow-sm transition hover:bg-[#E1D4F0] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[var(--ns-border)] dark:bg-[var(--ns-surface-soft)] dark:hover:bg-[#F3E8F7]"
        aria-label="Ações do relatório"
        title="Ações do relatório"
      >
        <MoreVertical size={16} />
      </button>

      {aberto && montado && posicao
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] rounded-2xl border border-[#9F64AF]/15 bg-white p-2 shadow-2xl"
              role="menu"
              aria-label="Menu de ações do relatório"
              style={{
                top: `${posicao.top}px`,
                left: `${posicao.left}px`,
                width: `${posicao.width}px`,
              }}
              onPointerDownCapture={(evento) => evento.stopPropagation()}
              onMouseDownCapture={(evento) => evento.stopPropagation()}
            >
              <div className="space-y-1">{children}</div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
