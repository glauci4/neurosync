"use client";

import { motion } from "framer-motion";
import { CalendarOff, CalendarX2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendarCheck } from "react-icons/lu";

interface ModalConfirmacaoConsultaProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  carregando?: boolean;
  variante?: "perigo" | "sucesso" | "aviso";
  onClose: () => void;
  onConfirmar: () => void;
}

const variantes = {
  perigo: {
    icone: CalendarX2,
    textoBotao: "Confirmar",
  },
  sucesso: {
    icone: LuCalendarCheck,
    textoBotao: "Confirmar",
  },
  aviso: {
    icone: CalendarOff,
    textoBotao: "Confirmar",
  },
};

export default function ModalConfirmacaoConsulta({
  aberto,
  titulo,
  descricao,
  textoConfirmar,
  carregando = false,
  variante = "aviso",
  onClose,
  onConfirmar,
}: ModalConfirmacaoConsultaProps) {
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
  const Icone = variantes[variante].icone;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md rounded-2xl border border-[#9F64AF]/15 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar confirmação"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EAF8]">
            <Icone size={28} className="text-[#9F64AF]" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">{titulo}</h2>
          <p className="mb-6 text-sm leading-6 text-gray-600">{descricao}</p>

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={onConfirmar}
              className="flex-1 rounded-lg bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? "Processando..." : textoConfirmar}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
