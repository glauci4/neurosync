"use client";

import { motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { useId } from "react";
import type { UsuarioSistema } from "../types/usuariosSistema.types";

interface ModalTransferirAdministracaoProps {
  aberto: boolean;
  usuarios: UsuarioSistema[];
  selecionadoId: number | null;
  onSelecionar: (id: number) => void;
  confirmando?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalTransferirAdministracao({
  aberto,
  usuarios,
  selecionadoId,
  onSelecionar,
  confirmando = false,
  onClose,
  onConfirm,
}: ModalTransferirAdministracaoProps) {
  const psicologoId = useId();

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

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EAF8]">
          <ShieldAlert size={28} className="text-[#9F64AF]" />
        </div>

        <h3 className="text-lg font-semibold text-gray-800">
          Defina um novo responsável
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Este psicólogo é o responsável pela clínica. Antes de inativá-lo,
          selecione outro psicólogo ativo para assumir essa responsabilidade.
        </p>

        <div className="mt-5 space-y-2">
          <label
            htmlFor={psicologoId}
            className="block text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            Psicólogo ativo
          </label>
          <select
            id={psicologoId}
            value={selecionadoId || ""}
            onChange={(event) => onSelecionar(Number(event.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#9F64AF] focus:ring-2 focus:ring-[#9F64AF]/15"
          >
            <option value="">Selecione</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
          {usuarios.length === 0 ? (
            <p className="text-xs text-amber-700">
              Não há outro psicólogo ativo disponível para assumir a
              responsabilidade da clínica.
            </p>
          ) : null}
        </div>

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
            disabled={confirmando || !selecionadoId}
            className="flex-1 rounded-lg bg-[#9F64AF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8B509B] disabled:opacity-50"
          >
            {confirmando ? "Processando..." : "Confirmar e inativar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
