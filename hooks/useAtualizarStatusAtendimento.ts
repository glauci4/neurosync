// hooks/useAtualizarStatusAtendimento.ts
// Hook para atualizar apenas o status de atendimento do paciente (Fila de Espera, Em Atendimento, Encerrado)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAutenticacao } from './useAutenticacao';
import { toast } from 'sonner';

interface StatusAtendimentoResponse {
    success: boolean;
    message: string;
}

async function atualizarStatusAtendimento(
    id: number,
    status: 'fila_espera' | 'em_atendimento' | 'encerrado',
    usuarioId: number
): Promise<StatusAtendimentoResponse> {
    const response = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_atendimento: status, usuario_id: usuarioId }),
    });
    const resultado = await response.json();
    if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao atualizar status de atendimento');
    }
    return resultado;
}

export function useAtualizarStatusAtendimento() {
    const queryClient = useQueryClient();
    const { usuario } = useAutenticacao();

    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'fila_espera' | 'em_atendimento' | 'encerrado' }) => {
            if (!usuario?.id) throw new Error('Usuário não autenticado');
            return atualizarStatusAtendimento(id, status, usuario.id);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pacientes'] });
            queryClient.invalidateQueries({ queryKey: ['paciente', variables.id] });
            
            const mensagem = 
                variables.status === 'fila_espera' ? 'Paciente movido para a Fila de Espera' :
                variables.status === 'em_atendimento' ? 'Atendimento iniciado' :
                'Atendimento encerrado';
            toast.success(mensagem);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}