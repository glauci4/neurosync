// app/pacientes/components/BarraFiltros.tsx
"use client";

import { Search, SlidersHorizontal, Upload, UserPlus } from "lucide-react";
import { useState } from "react";
import FiltroVisibilidadeCard from "./FiltroVisibilidadeCard";

interface BarraFiltrosProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  visibilidade: "ativo" | "inativo" | "todos";
  onVisibilidadeChange: (visibilidade: "ativo" | "inativo" | "todos") => void;
  totalRegistros: number;
  onNovoPaciente: () => void;
  onImportarDados: () => void;
}

export default function BarraFiltros({
  busca,
  onBuscaChange,
  visibilidade,
  onVisibilidadeChange,
  totalRegistros,
  onNovoPaciente,
  onImportarDados,
}: BarraFiltrosProps) {
  const [filtroAberto, setFiltroAberto] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {/* Campo de busca */}
        <div className="relative w-[380px] max-w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9F64AF] focus:border-transparent bg-white text-gray-900"
          />
        </div>

        {/* Botão de filtro (visibilidade) */}
        <div className={`relative ${filtroAberto ? "z-[9999]" : ""}`}>
          <button
            type="button"
            onClick={() => setFiltroAberto(!filtroAberto)}
            className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-600"
            title="Filtrar pacientes"
          >
            <SlidersHorizontal size={18} />
          </button>

          {filtroAberto && (
            <FiltroVisibilidadeCard
              visibilidadeAtual={visibilidade}
              onVisibilidadeChange={onVisibilidadeChange}
              onClose={() => setFiltroAberto(false)}
            />
          )}
        </div>

        {/* Contador */}
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {totalRegistros} {totalRegistros === 1 ? "paciente" : "pacientes"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onImportarDados}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition bg-white/80 backdrop-blur-sm"
        >
          <Upload size={16} />
          <span>Importar Dados</span>
        </button>
        <button
          type="button"
          onClick={onNovoPaciente}
          className="flex items-center gap-2 px-5 py-2 bg-[#9F64AF] hover:bg-[#8B509B] text-white rounded-xl shadow-sm"
        >
          <UserPlus size={16} />
          <span>Novo Paciente</span>
        </button>
      </div>
    </div>
  );
}
