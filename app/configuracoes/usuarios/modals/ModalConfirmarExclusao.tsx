"use client";

import { motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import type { UsuarioSistema } from "../types/usuariosSistema.types";

interface ModalConfirmarExclusaoProps {
  usuario: UsuarioSistema | null;
  aberto: boolean;
  confirmando?: boolean;
  erro?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalConfirmarExclusao({
  usuario,
  aberto,
  confirmando = false,
  erro,
  onClose,
  onConfirm,
}: ModalConfirmarExclusaoProps) {
  if (!aberto || !usuario) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-[#9F64AF]"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EAF8]">
          <Trash2 size={28} className="text-[#9F64AF]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-800">
          Excluir usuário
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          A exclusão física só é permitida para usuários sem histórico clínico.
        </p>
        <p className="mb-6 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          {usuario.nome}
        </p>

        {erro ? (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {erro}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmando}
            className="flex-1 rounded-lg bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:opacity-50"
          >
            {confirmando ? "Processando..." : "Excluir usuário"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
