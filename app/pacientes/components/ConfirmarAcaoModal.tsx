// app/pacientes/components/ConfirmarAcaoModal.tsx
// Modal customizado de confirmação para ações de pacientes (inativar, reativar, excluir)

"use client";

import { motion } from "framer-motion";
import { ArchiveRestore, Trash2, UserMinus, X } from "lucide-react";

interface ConfirmarAcaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  confirmando?: boolean;
  tipo?: "inativar" | "reativar" | "excluir";
}

export default function ConfirmarAcaoModal({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  confirmando = false,
  tipo = "inativar",
}: ConfirmarAcaoModalProps) {
  if (!isOpen) return null;

  // Configurações de ícone e texto conforme o tipo (todas com a mesma cor lilás)
  const config = {
    inativar: {
      icone: <UserMinus size={28} className="text-[#9F64AF]" />,
      textoBotao: "Inativar",
    },
    reativar: {
      icone: <ArchiveRestore size={28} className="text-[#9F64AF]" />,
      textoBotao: "Reativar",
    },
    excluir: {
      icone: <Trash2 size={28} className="text-[#9F64AF]" />,
      textoBotao: "Excluir",
    },
  };

  const { icone, textoBotao } = config[tipo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay escuro com blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card do modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Ícone com fundo lilás claro */}
          <div className="w-14 h-14 bg-[#F3EAF8] rounded-full flex items-center justify-center mb-4">
            {icone}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{titulo}</h3>
          <p className="text-sm text-gray-600 mb-6">{mensagem}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmando}
              className="flex-1 px-4 py-2 bg-[#9F64AF] text-white rounded-lg hover:bg-[#8B509B] transition disabled:opacity-50"
            >
              {confirmando ? "Processando..." : textoBotao}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

