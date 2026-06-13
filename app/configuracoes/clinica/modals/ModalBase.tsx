"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalBaseProps {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  fecharAoClicarFora?: boolean;
  larguraMaxima?: string;
}

export default function ModalBase({
  aberto,
  titulo,
  descricao,
  onClose,
  children,
  className = "",
  fecharAoClicarFora = true,
  larguraMaxima = "max-w-4xl",
}: ModalBaseProps) {
  useEffect(() => {
    if (!aberto) return undefined;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [aberto, onClose]);

  if (!aberto || typeof document === "undefined") return null;

  return createPortal(
    <>
      {fecharAoClicarFora ? (
        <button
          type="button"
          aria-label="Fechar modal"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#2B1F31]/40 backdrop-blur-sm"
        />
      ) : null}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-base-titulo"
          className={`relative w-full ${larguraMaxima} overflow-hidden rounded-2xl border border-[#9F64AF]/20 bg-white/95 shadow-2xl ${className}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200/70 px-6 py-4">
            <div className="min-w-0">
              <h2
                id="modal-base-titulo"
                className="text-lg font-semibold text-gray-800"
              >
                {titulo}
              </h2>
              {descricao ? (
                <p className="mt-1 text-sm text-gray-500">{descricao}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-140px)] overflow-y-auto px-6 py-5">
            {children}
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}

