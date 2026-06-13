// app/pacientes/components/FiltroVisibilidadeCard.tsx
// Componente dropdown para filtrar pacientes por visibilidade (Ativos, Inativos, Todos).

"use client";

import { BrushCleaning, UserCheck, UserMinus, Users } from "lucide-react";
import { useEffect, useRef } from "react";

interface FiltroVisibilidadeCardProps {
  visibilidadeAtual: "ativo" | "inativo" | "todos"; // Valor atualmente selecionado
  onVisibilidadeChange: (visibilidade: "ativo" | "inativo" | "todos") => void; // Callback ao mudar
  onClose: () => void; // Fecha o dropdown
}

export default function FiltroVisibilidadeCard({
  visibilidadeAtual,
  onVisibilidadeChange,
  onClose,
}: FiltroVisibilidadeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const filtrosAtivos = visibilidadeAtual === "ativo" ? 0 : 1;

  // Fecha o card ao clicar em qualquer lugar fora dele (detecção de clique externo)
  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      const caminhoEvento = event.composedPath();
      if (cardRef.current && !caminhoEvento.includes(cardRef.current)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Verifica se uma determinada opção é a atualmente ativa
  const isActive = (valor: string) => visibilidadeAtual === valor;

  return (
    <div
      ref={cardRef}
      className="absolute left-0 z-[9999] mt-3 w-72 overflow-visible rounded-2xl border border-[#9F64AF]/15 bg-white shadow-2xl"
      onPointerDown={(evento) => evento.stopPropagation()}
    >
      {/* Triângulo (seta) para dar efeito de balão */}
      <div className="absolute -top-2 left-4 z-10">
        <div className="h-4 w-4 rotate-45 border-l border-t border-[#9F64AF]/15 bg-white" />
      </div>

      {/* Cabeçalho do dropdown */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mt-1">
          Filtrar pacientes
        </h3>
        <p className="text-xs text-gray-500">
          Selecione quais pacientes deseja visualizar
        </p>
      </div>

      {/* Opções de visibilidade */}
      <div className="p-2">
        {/* Botão ATIVOS */}
        <button
          type="button"
          onClick={() => {
            onVisibilidadeChange("ativo");
            onClose();
          }}
          className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition
                        ${
                          isActive("ativo")
                            ? "bg-[#F3E8F7] text-[#9F64AF]"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                    `}
        >
          <span className="flex items-center gap-2">
            <UserCheck size={16} />
            Ativos
          </span>
          {isActive("ativo") && <span className="text-[#9F64AF]">✓</span>}
        </button>

        {/* Botão INATIVOS */}
        <button
          type="button"
          onClick={() => {
            onVisibilidadeChange("inativo");
            onClose();
          }}
          className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition
                        ${
                          isActive("inativo")
                            ? "bg-[#F3E8F7] text-[#9F64AF]"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                    `}
        >
          <span className="flex items-center gap-2">
            <UserMinus size={16} />
            Inativos
          </span>
          {isActive("inativo") && <span className="text-[#9F64AF]">✓</span>}
        </button>

        {/* Botão TODOS */}
        <button
          type="button"
          onClick={() => {
            onVisibilidadeChange("todos");
            onClose();
          }}
          className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition
                        ${
                          isActive("todos")
                            ? "bg-[#F3E8F7] text-[#9F64AF]"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                    `}
        >
          <span className="flex items-center gap-2">
            <Users size={16} />
            Todos
          </span>
          {isActive("todos") && <span className="text-[#9F64AF]">✓</span>}
        </button>
      </div>
      <div className="flex items-center justify-between border-[#F3EAF8] border-t px-3 py-3">
        <span className="text-xs text-gray-400">
          {filtrosAtivos} {filtrosAtivos === 1 ? "filtro" : "filtros"}
        </span>
        <button
          type="button"
          onClick={() => {
            onVisibilidadeChange("ativo");
            onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-[#F3EAF8] hover:text-[#9F64AF]"
        >
          <BrushCleaning size={13} />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
