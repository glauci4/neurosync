// app/pacientes/components/TabsStatusAtendimento.tsx
// Abas de alternância entre os status de atendimento do paciente.

'use client';

import { Clock, CheckCircle } from 'lucide-react';
import { FaComments } from 'react-icons/fa';

interface TabsStatusAtendimentoProps {
    statusAtual: 'fila_espera' | 'em_atendimento' | 'encerrado';
    onStatusChange: (status: 'fila_espera' | 'em_atendimento' | 'encerrado') => void;
    totalFilaEspera?: number;
    totalEmAtendimento?: number;
    totalEncerrados?: number;
}

export default function TabsStatusAtendimento({
    statusAtual,
    onStatusChange,
    totalFilaEspera = 0,
    totalEmAtendimento = 0,
    totalEncerrados = 0,
}: TabsStatusAtendimentoProps) {
    return (
        <div className="flex bg-[#E1D4F0] rounded-xl p-1.5 w-fit gap-1">
            {/* Fila de Espera com ícone de relógio */}
            <button
                onClick={() => onStatusChange('fila_espera')}
                className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                    ${statusAtual === 'fila_espera'
                        ? 'bg-white text-[#9F64AF] shadow-md'
                        : 'text-[#9F64AF] hover:bg-white/40'
                    }
                `}
            >
                <Clock size={18} />
                <span>Fila de Espera</span>
                {totalFilaEspera > 0 && (
                    <span className={`
                        ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                        ${statusAtual === 'fila_espera'
                            ? 'bg-[#F3E8F7] text-[#9F64AF]'
                            : 'bg-white/60 text-[#9F64AF]'
                        }
                    `}>
                        {totalFilaEspera}
                    </span>
                )}
            </button>

            {/* Em Atendimento com ícone de comentários (FaComments) */}
            <button
                onClick={() => onStatusChange('em_atendimento')}
                className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                    ${statusAtual === 'em_atendimento'
                        ? 'bg-white text-[#9F64AF] shadow-md'
                        : 'text-[#9F64AF] hover:bg-white/40'
                    }
                `}
            >
                <FaComments size={18} />
                <span>Em Atendimento</span>
                {totalEmAtendimento > 0 && (
                    <span className={`
                        ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                        ${statusAtual === 'em_atendimento'
                            ? 'bg-[#F3E8F7] text-[#9F64AF]'
                            : 'bg-white/60 text-[#9F64AF]'
                        }
                    `}>
                        {totalEmAtendimento}
                    </span>
                )}
            </button>

            {/* Encerrados com ícone de círculo com check */}
            <button
                onClick={() => onStatusChange('encerrado')}
                className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                    ${statusAtual === 'encerrado'
                        ? 'bg-white text-[#9F64AF] shadow-md'
                        : 'text-[#9F64AF] hover:bg-white/40'
                    }
                `}
            >
                <CheckCircle size={18} />
                <span>Encerrados</span>
                {totalEncerrados > 0 && (
                    <span className={`
                        ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                        ${statusAtual === 'encerrado'
                            ? 'bg-[#F3E8F7] text-[#9F64AF]'
                            : 'bg-white/60 text-[#9F64AF]'
                        }
                    `}>
                        {totalEncerrados}
                    </span>
                )}
            </button>
        </div>
    );
}