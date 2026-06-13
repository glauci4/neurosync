"use client";

import { motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

interface ModalInativarClinicaProps {
  aberto: boolean;
  confirmando?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalInativarClinica({
  aberto,
  confirmando = false,
  onClose,
  onConfirm,
}: ModalInativarClinicaProps) {
  if (!aberto) return null;

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
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-[#9F64AF]"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FBE8EA]">
          <ShieldAlert size={28} className="text-[#B4232C]" />
        </div>

        <h3 className="text-lg font-semibold text-gray-800">
          Inativar clínica?
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Você é o único psicólogo administrador ativo. Ao inativar seu perfil,
          todas as contas da clínica serão desativadas e o acesso ao sistema
          será encerrado para esta clínica.
        </p>

        <div className="mt-6 flex gap-3">
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
            className="flex-1 rounded-lg bg-[#B4232C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#962128] disabled:opacity-50"
          >
            {confirmando ? "Processando..." : "Inativar clínica"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

