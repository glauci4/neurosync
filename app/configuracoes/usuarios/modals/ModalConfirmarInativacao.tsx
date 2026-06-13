"use client";

import { motion } from "framer-motion";
import { ArchiveRestore, UserMinus, X } from "lucide-react";
import type { UsuarioSistema } from "../types/usuariosSistema.types";

interface ModalConfirmarInativacaoProps {
  usuario: UsuarioSistema | null;
  aberto: boolean;
  reativar?: boolean;
  confirmando?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalConfirmarInativacao({
  usuario,
  aberto,
  reativar = false,
  confirmando = false,
  onClose,
  onConfirm,
}: ModalConfirmarInativacaoProps) {
  if (!aberto || !usuario) return null;

  const Icone = reativar ? ArchiveRestore : UserMinus;

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
          <Icone size={28} className="text-[#9F64AF]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-800">
          {reativar ? "Reativar usuário" : "Inativar usuário"}
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          {reativar
            ? `${usuario.nome} voltará a acessar o NeuroSync.`
            : "Este usuário não poderá acessar o sistema enquanto estiver inativo. O histórico vinculado será preservado."}
        </p>
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
            {confirmando
              ? "Processando..."
              : reativar
                ? "Reativar"
                : "Inativar acesso"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

