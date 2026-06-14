"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ModalConfirmacao({
  aberto,
  titulo,
  descricao,
  textoConfirmar,
  carregando,
  variante = "padrao",
  onClose,
  onConfirmar,
}: {
  aberto: boolean;
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  carregando?: boolean;
  variante?: "padrao" | "perigo";
  onClose: () => void;
  onConfirmar: () => void;
}) {
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  if (!aberto || !montado) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-2xl border border-[#9F64AF]/15 bg-white p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{descricao}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={carregando}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-60 ${
              variante === "perigo"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#9F64AF] hover:bg-[#8B509B]"
            }`}
          >
            {carregando ? "Processando..." : textoConfirmar}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
