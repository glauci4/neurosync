// app/pacientes/components/EstadoVazio.tsx
// Estado vazio para quando não há pacientes cadastrados ou nenhum resultado de busca.

'use client';

import { Clock, Stethoscope, CheckCircle, Users, UserMinus, UserPlus } from 'lucide-react';

interface EstadoVazioProps {
    status: 'ativo' | 'inativo';                           // Para compatibilidade (usado em contexto de visibilidade)
    tipoVazio?: 'fila_espera' | 'em_atendimento' | 'encerrado' | 'inativos'; // Tipo específico de vazio (abas)
    onNovoPaciente?: () => void;                           // Callback para abrir modal de cadastro
    mensagemPersonalizada?: string;                        // Mensagem customizada (ex: busca sem resultados)
}

export default function EstadoVazio({
    status,
    tipoVazio,
    onNovoPaciente,
    mensagemPersonalizada,
}: EstadoVazioProps) {
    let titulo = '';
    let subtitulo = '';
    let Icone = Users; // ícone padrão

    // Se há mensagem personalizada (ex: busca vazia), usa ela
    if (mensagemPersonalizada) {
        titulo = mensagemPersonalizada;
        subtitulo = 'Tente outros termos ou cadastre um novo paciente.';
        Icone = status === 'ativo' ? Users : UserMinus;
    }
    // Se há tipoVazio, define mensagem e ícone específicos
    else if (tipoVazio) {
        switch (tipoVazio) {
            case 'fila_espera':
                titulo = 'Nenhum paciente na fila de espera';
                subtitulo = 'Pacientes aguardando atendimento aparecerão aqui.';
                Icone = Clock;
                break;
            case 'em_atendimento':
                titulo = 'Nenhum paciente em atendimento';
                subtitulo = 'Pacientes em atendimento aparecerão aqui.';
                Icone = Stethoscope;
                break;
            case 'encerrado':
                titulo = 'Nenhum paciente encerrado';
                subtitulo = 'Pacientes com atendimento encerrado aparecerão aqui.';
                Icone = CheckCircle;
                break;
            case 'inativos':
                titulo = 'Nenhum paciente inativado';
                subtitulo = 'Pacientes inativos aparecerão aqui.';
                Icone = UserMinus;
                break;
        }
    }
    // Caso contrário, usa os valores padrão baseados no status (ativo/inativo)
    else {
        const isAtivo = status === 'ativo';
        titulo = isAtivo ? 'Nenhum paciente ativo cadastrado' : 'Nenhum paciente inativo';
        subtitulo = isAtivo
            ? 'Comece adicionando seu primeiro paciente'
            : 'Pacientes inativos aparecerão aqui';
        Icone = isAtivo ? Users : UserMinus;
    }

    const handleClick = () => {
        if (onNovoPaciente) onNovoPaciente();
    };

    // Botão "Adicionar Paciente" só aparece quando: não há mensagem personalizada (busca ativa) e o status é 'ativo' (apenas na aba "Ativos" para evitar botão em abas de atendimento ou inativos)
    const mostrarBotao = !mensagemPersonalizada && !tipoVazio && status === 'ativo' && onNovoPaciente;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-[#F3EAF8] rounded-full flex items-center justify-center mb-4">
                <Icone size={32} className="text-[#9F64AF]" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">{titulo}</h3>
            <p className="text-sm text-gray-400 mb-6">{subtitulo}</p>

            {mostrarBotao && (
                <button
                    onClick={handleClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#9F64AF] hover:bg-[#8B509B] text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <UserPlus size={16} />
                    <span className="text-sm font-medium">Adicionar Paciente</span>
                </button>
            )}
        </div>
    );
}