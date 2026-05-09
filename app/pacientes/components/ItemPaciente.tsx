// app/pacientes/components/ItemPaciente.tsx
// Card de paciente clicável com botão de ação textual conforme status de atendimento.

'use client';

import { User, Smartphone, Mail } from 'lucide-react';
import { HiOutlineIdentification } from 'react-icons/hi'; // ícone de documento de identidade para CPF
import { formatarTelefone, formatarCPF } from '@/lib/utils';

interface Paciente {
    id: number;
    nome: string;
    telefone: string;
    email: string | null;
    cpf: string | null;
    ativo: boolean;
    tipo: 'adulto' | 'menor';
    status_atendimento: 'fila_espera' | 'em_atendimento' | 'encerrado';
}

interface ItemPacienteProps {
    paciente: Paciente;
    onIniciarAtendimento: (id: number) => void;
    onEncerrarAtendimento: (id: number) => void;
    onRetomarAtendimento: (id: number) => void;
    onAbrirDetalhes: (id: number) => void;
}

// Mapeia o texto do botão conforme o status (apenas para pacientes ativos)
const acaoTexto: Record<string, string> = {
    fila_espera: 'Iniciar atendimento',
    em_atendimento: 'Encerrar atendimento',
    encerrado: 'Retomar atendimento',
};

export default function ItemPaciente({
    paciente,
    onIniciarAtendimento,
    onEncerrarAtendimento,
    onRetomarAtendimento,
    onAbrirDetalhes,
}: ItemPacienteProps) {
    const status = paciente.status_atendimento;
    const isAtivo = paciente.ativo;

    // Função que chama a ação correta com base no status (somente se ativo)
    const handleAcao = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAtivo) return;
        if (status === 'fila_espera') onIniciarAtendimento(paciente.id);
        else if (status === 'em_atendimento') onEncerrarAtendimento(paciente.id);
        else if (status === 'encerrado') onRetomarAtendimento(paciente.id);
    };

    return (
        <div
            onClick={() => onAbrirDetalhes(paciente.id)}
            className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 hover:shadow-md hover:bg-gray-50/50 transition-all duration-200 cursor-pointer group"
        >
            {/* Informações do paciente */}
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <User size={16} className="text-gray-400 shrink-0" />
                    <h3 className="text-base font-semibold text-gray-800">{paciente.nome}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        {paciente.tipo === 'adulto' ? 'Adulto' : 'Menor'}
                    </span>
                    {/* Badge do status de atendimento */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        status === 'fila_espera' ? 'bg-yellow-100 text-yellow-700' :
                        status === 'em_atendimento' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                        {status === 'fila_espera' && 'Fila de Espera'}
                        {status === 'em_atendimento' && 'Em Atendimento'}
                        {status === 'encerrado' && 'Encerrado'}
                    </span>
                    {/* Badge adicional para paciente inativo */}
                    {!isAtivo && (
                          <span className="text-xs px-2 py-0.5 bg-gray-400 text-gray-900 rounded-full">
                            Inativo
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {paciente.telefone && (
                        <div className="flex items-center gap-1 text-gray-500">
                            <Smartphone size={12} /> {/* Ícone de smartphone */}
                            <span>{formatarTelefone(paciente.telefone)}</span>
                        </div>
                    )}
                    {paciente.email && (
                        <div className="flex items-center gap-1 text-gray-500">
                            <Mail size={12} />
                            <span className="truncate max-w-[200px]">{paciente.email}</span>
                        </div>
                    )}
                    {paciente.cpf && (
                        <div className="flex items-center gap-1 text-gray-500">
                            <HiOutlineIdentification size={12} /> {/* Ícone de identificação para CPF */}
                            <span>{formatarCPF(paciente.cpf)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Botão de ação textual, só aparece se paciente estiver ativo */}
            {isAtivo && (
                <button
                    onClick={handleAcao}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition bg-gray-100 text-gray-700 hover:bg-[#9F64AF] hover:text-white shadow-sm"
                >
                    {acaoTexto[status]}
                </button>
            )}
        </div>
    );
}