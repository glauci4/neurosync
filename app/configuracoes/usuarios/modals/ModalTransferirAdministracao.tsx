"use client";

import { motion } from "framer-motion";
import { X, Check, ChevronDown } from "lucide-react";
import { useId, useEffect, useRef, useState } from "react";
import { MdErrorOutline } from "react-icons/md";
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

  function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
      function onPointerDown(e: PointerEvent) {
        if (!ref.current) return;
        if (ref.current.contains(e.target as Node)) return;
        handler();
      }
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [ref, handler]);
  }

  function DropdownSimple({
    id,
    opcoes,
    valor,
    placeholder,
    onChange,
  }: {
    id: string;
    opcoes: UsuarioSistema[];
    valor: number | null;
    placeholder?: string;
    onChange: (id: number) => void;
  }) {
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useClickOutside(containerRef, () => setAberto(false));

    return (
      <div ref={containerRef} className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition border-gray-200 text-gray-800 hover:border-[#9F64AF]/50 focus:border-[#9F64AF] focus:ring-2 focus:ring-[#9F64AF]/15"
        >
          <span className={valor ? "truncate" : "truncate text-gray-400"}>
            {opcoes.find((o) => o.id === valor)?.nome || placeholder || "Selecione"}
          </span>
          <ChevronDown size={16} className={`shrink-0 text-[#9F64AF] transition ${aberto ? "rotate-180" : ""}`} />
        </button>

        {aberto ? (
          <div className="absolute left-0 right-0 z-[10000] mt-2 overflow-hidden rounded-xl border border-[#E8DDF0] bg-white shadow-xl">
            <div className="max-h-44 overflow-y-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9F64AF]/60">
              {opcoes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">Nenhum psicólogo ativo disponível.</p>
              ) : (
                opcoes.map((opcao) => {
                  const ativo = opcao.id === valor;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => {
                        onChange(opcao.id);
                        setAberto(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#F7F1FA] ${ativo ? "bg-[#F3EAF8] text-[#7E4A8F]" : "text-gray-700"}`}
                    >
                      <span className="truncate">{opcao.nome}</span>
                      {ativo ? <Check size={15} className="shrink-0 text-[#9F64AF]" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }


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
          <div>
            <DropdownSimple
              id={psicologoId}
              opcoes={usuarios}
              valor={selecionadoId}
              placeholder="Selecione"
              onChange={(id) => onSelecionar(id)}
            />
            {usuarios.length === 0 ? (
              <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
                <MdErrorOutline size={14} className="mt-0.5 text-amber-700" />
                Não há outro psicólogo ativo disponível para assumir a
                responsabilidade da clínica.
              </p>
            ) : null}
          </div>
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
