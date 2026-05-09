// app/pacientes/components/FiltroVisibilidadeCard.tsx
// Componente dropdown para filtrar pacientes por visibilidade (Ativos, Inativos, Todos).

'use client';

import { useEffect, useRef } from 'react';
import { UserCheck, UserMinus, Users } from 'lucide-react';

interface FiltroVisibilidadeCardProps {
    visibilidadeAtual: 'ativo' | 'inativo' | 'todos';  // Valor atualmente selecionado
    onVisibilidadeChange: (visibilidade: 'ativo' | 'inativo' | 'todos') => void; // Callback ao mudar
    onClose: () => void; // Fecha o dropdown
}

export default function FiltroVisibilidadeCard({
    visibilidadeAtual,
    onVisibilidadeChange,
    onClose,
}: FiltroVisibilidadeCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Fecha o card ao clicar em qualquer lugar fora dele (detecção de clique externo)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Verifica se uma determinada opção é a atualmente ativa
    const isActive = (valor: string) => visibilidadeAtual === valor;

    return (
        <div
            ref={cardRef}
            className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-visible"
        >
            {/* Triângulo (seta) para dar efeito de balão */}
            <div className="absolute -top-2 left-4">
                <div className="w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100" />
            </div>

            {/* Cabeçalho do dropdown */}
            <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mt-1">Filtrar pacientes</h3>
                <p className="text-xs text-gray-500">Selecione quais pacientes deseja visualizar</p>
            </div>

            {/* Opções de visibilidade */}
            <div className="p-2">
                {/* Botão ATIVOS */}
                <button
                    onClick={() => {
                        onVisibilidadeChange('ativo');
                        onClose();
                    }}
                    className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition
                        ${isActive('ativo')
                            ? 'bg-[#F3E8F7] text-[#9F64AF]'
                            : 'text-gray-700 hover:bg-gray-50'}
                    `}
                >
                    <span className="flex items-center gap-2">
                        <UserCheck size={16} />
                        Ativos
                    </span>
                    {isActive('ativo') && <span className="text-[#9F64AF]">✓</span>}
                </button>

                {/* Botão INATIVOS */}
                <button
                    onClick={() => {
                        onVisibilidadeChange('inativo');
                        onClose();
                    }}
                    className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition
                        ${isActive('inativo')
                            ? 'bg-[#F3E8F7] text-[#9F64AF]'
                            : 'text-gray-700 hover:bg-gray-50'}
                    `}
                >
                    <span className="flex items-center gap-2">
                        <UserMinus size={16} />
                        Inativos
                    </span>
                    {isActive('inativo') && <span className="text-[#9F64AF]">✓</span>}
                </button>

                {/* Botão TODOS */}
                <button
                    onClick={() => {
                        onVisibilidadeChange('todos');
                        onClose();
                    }}
                    className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition
                        ${isActive('todos')
                            ? 'bg-[#F3E8F7] text-[#9F64AF]'
                            : 'text-gray-700 hover:bg-gray-50'}
                    `}
                >
                    <span className="flex items-center gap-2">
                        <Users size={16} />
                        Todos
                    </span>
                    {isActive('todos') && <span className="text-[#9F64AF]">✓</span>}
                </button>
            </div>
        </div>
    );
}